/**
 * Generate per-exercise muscle-activation maps.
 * A clean anatomical figure (front or back) with the TARGET / SQUEEZE muscles
 * glowing red, in the same vintage instructional style as the form images.
 *
 * Usage: export $(grep -v '^#' ~/code/imagineplay/.env | xargs) && npx tsx scripts/generate-muscle-maps.ts [id...]
 */

import * as fs from 'fs';
import * as path from 'path';

const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY;
if (!GOOGLE_AI_API_KEY) {
  console.error('Missing GOOGLE_AI_API_KEY. Run: export $(grep -v "^#" ~/code/imagineplay/.env | xargs)');
  process.exit(1);
}

// Nano Banana 2. Chosen empirically, not by version number.
//
// The previous default, gemini-3-pro-image-preview (Nano Banana Pro), could not draw an
// occluded far-side limb: across five rounds of prompting it produced a dead bug with one
// arm, an RDL whose far arm was a hairline with no shoulder or elbow, and a B-stance RDL
// missing an arm. It also could not fold the knees for a side-lying clamshell. Given the
// identical prompt, gemini-3.1-flash-image drew both correctly on the first attempt.
//
// Override with IMAGE_MODEL=... to A/B:
//   gemini-3.1-flash-image      = Nano Banana 2      (current default)
//   gemini-3-pro-image          = Nano Banana Pro, GA alias
//   gemini-3-pro-image-preview  = Nano Banana Pro, preview alias
//   gemini-2.5-flash-image      = Nano Banana (v1)
const IMAGE_MODEL = process.env.IMAGE_MODEL ?? 'gemini-3.1-flash-image';
const OUTPUT_DIR = path.join(process.cwd(), 'public', 'exercises', 'muscles');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const STYLE_GUIDE = `=== VINTAGE ANATOMICAL MUSCLE-MAP STYLE GUIDE ===

Create a clean anatomical muscle chart in the style of a classic 1950s-1960s fitness manual / medical illustration.

THE FIGURE:
- A single athletic human figure, standing in a neutral anatomical pose (arms slightly away from the sides, legs straight)
- Traditional pen-and-ink line drawing with light crosshatching for shading
- Bold black ink outlines, anatomically accurate musculature visible
- EXACTLY 2 arms and 2 legs, one head — correct human anatomy
- The whole body fits in frame, centered

COLOR PALETTE (USE ONLY THESE):
- Background: warm cream / off-white (#F5F0E6)
- Body linework and non-target muscles: black ink on cream (no color fill)
- TARGET muscles: filled bold RED (#c41e3a) with a soft red glow/halo around them so they clearly stand out as the muscle being worked and squeezed
- Secondary muscles: a lighter, paler red wash (less saturated) — clearly less prominent than the primary

HIGHLIGHTING:
- The PRIMARY target muscle(s) must GLOW bright red — this is the muscle to squeeze and feel
- Make the highlight unmistakable: it should read at a glance which muscle is the focus
- Do NOT highlight any other muscles in red

COMPOSITION:
- Plain cream background, no scenery
- NO text, NO labels, NO arrows, NO watermark
- Square format, figure fills ~80% of the frame
- The cream background runs edge-to-edge. Do NOT draw any border, frame, outline box, or
  rectangle around the illustration — no framing lines of any kind, no inset rule, no
  vignette, no paper edge.`;

interface MuscleMap {
  id: string;
  view: 'front' | 'back';
  primary: string; // anatomical description, glows bright red
  secondary?: string; // paler red
}

const MAPS: MuscleMap[] = [
  // Core & abs
  { id: 'mcgill-curl-up', view: 'front', primary: 'the rectus abdominis (the six-pack abs down the front of the torso)' },
  { id: 'mcgill-side-plank', view: 'front', primary: 'the external obliques (the muscles on both sides of the waist)' },
  { id: 'mcgill-bird-dog', view: 'back', primary: 'the gluteus maximus (buttocks) and the spinal erectors along the lower back' },
  { id: 'dead-bug', view: 'front', primary: 'the lower rectus abdominis and deep transverse abdominis (lower belly / deep core)' },
  // Note: secondaries must be visible from the chosen view — no glutes on a front view.
  { id: 'front-plank', view: 'front', primary: 'the rectus abdominis (front abs)' },
  { id: 'hollow-hold', view: 'front', primary: 'the lower rectus abdominis (lower abs)' },
  { id: 'pallof-press', view: 'front', primary: 'the external obliques on both sides of the waist (the anti-rotation core)' },
  // Strength (glutes / lower)
  { id: 'glute-bridge', view: 'back', primary: 'the gluteus maximus (both buttocks)', secondary: 'the hamstrings' },
  { id: 'band-glute-bridge', view: 'back', primary: 'the gluteus maximus and gluteus medius (buttocks and upper outer hip)' },
  { id: 'hip-thrust', view: 'back', primary: 'the gluteus maximus (buttocks)', secondary: 'the hamstrings (back of thigh)' },
  { id: 'single-leg-glute-bridge', view: 'back', primary: 'the gluteus maximus (buttocks)', secondary: 'the hamstrings' },
  { id: 'kb-deadlift', view: 'back', primary: 'the gluteus maximus and the hamstrings (back of thighs)', secondary: 'the spinal erectors (lower back)' },
  { id: 'db-rdl', view: 'back', primary: 'the hamstrings (back of the thighs)', secondary: 'the gluteus maximus' },
  { id: 'b-stance-rdl', view: 'back', primary: 'the gluteus maximus and the hamstrings (back of the thigh)', secondary: 'the spinal erectors (lower back)' },
  { id: 'box-squat', view: 'back', primary: 'the gluteus maximus (buttocks)', secondary: 'the hamstrings (back of thighs)' },
  { id: 'goblet-squat', view: 'back', primary: 'the gluteus maximus (buttocks)', secondary: 'the hamstrings (back of thighs)' },
  { id: 'farmers-carry', view: 'back', primary: 'the trapezius (upper back) and the forearm muscles', secondary: 'the spinal erectors and core' },
  { id: 'kb-swing', view: 'back', primary: 'the gluteus maximus and hamstrings', secondary: 'the spinal erectors' },
  {
    id: 'band-lateral-walk',
    view: 'back',
    primary:
      'ONLY the gluteus medius: a small fan-shaped muscle at the UPPER OUTER corner of each hip, sitting just below the waistline on the SIDE of the pelvis, ABOVE and to the OUTSIDE of the main buttock. Do NOT color the large central buttock muscles (gluteus maximus) — they stay plain ink. Only the two small upper-outer-hip regions glow red',
  },
  { id: 'band-monster-walk', view: 'back', primary: 'the gluteus maximus and gluteus medius (buttocks and outer hip)' },
  {
    id: 'band-clamshell',
    view: 'back',
    primary:
      'ONLY the gluteus medius: a small fan-shaped muscle at the UPPER OUTER corner of each hip, sitting just below the waistline on the SIDE of the pelvis, ABOVE and to the OUTSIDE of the main buttock. Do NOT color the large central buttock muscles (gluteus maximus) — they stay plain ink. Only the two small upper-outer-hip regions glow red',
  },
  { id: 'band-kickback', view: 'back', primary: 'the gluteus maximus (the buttocks)', secondary: 'the hamstrings (back of the thigh)' },
  // Arms
  { id: 'db-bicep-curl', view: 'front', primary: 'the biceps (front of both upper arms)' },
  { id: 'db-overhead-press', view: 'front', primary: 'the deltoids (shoulder muscles)', secondary: 'the triceps' },
  { id: 'db-tricep-kickback', view: 'back', primary: 'the triceps (back of both upper arms)' },
  { id: 'db-lateral-raise', view: 'front', primary: 'the lateral deltoids (the outer/side of both shoulders)' },
  { id: 'push-up', view: 'front', primary: 'the pectorals (chest)', secondary: 'the triceps and front deltoids' },
  { id: 'incline-push-up', view: 'front', primary: 'the pectorals (chest)', secondary: 'the triceps and front deltoids' },
  { id: 'band-row', view: 'back', primary: 'the latissimus dorsi (the broad muscles of the mid and outer back) and the rhomboids between the shoulder blades', secondary: 'the biceps' },
  { id: 'db-row', view: 'back', primary: 'the latissimus dorsi (the broad muscle down the side of the back) and the rhomboids between the shoulder blades', secondary: 'the biceps and rear deltoid' },
  { id: 'band-pull-apart', view: 'back', primary: 'the rhomboids and mid-trapezius (upper back between the shoulder blades) and the rear deltoids' },
  // Mobility — highlight the muscle being stretched / felt
  { id: '90-90', view: 'back', primary: 'the deep hip rotators and the gluteus maximus (where the stretch is felt deep in the hips)' },
  { id: 'deep-squat-hold', view: 'back', primary: 'the gluteus maximus and the hip area', secondary: 'the calves' },
  { id: 'couch-stretch', view: 'front', primary: 'the hip flexors (front of the hip) and the quadriceps (front of the thigh) — the muscles being stretched' },
  { id: 'pigeon-stretch', view: 'back', primary: 'the gluteus maximus and deep piriformis (the deep glute being stretched)' },
];

async function generate(map: MuscleMap): Promise<boolean> {
  const viewDesc =
    map.view === 'front'
      ? 'ANTERIOR (front) view — the figure faces the viewer.'
      : 'POSTERIOR (back) view — we see the figure from behind (back of the body).';

  const prompt = `${STYLE_GUIDE}

=== VIEW ===
${viewDesc}

=== MUSCLE TO HIGHLIGHT (glowing bright red — this is what to squeeze and feel) ===
${map.primary}
${map.secondary ? `\n=== SECONDARY MUSCLE (paler red, less prominent) ===\n${map.secondary}` : ''}

FINAL REMINDERS:
- Single anatomically correct standing figure, cream background
- ONLY the named target muscle(s) glow red; everything else is black ink on cream
- No text, no labels, no arrows`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${IMAGE_MODEL}:generateContent?key=${GOOGLE_AI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseModalities: ['TEXT', 'IMAGE'],
            imageConfig: { aspectRatio: '1:1', imageSize: '2K' },
          },
        }),
      }
    );
    if (!res.ok) {
      console.error(`  API error ${res.status}: ${await res.text()}`);
      return false;
    }
    const data = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ inlineData?: { data: string } }> } }>;
    };
    const parts = data.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData) {
        fs.writeFileSync(path.join(OUTPUT_DIR, `${map.id}.png`), Buffer.from(part.inlineData.data, 'base64'));
        console.log(`  ✓ ${map.id}.png`);
        return true;
      }
    }
    console.error(`  ✗ No image for ${map.id}`);
    return false;
  } catch (e) {
    console.error(`  ✗ Error for ${map.id}:`, e);
    return false;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const todo = args.length > 0 ? MAPS.filter((m) => args.includes(m.id)) : MAPS;
  console.log(`\nMuscle maps — ${IMAGE_MODEL}\nOutput: ${OUTPUT_DIR}\n`);
  let ok = 0;
  for (const m of todo) {
    console.log(`Generating: ${m.id}...`);
    if (await generate(m)) ok++;
    await new Promise((r) => setTimeout(r, 2000));
  }
  console.log(`\nDone: ${ok}/${todo.length}\n`);
}

main();
