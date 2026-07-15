// Smooth and lengthen the shipped motion clips, in place.
//
// Two things made the raw Veo clips read as "weird": the tempo (4s reps feel
// rushed and mechanical) and the loop seam (straight clips end near-but-not-at
// their first frame, so every cycle jump-cuts). This pass:
//   1. slows every clip 1.4x, THEN optical-flow interpolates to a true 30fps
//      (order matters — interpolating first and stretching after just plays
//      30fps frames at 21fps),
//   2. for straight (non-palindromed) clips, crossfades the tail into the head
//      and trims, the standard seamless-loop construction. Palindromed clips
//      already start and end on the same frame and are left seam-untouched.
//
// Usage: node scripts/smooth-motion.mjs [ids…]   (no args = all clips on disk)

import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const DIR = 'public/motion';
const SLOW = 1.4;
const FADE = 0.5; // seconds of tail-into-head crossfade on straight clips

// Clips built by palindrome-motion.mjs — frame-exact loops already.
const PALINDROMED = new Set([
  'glute-bridge',
  'band-glute-bridge',
  'db-rdl',
  'box-squat',
  'goblet-squat',
  'mcgill-bird-dog',
  'dead-bug',
]);

const requested = process.argv.slice(2);
const ids = requested.length
  ? requested
  : fs.readdirSync(DIR).filter((f) => f.endsWith('.mp4')).map((f) => f.replace(/\.mp4$/, ''));

for (const id of ids) {
  const file = path.join(DIR, `${id}.mp4`);
  const tmp = path.join(DIR, `${id}.smooth.mp4`);
  const dur = Number(
    spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file], {
      encoding: 'utf8',
    }).stdout.trim()
  );
  const slowed = dur * SLOW;
  const smooth = `setpts=${SLOW}*PTS,minterpolate=fps=30:mi_mode=mci:mc_mode=aobmc:vsbmc=1`;
  const filter = PALINDROMED.has(id)
    ? `[0:v]${smooth}[out]`
    : `[0:v]${smooth},split=2[v1][v2];` +
      `[v2]trim=0:${FADE},setpts=PTS-STARTPTS[head];` +
      `[v1][head]xfade=transition=fade:duration=${FADE}:offset=${(slowed - FADE).toFixed(3)}[x];` +
      `[x]trim=${FADE},setpts=PTS-STARTPTS[out]`;
  execFileSync('ffmpeg', [
    '-y', '-loglevel', 'error', '-i', file,
    '-filter_complex', filter, '-map', '[out]',
    '-an', '-c:v', 'libx264', '-crf', '27', '-preset', 'slow', '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart', tmp,
  ]);
  fs.renameSync(tmp, file);
  console.log(`  ✓ ${id}: ${dur.toFixed(1)}s → ~${(PALINDROMED.has(id) ? slowed : slowed - FADE).toFixed(1)}s smooth loop`);
}
