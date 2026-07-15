// True stylized animations — one Veo 3.1 clip per dynamic exercise.
//
// Each clip is seeded with the exercise's reviewed START frame (<id>-a.webp) so the
// video begins in a pose a human already approved, and the prompt narrates exactly
// one slow repetition. Veo keeps the vintage ink style remarkably well; what drifts
// is MOTION over time, so clips are 4s (one rep, no room to wander) with hard
// constraints per pose family. Output: public/motion/<id>.mp4 — pillarbox cropped,
// audio stripped, h264, ~0.5MB each. Runtime-cached, never precached.
//
// Run: GOOGLE_AI_API_KEY=... npx tsx scripts/generate-motion-videos.ts [ids…]
// REVIEW every clip via a contact sheet (ffmpeg tile) before shipping — Veo's
// failure mode is the movement morphing into a different exercise midway.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';

const KEY = process.env.GOOGLE_AI_API_KEY;
if (!KEY) {
  console.error('GOOGLE_AI_API_KEY is required');
  process.exit(1);
}

const MODEL = process.env.VEO_MODEL ?? 'veo-3.1-fast-generate-preview';
const EXERCISE_DIR = path.join(process.cwd(), 'public', 'exercises');
const OUT_DIR = path.join(process.cwd(), 'public', 'motion');
fs.mkdirSync(OUT_DIR, { recursive: true });

const STYLE =
  'Vintage 1950s fitness-manual pen-and-ink instructional animation, hand-drawn ink line art on ' +
  'cream paper, navy blue clothing, black crosshatch shading. Static camera, no zoom, no pan — the ' +
  'drawing itself animates like a classic instructional loop.';

const NEGATIVE =
  'photorealistic, 3d, photograph, camera movement, zoom, pan, text, watermark, color shift, ' +
  'extra people, extra limbs';

// The floor-pose anchor that stopped the prototype drifting into a sit-up.
const FLOOR = 'Her head, shoulders and both arms stay flat on the floor for the entire video; both feet stay planted.';
const FLOOR_M = FLOOR.replace(/Her|her/g, (m) => (m === 'Her' ? 'His' : 'his'));

interface VideoSpec {
  id: string;
  motion: string; // exactly one repetition, described start → top → back
  seed?: string; // seed frame under public/exercises; defaults to <id>-a.webp
  negative?: string; // appended to the shared negative prompt
}

const SPECS: VideoSpec[] = [
  // Bridges seed from the TOP frame: seeded from the floor, Veo's prior morphs the
  // lift into a crab/reverse-tabletop with the torso propped on straight arms.
  { id: 'glute-bridge', seed: 'glute-bridge-b.webp', motion: `The woman performs EXACTLY ONE slow glute bridge repetition starting at the top: from this bridge position she lowers her hips to the floor, pauses, then drives through her heels back up to the same bridge. ${FLOOR} Her arms stay flat at her sides — she NEVER props up onto her hands.`, negative: 'crab position, reverse tabletop, propping up on hands, sitting up' },
  { id: 'band-glute-bridge', seed: 'band-glute-bridge-b.webp', motion: `The man performs EXACTLY ONE slow banded glute bridge repetition starting at the top: from this bridge he lowers his hips to the floor, pauses, then lifts back up to the same bridge — the red band above his knees staying taut. ${FLOOR_M} His arms stay flat at his sides — he NEVER props up onto his hands.`, negative: 'crab position, reverse tabletop, propping up on hands, sitting up' },
  { id: 'single-leg-glute-bridge', motion: `The woman performs EXACTLY ONE slow single-leg glute bridge: driving through the planted foot she lifts her hips high, the extended leg rising in line with her torso, then lowers back down. The extended leg stays straight throughout. ${FLOOR}` },
  { id: 'hip-thrust', seed: 'hip-thrust-b.webp', motion: `The woman performs EXACTLY ONE slow hip thrust repetition starting at the top: from this position with her torso horizontal she lowers her hips toward the floor, pauses, then drives them back up until her torso is horizontal again, the dumbbell riding on her hips. Her upper back never leaves the bench edge; feet stay planted; large clear hip movement.`, negative: 'frozen, motionless, feet sliding' },
  { id: 'dead-bug', motion: `The woman performs EXACTLY ONE slow dead bug repetition: ONLY her left arm lowers overhead while ONLY her right leg extends long and hovers — her right arm keeps pointing straight up at the ceiling and her left knee stays bent above the hip the WHOLE time — then the moving arm and leg return to the start. Her low back stays pressed down; her head stays down; her feet never rest on the floor.`, negative: 'both arms moving together, both legs moving together, feet resting on floor' },
  { id: 'mcgill-bird-dog', seed: 'mcgill-bird-dog-b.webp', motion: `The man performs EXACTLY ONE slow bird dog repetition starting extended: from this position — one arm straight forward, the opposite leg STRAIGHT back with the knee locked, both level with his flat back — he slowly returns that hand and knee to the floor, pauses on all fours, then extends the same straight arm and straight leg back out. The moving leg stays STRAIGHT whenever it is off the floor; hips square; the supporting limbs never move.`, negative: 'bent knee kick, donkey kick, leg curling' },
  { id: 'band-clamshell', motion: `The woman performs EXACTLY ONE slow clamshell repetition: lying on her side with knees bent, her top KNEE rotates open like a book cover hinging at the feet, pauses, then closes. Her FEET stay pressed together the entire time — they never separate; the red band stays above her knees; her pelvis stays still.`, negative: 'feet separating, leg raise, straight leg lifting' },
  { id: 'kb-deadlift', motion: `The woman performs EXACTLY ONE slow kettlebell deadlift: from the hinged position she stands tall, hips driving forward, the kettlebell rising close to her legs until it hangs in front of her thighs, then she hinges back down with a flat back. Her back never rounds; feet stay planted.` },
  { id: 'db-rdl', motion: `The woman performs EXACTLY ONE slow dumbbell RDL: from the hinged position she stands tall as the dumbbells slide up the front of her legs, then hinges back down, hips travelling backward, dumbbells staying close to her legs. Flat back throughout; feet planted. She holds the ONLY two dumbbells in the scene — the floor stays empty.`, negative: 'dumbbells on the floor, extra equipment, duplicate weights' },
  { id: 'b-stance-rdl', motion: `The woman performs EXACTLY ONE slow B-stance RDL: from the hinge over her front leg she stands tall, the kettlebell rising close to her front leg, then hinges back down. The back foot stays a toe-down kickstand in place; flat back throughout.` },
  { id: 'kb-swing', motion: `The man performs EXACTLY ONE kettlebell swing: from the backswing with the bell behind his knees he snaps his hips forward, standing tall as the bell floats up to chest height with straight arms, then the bell swings back down between his legs as he hinges. Feet stay planted; his back stays flat.` },
  { id: 'box-squat', seed: 'box-squat-b.webp', motion: `The man performs EXACTLY ONE slow box squat starting from THIS standing position: he pushes his hips back and down until his bottom just lightly touches the chair seat behind him, then immediately drives back up to fully standing. He is standing tall at the start AND at the end. Feet flat and fixed; arms extended forward; the chair never moves.`, negative: 'sitting down fully, staying seated, resting on the chair' },
  { id: 'goblet-squat', seed: 'goblet-squat-b.webp', motion: `The woman performs EXACTLY ONE slow goblet squat starting from THIS standing position: she sits back and down until her thighs are near parallel, then immediately drives back up to fully standing tall. She is standing at the start AND at the end of the clip. Heels flat; the kettlebell stays at her chest.`, negative: 'staying in the squat, remaining crouched' },
  { id: 'band-monster-walk', motion: `The man performs EXACTLY ONE slow monster-walk step: crouched in a quarter squat, he steps one foot diagonally forward and out against the red band, then the other foot follows to gather back under his hips. He remains CROUCHED in the quarter squat in every single moment — hips low, knees bent, chest forward — and never stands upright. The band stays above his knees.`, negative: 'standing upright, walking tall, straight legs, swinging arms' },
  { id: 'band-kickback', motion: `The woman performs EXACTLY ONE slow banded kickback: holding the chair she kicks one straight leg back and slightly up against the red band around her ankles, squeezes, then returns the foot to the floor. Her torso stays upright and still; the standing leg stays planted.` },
  { id: 'push-up', motion: `The woman performs EXACTLY ONE slow push-up: from the high plank she lowers her chest toward the floor, elbows tracking back at forty-five degrees, then presses back up to the plank. Her body stays one rigid straight line from heels to head throughout.` },
  { id: 'incline-push-up', motion: `The woman performs EXACTLY ONE slow incline push-up: hands on the counter edge, she lowers her chest toward the counter, then presses back to straight arms. Her body stays one straight inclined line; her feet stay planted.` },
  { id: 'band-row', motion: `The woman performs EXACTLY ONE slow seated band row: sitting tall with legs long and the red band around her feet, she draws her elbows back past her ribs squeezing her shoulder blades, then returns her arms forward. Her torso stays vertical and still; her legs stay straight.` },
  { id: 'db-row', motion: `The woman performs EXACTLY ONE slow dumbbell row: braced on the chair, she rows the dumbbell up to her hip, elbow driving back, then lowers it to a straight hanging arm. Her back stays flat; her torso never rotates.` },
  { id: 'db-overhead-press', motion: `The man performs EXACTLY ONE slow overhead press: from the dumbbells racked at his shoulders he presses both straight overhead to lockout, then lowers them back to his shoulders. His torso stays vertical, ribs down, no back arch; feet stay planted.` },
  { id: 'db-bicep-curl', motion: `The woman performs EXACTLY ONE slow dumbbell curl: elbows pinned to her sides, she curls both dumbbells up to shoulder height, then lowers them slowly back to her thighs. Only her forearms move; her torso stays still.` },
  { id: 'db-tricep-kickback', seed: 'db-tricep-kickback-b.webp', motion: `The woman performs EXACTLY ONE slow triceps kickback starting extended: from this position with her arm straightened BEHIND her, she lets the forearm hinge slowly DOWN from the elbow until it hangs vertical, pauses, then straightens the elbow so the dumbbell travels BACKWARD behind her body again. The upper arm stays pinned parallel to the floor; the dumbbell always stays BEHIND her torso, never in front.`, negative: 'front raise, arm reaching forward, dumbbell in front of body' },
  { id: 'db-lateral-raise', motion: `The man performs EXACTLY ONE slow lateral raise: from arms at his sides he raises both dumbbells out to exactly shoulder height, elbows soft and leading, then lowers them back down. His torso stays vertical and still; no swinging.` },
  { id: 'band-pull-apart', motion: `The man performs EXACTLY ONE slow band pull-apart: with straight arms forward at chest height he pulls the red band wide until his arms are spread and the band is taut across his chest, then returns. His arms stay straight; shoulders stay down.` },

  // ── Warmups (2026-07-15): the first screens anyone opens, so they animate too.
  { id: 'cat-cow', motion: `The woman performs EXACTLY ONE slow cat-cow cycle on hands and knees: from a neutral flat back she ROUNDS her spine up toward the ceiling while her head drops, pauses, then reverses through neutral into a gentle arch with her chest and head lifting, then returns to neutral. Hands and knees never move; only the spine, head and pelvis flow.` },
  { id: 'leg-swings', motion: `The man performs EXACTLY ONE slow front-to-back leg swing: standing tall on his left leg with his left hand flat on the wall, his RIGHT leg swings forward like a pendulum to a comfortable height, then swings back behind him, then returns to hang beneath him. His torso stays upright; the standing foot never moves; the swinging leg stays relaxed and straight.` },
  { id: 'hip-circles', motion: `The woman performs EXACTLY ONE slow standing hip circle. She FACES THE CAMERA the entire time — her face, chest and toes point at the viewer in every single frame; her body NEVER turns, NEVER rotates, NEVER shows its side or back. With hands on hips and feet planted, only her PELVIS sways in a smooth circle: to her left, forward, to her right, back. Head and shoulders stay nearly still; feet never move.`, negative: 'turning around, rotating body, spinning, side view, back view' },

];

// Clips that reuse another exercise's verified clip because the movement is
// identical. glute-bridge-warmup: two Veo attempts morphed into a face-down
// plank; the warmup IS a glute bridge, so it plays the verified bridge clip.
const COPIES: Array<{ id: string; from: string }> = [
  { id: 'glute-bridge-warmup', from: 'glute-bridge' },
];

async function launch(spec: VideoSpec): Promise<string> {
  const seed = path.join(EXERCISE_DIR, spec.seed ?? `${spec.id}-a.webp`);
  const png = execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', seed, '-f', 'image2pipe', '-vcodec', 'png', '-']);
  const body = {
    instances: [
      {
        prompt: `${STYLE} ${spec.motion}`,
        image: { bytesBase64Encoded: png.toString('base64'), mimeType: 'image/png' },
      },
    ],
    parameters: {
      aspectRatio: '16:9',
      durationSeconds: 4,
      negativePrompt: spec.negative ? `${NEGATIVE}, ${spec.negative}` : NEGATIVE,
    },
  };
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:predictLongRunning?key=${KEY}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
  );
  const data = (await res.json()) as { name?: string; error?: { message: string } };
  if (!data.name) throw new Error(`${spec.id}: ${data.error?.message ?? 'no operation returned'}`);
  return data.name;
}

async function await_(op: string): Promise<string | null> {
  for (let i = 0; i < 60; i++) {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/${op}?key=${KEY}`);
    const data = (await res.json()) as {
      done?: boolean;
      error?: { message: string };
      response?: { generateVideoResponse?: { generatedSamples?: Array<{ video?: { uri?: string } }> } };
    };
    if (data.error) throw new Error(data.error.message);
    if (data.done) {
      return data.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri ?? null;
    }
    await new Promise((r) => setTimeout(r, 10_000));
  }
  return null;
}

async function download(uri: string, to: string): Promise<void> {
  const res = await fetch(`${uri}&key=${KEY}`);
  fs.writeFileSync(to, Buffer.from(await res.arrayBuffer()));
}

// Crop the pillarbox, strip audio, compress. cropdetect finds the content box the
// square seed leaves inside Veo's 16:9 canvas.
function postprocess(raw: string, out: string): void {
  // cropdetect reports on STDERR — spawnSync exposes it; execFileSync does not.
  const probe = spawnSync(
    'ffmpeg',
    ['-i', raw, '-t', '2', '-vf', 'cropdetect=limit=24:round=2', '-f', 'null', '-'],
    { encoding: 'utf8' }
  ).stderr;
  const crops = probe.match(/crop=[\d:]+/g);
  const crop = crops?.[crops.length - 1] ?? 'crop=in_w:in_h';
  execFileSync('ffmpeg', [
    '-y', '-loglevel', 'error', '-i', raw,
    '-vf', `${crop},scale='min(720,iw)':-2`,
    '-an', '-c:v', 'libx264', '-crf', '27', '-preset', 'slow', '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart', out,
  ]);
}

const requested = process.argv.slice(2);
const specs = requested.length ? SPECS.filter((s) => requested.includes(s.id)) : SPECS;
if (requested.length && specs.length !== requested.length) {
  const known = new Set(SPECS.map((s) => s.id));
  console.error(`Unknown ids: ${requested.filter((id) => !known.has(id)).join(', ')}`);
  process.exit(1);
}

// Waves of 4 concurrent operations — polite to the API, still fast overall.
let ok = 0;
const failed: string[] = [];
for (let i = 0; i < specs.length; i += 4) {
  const wave = specs.slice(i, i + 4);
  await Promise.all(
    wave.map(async (spec) => {
      try {
        const raw = path.join(OUT_DIR, `${spec.id}.raw.mp4`);
        if (!fs.existsSync(raw)) {
          console.log(`▶ ${spec.id}: launching…`);
          const op = await launch(spec);
          const uri = await await_(op);
          if (!uri) throw new Error('operation produced no video');
          await download(uri, raw);
        } else {
          console.log(`▶ ${spec.id}: reusing downloaded raw`);
        }
        postprocess(raw, path.join(OUT_DIR, `${spec.id}.mp4`));
        fs.unlinkSync(raw);
        ok++;
        console.log(`  ✓ ${spec.id}.mp4`);
      } catch (e) {
        failed.push(spec.id);
        console.error(`  ✗ ${spec.id}: ${(e as Error).message}`);
      }
    })
  );
}
// Apply clip copies last, so a regenerated source refreshes its aliases too.
for (const copy of COPIES) {
  if (requested.length && !requested.includes(copy.id)) continue;
  const from = path.join(OUT_DIR, `${copy.from}.mp4`);
  if (fs.existsSync(from)) {
    fs.copyFileSync(from, path.join(OUT_DIR, `${copy.id}.mp4`));
    console.log(`  = ${copy.id}.mp4 (copy of ${copy.from})`);
  }
}

console.log(`\nDone: ${ok}/${specs.length}.${failed.length ? ` Failed: ${failed.join(' ')}` : ''} Make contact sheets and LOOK at every clip.`);
