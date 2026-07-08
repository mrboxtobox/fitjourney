#!/usr/bin/env node
//
// Mechanical illustration checks. Not a substitute for looking at the images — a wrong
// pose, a mirrored ghost, or a disembodied limb sails straight through this. It catches
// the two defects a machine sees better than a human skimming 79 files:
//
//   1. BORDER FRAMES. The single most frequent model failure. A frame is a LINE — a large
//      fraction of one inset ring rendered in dark ink — not merely a dark pixel near the
//      edge. Detecting it by "is there a dark pixel in the outer ring" gives false negatives
//      (a frame inset 60px is missed) and false positives (a chair leg touching the edge).
//   2. OFF-PALETTE COLOUR. Cream, navy, black ink, red. Nothing else.
//
// Usage: node scripts/check-illustrations.mjs [--json]

import { readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

const DIRS = ['public/exercises', 'public/exercises/muscles'];
const FRAME_SOLID_SIDES = 2; // this many inked sides = a drawn frame
const SIDE_INKED_FRACTION = 0.6; // a side counts as 'inked' at this coverage
const MAX_INSET = 80;
const DARK = 140;

async function load(path) {
  const { data, info } = await sharp(path)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { data, w: info.width, h: info.height, ch: info.channels };
}

function luma(d, i) {
  return 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
}

// A frame is a near-solid inked LINE running the length of a side.
//
// Two earlier versions of this check were wrong, and the way they were wrong is instructive:
//   - "is any pixel in the outer ring dark?" → false positives (a chair leg touching the edge)
//     and false negatives (a frame inset 60px from the edge).
//   - "is one whole inset RING mostly dark?" → missed `mcgill-side-plank`, whose frame is drawn
//     at inset 40px on the left but 64px on the top. A hand-drawn rectangle is not square.
//
// So: score each SIDE independently, at its own best inset. Two or more sides running as solid
// ink is a frame, wherever each one happens to sit.
function frameScore({ data, w, h, ch }) {
  const at = (x, y) => luma(data, (y * w + x) * ch);
  const bestPerSide = [0, 0, 0, 0]; // top, bottom, left, right
  const insetPerSide = [0, 0, 0, 0];

  for (let i = 2; i < Math.min(MAX_INSET, Math.floor(Math.min(w, h) / 2)); i++) {
    const side = [0, 0, 0, 0];
    const count = [0, 0, 0, 0];
    for (let x = i; x < w - i; x += 3) {
      if (at(x, i) < DARK) side[0]++;
      count[0]++;
      if (at(x, h - 1 - i) < DARK) side[1]++;
      count[1]++;
    }
    for (let y = i; y < h - i; y += 3) {
      if (at(i, y) < DARK) side[2]++;
      count[2]++;
      if (at(w - 1 - i, y) < DARK) side[3]++;
      count[3]++;
    }
    for (let k = 0; k < 4; k++) {
      const frac = side[k] / count[k];
      if (frac > bestPerSide[k]) {
        bestPerSide[k] = frac;
        insetPerSide[k] = i;
      }
    }
  }

  const solid = bestPerSide.filter((f) => f >= SIDE_INKED_FRACTION).length;
  return { sides: solid, bestPerSide, insetPerSide };
}

// Cream / navy / black ink / red. Anything strongly saturated that is neither red nor navy
// is off-palette. Red must be tested by HUE, not by `r > g * 1.5`: the muscle maps' pale-red
// secondary wash is a pink whose green channel is high, and a ratio test wrongly rejects it.
function hueDegrees(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  if (d === 0) return 0;
  let h;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  h *= 60;
  return h < 0 ? h + 360 : h;
}

// Reported as a WARNING, never a hard failure, and the reason is worth recording.
//
// `box-squat`'s off-palette brown crate measures 0.146% of pixels. Anti-alias fringing on a
// perfectly clean image reaches 0.099%. Those two are not separable by a count threshold, and a
// check that cannot discriminate must not be allowed to fail a build — it would either miss the
// crate or cry wolf on every clean file. So this prints the dominant off-palette hue and leaves
// the judgement to whoever is looking at the image.
function offPalette({ data, w, h, ch }) {
  let off = 0;
  let sampled = 0;
  const hueBuckets = new Map();
  for (let y = 0; y < h; y += 4) {
    for (let x = 0; x < w; x += 4) {
      const i = (y * w + x) * ch;
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const max = Math.max(r, g, b), min = Math.min(r, g, b);
      const v = max / 255;
      const s = max === 0 ? 0 : (max - min) / max;
      sampled++;
      if (s < 0.35 || v < 0.25) continue; // greys, cream, ink, navy-ish darks
      const hue = hueDegrees(r, g, b);
      const isRed = hue <= 22 || hue >= 338; // includes the pale pink secondary wash
      const isNavy = hue >= 200 && hue <= 260;
      if (!isRed && !isNavy) {
        off++;
        const bucket = Math.floor(hue / 10) * 10;
        hueBuckets.set(bucket, (hueBuckets.get(bucket) ?? 0) + 1);
      }
    }
  }
  const dominant = [...hueBuckets.entries()].sort((a, b) => b[1] - a[1])[0];
  return { fraction: off / sampled, dominantHue: dominant?.[0] ?? null };
}

// The cream field must run edge to edge. `box-squat` once came back with an 82px band of pure
// WHITE around the artwork — a frame made of absence, which the dark-ink frame check above is
// structurally incapable of seeing. Compare the corner pixels against the image's own cream.
function whiteMargin({ data, w, h, ch }) {
  const px = (x, y) => {
    const i = (y * w + x) * ch;
    return [data[i], data[i + 1], data[i + 2]];
  };
  // Cream, sampled well inside the artwork but away from the figure: the four inner corners.
  const inner = [
    px(Math.floor(w * 0.12), Math.floor(h * 0.12)),
    px(Math.floor(w * 0.88), Math.floor(h * 0.12)),
    px(Math.floor(w * 0.12), Math.floor(h * 0.88)),
    px(Math.floor(w * 0.88), Math.floor(h * 0.88)),
  ];
  const creamB = inner.map((c) => c[2]).sort((a, b) => a - b)[1]; // median-ish blue channel
  // Cream is warm: its blue channel is well below its red. Pure white has them equal.
  const edge = [px(2, 2), px(w - 3, 2), px(2, h - 3), px(w - 3, h - 3)];
  const edgeIsWhite = edge.every(([r, , b]) => b > creamB + 12 && r - b < 8 && b > 235);
  return edgeIsWhite;
}

const json = process.argv.includes('--json');
const results = [];

for (const dir of DIRS) {
  if (!existsSync(dir)) continue;
  for (const file of readdirSync(dir).filter((f) => /\.(webp|png)$/.test(f)).sort()) {
    const path = join(dir, file);
    const img = await load(path);
    const frame = frameScore(img);
    const off = offPalette(img);
    const white = whiteMargin(img);
    const problems = [];
    const warnings = [];
    // Two or more sides drawn as near-solid ink at the same inset is a frame, however
    // ragged the remaining sides are.
    if (frame.sides >= FRAME_SOLID_SIDES) {
      const detail = frame.bestPerSide
        .map((f, k) => (f >= SIDE_INKED_FRACTION ? `${['top', 'bottom', 'left', 'right'][k]}@${frame.insetPerSide[k]}px` : null))
        .filter(Boolean)
        .join(', ');
      problems.push(`border frame (${frame.sides} inked sides: ${detail})`);
    }
    if (white) {
      problems.push('white margin around the artwork (the cream must run edge to edge)');
    }
    if (off.fraction > 0.001) {
      warnings.push(
        `possible off-palette colour: ${(off.fraction * 100).toFixed(3)}% of pixels, dominant hue ~${off.dominantHue}deg (anti-alias fringing reaches ~0.1%; look at the image)`
      );
    }
    results.push({ path, problems, warnings });
  }
}

const bad = results.filter((r) => r.problems.length);
const warned = results.filter((r) => r.warnings.length && !r.problems.length);

if (json) {
  console.log(JSON.stringify({ checked: results.length, failures: bad, warnings: warned }, null, 2));
} else {
  for (const r of bad) console.log(`FAIL  ${r.path}\n      ${r.problems.join('; ')}`);
  for (const r of warned) console.log(`WARN  ${r.path}\n      ${r.warnings.join('; ')}`);
  console.log(`\n${results.length} images checked, ${bad.length} failures, ${warned.length} warnings.`);
  console.log('This catches border frames reliably. It CANNOT see a wrong pose, a mirrored');
  console.log('ghost, a disembodied limb, or a band drawn as a stripe. A human must look.');
}

process.exit(bad.length ? 1 : 0);
