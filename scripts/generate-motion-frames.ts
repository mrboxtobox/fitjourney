// Motion frames — two-frame instructional animation for key lifts.
//
// For each exercise here we generate a clean START frame (<id>-a) and TOP frame
// (<id>-b): one figure, no ghost, no arrows — the motion is shown by the app
// crossfading the two frames, not by ink. Frame B is generated first; frame A is
// then generated WITH FRAME B ATTACHED as an identity reference, so both frames
// show the same person, camera and props and the crossfade reads as movement
// rather than a scene change.
//
// Run: GOOGLE_AI_API_KEY=... npx tsx scripts/generate-motion-frames.ts [ids...]
// Then: node scripts/convert-to-webp.mjs   (and LOOK at every image)

import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY;
if (!GOOGLE_AI_API_KEY) {
  console.error('GOOGLE_AI_API_KEY is required');
  process.exit(1);
}

// Chosen empirically (2026-07-08): Nano Banana 2 draws occluded far-side limbs
// correctly where Pro repeatedly failed. See generate-exercise-images.ts.
const IMAGE_MODEL = process.env.IMAGE_MODEL ?? 'gemini-3.1-flash-image';
const OUTPUT_DIR = path.join(process.cwd(), 'public', 'exercises');

const BAND_RULES = `
=== MINI LOOP BANDS (whenever a band appears) ===
A mini loop band is a CLOSED RED RING around BOTH limbs, sitting level, like a rubber
band around two posts. Draw only its near arc crossing in FRONT of both limbs; at the
outer edge of each limb the red line curves around and vanishes BEHIND — it never ends
in open background, never sits on a kneecap, never wraps one limb only. Under tension
it is a taut straight segment between the limbs. Red is for the band ONLY.
`;

const styleFor = (gender: 'male' | 'female', withBand: boolean) => `=== VINTAGE INSTRUCTIONAL ILLUSTRATION STYLE ===
Classic 1950s-1960s fitness-manual pen and ink illustration. Bold black ink outlines,
crosshatch shading. Warm cream background (#F5F0E6). Navy blue (#1a3a5c) tank top and
shorts. Skin is cream with black crosshatching, no colour fill.

FIGURE: ONE athletic ${gender === 'male' ? 'man' : 'woman'}. EXACTLY 2 arms and EXACTLY
2 legs, all four complete. Knees and elbows are hinges — they bend only the way joints
bend. Neutral spine unless the pose says otherwise. The figure must look supported by
what it touches.

THIS IS ONE FRAME OF A TWO-FRAME ANIMATION:
- NO ghost, NO faded second figure, NO motion arrows, NO dashed lines, NO text.
- The figure is centred with generous margins, small enough in the frame that both
  animation frames can contain the whole movement without the figure going off-screen.

${withBand ? BAND_RULES : ''}
Do NOT draw any border, frame, outline box, or rectangle around the illustration.
No white margin — the cream background runs to every edge.`;

interface MotionSpec {
  id: string;
  name: string;
  // Match the gender of the exercise's static illustration, so the row thumbnail and
  // the animation show the same person.
  gender: 'male' | 'female';
  // Frame B is the TOP/finish of the rep and is generated first.
  top: string;
  // Frame A is the START, generated with frame B attached as the identity reference.
  start: string;
  // Generate frame A standalone too (no identity reference) — for poses where the
  // model copies the reference pose regardless of instruction (see glute-bridge).
  // The start description must then be self-contained, camera and all.
  standaloneStart?: boolean;
}

const SPECS: MotionSpec[] = [
  {
    // NOTE: for this lying pose the identity reference fails in BOTH directions — the
    // model copies the reference pose no matter which frame is attached (lower-the-hips
    // and lift-the-hips both came back unchanged, three attempts). Both frames are
    // therefore generated STANDALONE — run `glute-bridge:a` and `glute-bridge:b`
    // separately — and the style guide alone keeps the figure consistent, which it
    // does well for this camera and pose. LOOK at the pair together before shipping.
    id: 'glute-bridge',
    name: 'Glute Bridge',
    gender: 'female',
    top: `CAMERA: side view (profile), at floor level, her head to the LEFT of frame.
She lies on her back at the TOP of a glute bridge: head, shoulders and arms flat on the
floor, arms at her sides palms down, knees bent to about 90 degrees, BOTH feet flat on
the floor. Her HIPS are lifted high so shoulders, hips and knees form one straight line.
Feet and shoulders carry the weight. Dark hair in a low bun.`,
    start: `CAMERA: side view (profile), at floor level, her head to the LEFT of frame.
She lies FLAT on her back on the floor at the START of a glute bridge: head, shoulders,
back and pelvis ALL resting on the floor, arms at her sides palms down, knees bent to
about 90 degrees so only the knees point up, BOTH feet flat on the floor. Her hips are
DOWN on the ground. Dark hair in a low bun.`,
    standaloneStart: true,
  },
  {
    id: 'kb-deadlift',
    name: 'Kettlebell Deadlift',
    gender: 'female',
    top: `CAMERA: side view (profile).
She stands FULLY TALL at the lockout of a kettlebell deadlift: legs straight, hips fully
extended under her shoulders, chest up, gaze forward. Both hands hold ONE kettlebell by
its handle, arms straight down, the bell hanging IN FRONT of her thighs.`,
    start: `Now draw the START of the repetition: she is HINGED at the hips — hips pushed
far BACK, torso tipped forward about 45 degrees with a FLAT back, knees only slightly
bent, shins vertical. The same kettlebell, still in both hands with straight arms, now
hangs at MID-SHIN height, close to her legs. Same feet in the same floor positions.`,
  },
  {
    id: 'box-squat',
    name: 'Box Squat',
    gender: 'male',
    top: `CAMERA: side view (profile).
THE SCENE: a plain wooden chair stands on the floor at the LEFT of the image, all four
legs on the ground, its seat pointing to the RIGHT. The athlete stands on the FLOOR a
small step to the RIGHT of the chair, fully clear of it, facing RIGHT (away from the
chair). The chair seat is directly behind his hips.
HIS POSE: standing FULLY UPRIGHT — legs straight, chest tall, both arms extended
straight forward at shoulder height. No part of him touches the chair. BOTH feet are
FLAT ON THE FLOOR — never on the chair.`,
    start: `Now draw the BOTTOM of the repetition: keeping his feet EXACTLY where they are
FLAT ON THE FLOOR, he bends his knees and pushes his hips BACK and DOWN until his bottom
sits back and DOWN until his bottom actually RESTS on the front edge of the chair seat —
real contact, carrying almost no weight, with NO GAP between his hips and the seat.
Torso leans slightly
forward with a flat back; shins stay near vertical; arms stay extended straight forward.
The chair is IDENTICAL and in the IDENTICAL position as in the reference.

FORBIDDEN: feet on the chair; standing on the chair; climbing the chair; sitting fully
onto the seat; copying the reference pose. His feet NEVER leave the floor.`,
  },
  // ── Full rollout (2026-07-15). Floor/lying poses are standaloneStart (the identity
  // reference overrides pose instructions for these); standing poses use the reference.
  {
    id: 'band-glute-bridge',
    name: 'Banded Glute Bridge',
    gender: 'male',
    top: `CAMERA: side view (profile), at floor level, his head to the LEFT of frame.
The athlete lies on his back at the TOP of a glute bridge: head, shoulders and arms flat
on the floor, arms at his sides, knees bent about 90 degrees, BOTH feet flat on the
floor, HIPS lifted so shoulders, hips and knees form one straight line. A red mini loop
band wraps around BOTH thighs just above the knees, taut because the knees press apart.`,
    start: `CAMERA: side view (profile), at floor level, his head to the LEFT of frame.
The athlete lies FLAT on his back at the START of a banded glute bridge: head, shoulders,
back and pelvis ALL resting on the floor, arms at his sides, knees bent about 90 degrees
so only the knees point up, BOTH feet flat on the floor, hips DOWN on the ground. The
same red mini loop band around BOTH thighs just above the knees.`,
    standaloneStart: true,
  },
  {
    id: 'hip-thrust',
    name: 'Hip Thrust',
    gender: 'female',
    top: `CAMERA: side view (profile).
Her head is at the LEFT of frame and her feet point RIGHT; a low sturdy bench/couch edge is at the LEFT, behind her shoulders. Her UPPER BACK and shoulders rest on its
edge; her feet are flat on the floor, knees bent about 90 degrees, shins vertical. Her
HIPS are driven UP so her torso is one horizontal line from shoulders to knees. A single
dumbbell (solid black ink) rests across the crease of her hips, steadied with both
hands. Chin tucked, gaze along the torso. She is BAREFOOT.`,
    start: `CAMERA: side view (profile).
The SAME scene and SAME orientation — head at the LEFT of frame, feet pointing RIGHT, the low bench at the LEFT behind her shoulders, upper back resting on its edge,
feet flat, both hands steadying the same dumbbell (solid black ink) over her hips — but
at the START of the rep: her HIPS are LOWERED so her bottom hovers just above the floor
and her torso slopes down from the bench edge to her hips. Her KNEES stay BENT at about 90 degrees —
never straight. Feet stay flat. She is BAREFOOT.`,
    standaloneStart: true,
  },
  {
    id: 'single-leg-glute-bridge',
    name: 'Single-Leg Glute Bridge',
    gender: 'female',
    top: `CAMERA: side view (profile), at floor level, her head to the LEFT of frame.
She lies on her back at the TOP of a single-leg glute bridge: head, shoulders and arms
on the floor, LEFT foot planted flat with the knee bent, hips lifted high, and her RIGHT
leg extended STRAIGHT in line with her torso, its foot in the air. Pelvis level.`,
    start: `CAMERA: side view (profile), at floor level, her head to the LEFT of frame.
She lies FLAT on her back at the START: back and pelvis resting on the floor, arms at
her sides, LEFT foot planted flat with the knee bent pointing up, RIGHT leg extended
straight and hovering just above the floor. Hips DOWN on the ground.`,
    standaloneStart: true,
  },
  {
    id: 'dead-bug',
    name: 'Dead Bug',
    gender: 'female',
    top: `CAMERA: side view (profile), slightly elevated, her head to the LEFT of frame.
She lies on her back mid dead-bug rep: her LEFT arm reaches overhead toward the floor
behind her (hovering just above it) and her RIGHT leg extends long and straight,
hovering just above the floor. Her RIGHT arm still points straight up at the ceiling and
her LEFT knee stays bent directly over the hip, shin horizontal. Low back pressed to the
floor. All four limbs complete and visible.`,
    start: `CAMERA: side view (profile), slightly elevated, her head to the LEFT of frame.
She lies on her back at the START of a dead bug: BOTH arms point straight up at the
ceiling, BOTH knees are bent 90 degrees directly above the hips with the shins
horizontal. Low back pressed into the floor. All four limbs complete and visible.`,
    standaloneStart: true,
  },
  {
    id: 'mcgill-bird-dog',
    name: 'Bird Dog',
    gender: 'male',
    top: `CAMERA: three-quarter view from ABOVE and behind him, looking down on his back,
so that BOTH arms and BOTH legs are clearly visible and none is hidden.
He is on hands and knees mid bird-dog rep: his LEFT hand is planted flat under the left
shoulder (arm straight) and his RIGHT knee rests on the floor under the right hip (that
shin on the ground). His RIGHT arm reaches straight FORWARD at shoulder height and his
LEFT leg extends straight BACK at hip height — the raised arm and leg are on OPPOSITE
sides, a diagonal across his back. Back flat and level, hips square. He has TWO arms
and TWO legs; draw all four, complete.`,
    start: `CAMERA: from ABOVE and BEHIND him, looking DOWN on his BACK — identical to
the top frame. His HEAD is at the LEFT of frame, his hips and feet at the RIGHT. We see
his back and the BACK of his head; his face is NOT visible.
He is on ALL FOURS at the start: BOTH palms planted flat under the shoulders, BOTH knees
on the floor under the hips, BOTH shins and the tops of both feet resting flat on the
ground — no foot lifted. Back flat and level like a table, head in line with the spine.
He has TWO arms and TWO legs; draw all four.`,
    standaloneStart: true,
  },
  {
    id: 'band-clamshell',
    name: 'Clamshell',
    gender: 'female',
    top: `CAMERA: viewed from her front, slightly elevated.
She lies on her LEFT side at the TOP of a clamshell: knees bent about 90 degrees, hips
stacked, head resting on her lower arm. Her FEET stay TOUCHING while her TOP knee lifts
OPEN like a clamshell. A red mini loop band around BOTH thighs just above the knees is
stretched taut by the open knee. Pelvis still, not rolled back.`,
    start: `CAMERA: viewed from her front, slightly elevated.
She lies on her LEFT side at the START of a clamshell: knees bent about 90 degrees and
STACKED together, feet together, hips stacked, head resting on her lower arm. The red
mini loop band around BOTH thighs just above the knees sits close and lightly tensioned
because the knees are closed.`,
    standaloneStart: true,
  },
  {
    id: 'push-up',
    name: 'Push-Up',
    gender: 'female',
    top: `CAMERA: side view (profile), at floor level, her head to the RIGHT of frame.
She is at the BOTTOM of a push-up, dark hair in a low bun: hands flat under the shoulders, body one rigid
straight line from heels through hips to head, elbows bent and tracking about 45 degrees
back (not flared straight out), her chest a fist's height above the floor. Toes tucked.`,
    start: `CAMERA: side view (profile), at floor level, her head to the RIGHT of frame.
She is at the TOP of a push-up, a high plank, dark hair in a low bun: arms fully extended, hands flat under the
shoulders, body one rigid straight line from heels through hips to head. Toes tucked.`,
    standaloneStart: true,
  },
  {
    id: 'band-row',
    name: 'Band Row',
    gender: 'female',
    top: `CAMERA: side view (profile), she faces RIGHT — her feet at the RIGHT of frame,
her head at the LEFT.
She sits TALL on the floor at the finish of a seated band row: legs extended straight in
front, torso vertical. A red band loops around the SOLES of both feet; she holds one end
in each hand with her ELBOWS drawn BACK past her ribs, hands at her lower ribs, shoulder
blades squeezed together. The band is stretched taut from feet to hands.
Red appears ONLY as that single band from the soles of her feet to her hands — no red at
her waist, hips or clothing, no ribbons, no second strap anywhere.`,
    start: `CAMERA: side view (profile), she faces RIGHT.
She sits TALL on the floor at the start of a seated band row: legs extended straight in
front, torso vertical. The red band loops around the SOLES of both feet; her ARMS reach
straight FORWARD toward her feet holding the band ends with light tension.`,
    standaloneStart: true,
  },
  {
    id: 'kb-swing',
    name: 'Kettlebell Swing',
    gender: 'male',
    top: `CAMERA: side view (profile).
He stands at the FLOAT of a kettlebell swing: standing fully tall, hips locked out,
glutes squeezed, legs straight, both ARMS STRAIGHT and horizontal in front of him at
chest height, the kettlebell floating weightless at the end of his arms at chest height.`,
    start: `CAMERA: side view (profile).
He FACES RIGHT (nose pointing to the right of frame). He is at the BACKSWING of a kettlebell swing: HINGED deep at the hips — hips pushed far
BACK, flat back tipped forward about 45 degrees, knees only slightly bent, shins
vertical — with both ARMS STRAIGHT and the kettlebell swung BACK BETWEEN and slightly
behind his knees, forearms brushing the inner thighs. Feet flat, planted wide.`,
    standaloneStart: true,
  },
  {
    id: 'db-rdl',
    name: 'Dumbbell RDL',
    gender: 'female',
    top: `CAMERA: side view (profile).
She stands FULLY TALL at the top of a dumbbell RDL: legs straight, hips extended, chest
up, one dumbbell in each hand resting against the FRONT of her thighs, arms straight.`,
    start: `Now draw the BOTTOM of the repetition: she is HINGED at the hips — hips pushed
far BACK, flat back tipped forward, knees soft, shins vertical — and the dumbbells have
slid DOWN the front of her legs to MID-SHIN, staying close to the legs. Same feet in the
same floor positions.`,
  },
  {
    id: 'b-stance-rdl',
    name: 'B-Stance RDL',
    gender: 'female',
    top: `CAMERA: side view (profile).
She stands tall in a B-STANCE (kickstand) position: her LEFT foot planted flat in front
carrying the weight, her RIGHT foot a half step back with ONLY THE TOES on the floor,
its heel up, level with the front foot's heel. She holds one kettlebell in both hands,
arms straight, the bell in front of her thighs.`,
    start: `Now draw the BOTTOM of the repetition: she HINGES over the FRONT leg — hips
back, flat back tipped forward, front knee soft with a vertical shin — the back foot
still just a toe-down kickstand in the same spot. The kettlebell lowers to the front
SHIN, close to the leg, both arms straight.`,
  },
  {
    id: 'goblet-squat',
    name: 'Goblet Squat',
    gender: 'female',
    top: `CAMERA: side view (profile).
She stands FULLY TALL holding a kettlebell like a goblet at her chest — both hands on
the horns of the handle, elbows tucked down in front of her ribs. Legs straight, chest
up, feet flat about shoulder width.`,
    start: `CAMERA: side view (profile).
She is at the BOTTOM of a goblet squat: sitting back and down with her KNEES BENT DEEP —
thighs just above parallel to the floor — hips back, chest tall, HEELS flat. She holds a
kettlebell like a goblet at her chest, both hands on the horns, elbows tucked between
her knees. Her legs are clearly FOLDED, never straight. BOTH feet are side by side,
parallel, FULL SOLES planted flat on the floor — the near foot AND the far foot. No
heel lifts, no tiptoe, no floating foot; both heels press into the ground.`,
    standaloneStart: true,
  },
  {
    id: 'pallof-press',
    name: 'Pallof Press',
    gender: 'male',
    top: `THIS IS A BIRD'S-EYE VIEW DIAGRAM — the camera looks STRAIGHT DOWN from the
ceiling at ONE man standing on the floor. We see the top of his head (dark hair), his
two shoulders either side of it, and his arms from above.

THE KEY GEOMETRY (the entire point):
- His CHEST FACES THE TOP of the image: his shoulders form a horizontal line with his
  head between them, and anything in front of him is ABOVE him in the image.
- BOTH ARMS press STRAIGHT UP THE IMAGE from his sternum — hands clasped together,
  elbows fully extended — so his arms are PERPENDICULAR to the band.
- A vertical post stands at the far LEFT edge (a small column top from above). A taut
  RED BAND runs horizontally from the post to his clasped hands and BENDS 90 degrees at
  his hands. The band comes from his SIDE; his arms do NOT point at the post.`,
    start: `THIS IS A BIRD'S-EYE VIEW DIAGRAM — the camera looks STRAIGHT DOWN from the
ceiling at ONE man standing on the floor: top of his head, two shoulders, arms from
above. His CHEST FACES THE TOP of the image (shoulders a horizontal line, head between).
A vertical post at the far LEFT edge; a taut RED BAND runs horizontally from the post to
his hands. His hands are PULLED IN to his sternum — elbows bent at his sides, clasped
hands held at the centre of his chest. The band stays taut from the post to his hands.
His forearms do NOT point at the post. We see ONLY the top of his head and his
shoulders from directly overhead — his FACE is NEVER visible. The post is the same 3-D
column as in the other frame.`,
    standaloneStart: true,
  },
  {
    id: 'band-kickback',
    name: 'Banded Kickback',
    gender: 'female',
    top: `CAMERA: side view (profile), she faces LEFT toward a wooden chair.
She stands tall holding the chair's backrest with both hands, torso upright. A red mini
loop band wraps around BOTH ankles. Her RIGHT leg is kicked STRAIGHT BACK and low (about
30 degrees), the band stretched taut between her ankles. Standing knee soft, low back
still, no arch.`,
    start: `Now draw the START of the repetition: both feet together FLAT on the floor
under her hips, both legs vertical, the red band around BOTH ankles sitting close with
light tension. She still stands tall holding the same chair with both hands.`,
  },
  {
    id: 'band-lateral-walk',
    name: 'Lateral Band Walk',
    gender: 'female',
    top: `CAMERA: viewed from the front.
She is in a quarter squat mid lateral step: chest up, hips back a little, knees bent and
pushed OUT, and her feet WIDE apart — well beyond shoulder width — with a red mini loop
band around BOTH thighs just above the knees STRETCHED WIDE and taut between them. Both
feet flat on the floor.`,
    start: `CAMERA: viewed from the front.
She is in a quarter squat at the GATHERED phase of a lateral band walk: chest up, hips
back a little, knees bent and pushed out — and her FEET CLOSE TOGETHER, only HIP WIDTH
apart, clearly NARROWER than her shoulders — almost touching. The red mini loop band
around both thighs just above the knees is SHORT between her legs, under light tension.
Both feet flat. She is BAREFOOT.`,
    standaloneStart: true,
  },
  {
    id: 'band-monster-walk',
    name: 'Monster Walk',
    gender: 'male',
    top: `CAMERA: three-quarter front view.
He is in a quarter squat mid monster-walk step: hips low, chest up, knees pushed OUT
against a red mini loop band around BOTH thighs just above the knees. His RIGHT foot has
stepped diagonally FORWARD and OUT, feet wide, the band stretched taut. Both feet flat.`,
    start: `CAMERA: three-quarter front view.
He is in a quarter squat at the GATHERED phase of a monster walk: hips low, chest up,
knees pushed out — and his FEET CLOSE TOGETHER directly under his hips, only HIP WIDTH
apart, clearly NARROWER than his shoulders. The red mini loop band around both thighs
just above the knees is SHORT between his legs, under light tension. Both feet flat.`,
    standaloneStart: true,
  },
  {
    id: 'db-row',
    name: 'Dumbbell Row',
    gender: 'female',
    top: `CAMERA: side view (profile).
She is hinged forward with a FLAT back, her LEFT hand braced on the seat of a wooden
chair in front of her, knees soft. Her RIGHT hand has ROWED a dumbbell UP to her hip —
elbow driven back and high, close to her ribs, the dumbbell at the side of her waist.`,
    start: `CAMERA: side view (profile). She FACES LEFT; a plain wooden chair stands at
the LEFT of frame in front of her. Dark hair in a low bun; white athletic sneakers.
She is hinged forward with a FLAT back, her LEFT hand braced on the seat of the chair,
knees soft. Her RIGHT arm HANGS STRAIGHT DOWN toward the floor, fully extended, holding
a dumbbell at the bottom of its reach directly below her shoulder. The elbow is
straight, not bent.`,
    standaloneStart: true,
  },
  {
    id: 'db-overhead-press',
    name: 'Overhead Press',
    gender: 'male',
    top: `CAMERA: front view. ONE SINGLE man, alone, centred — never two figures, never a
two-panel comparison, never a duplicate.
He stands tall at the LOCKOUT of an overhead press: BOTH arms fully extended straight
OVERHEAD, exactly ONE dumbbell in each hand directly above his shoulders (two dumbbells
total in the whole image), ribs down, no back arch, feet flat at hip width. He has
exactly TWO arms.`,
    start: `CAMERA: front view. ONE SINGLE man, alone, centred — never two figures, never
a two-panel comparison, never a duplicate.
He stands tall at the START of an overhead press: the dumbbells RACKED at his shoulders
— elbows bent pointing down, exactly ONE dumbbell at each shoulder at about chin height
(two dumbbells total in the whole image), feet flat at hip width. He has exactly TWO
arms.`,
    standaloneStart: true,
  },
  {
    id: 'db-bicep-curl',
    name: 'Dumbbell Curl',
    gender: 'female',
    top: `CAMERA: side view (profile).
She stands tall at the TOP of a dumbbell curl: elbows PINNED to her sides, forearms
curled fully up so the dumbbells are at shoulder height, palms toward her shoulders.
Torso vertical and still.`,
    start: `Now draw the START of the repetition: the SAME standing position, elbows still
at her sides, but both ARMS HANG STRAIGHT DOWN, dumbbells beside her thighs.`,
  },
  {
    id: 'db-tricep-kickback',
    name: 'Triceps Kickback',
    gender: 'female',
    top: `CAMERA: side view (profile).
She is hinged forward with a flat back, one hand braced on a chair back, her RIGHT upper
arm pinned HIGH beside her ribs, PARALLEL to the floor — and the elbow fully STRAIGHTENED
so the forearm and dumbbell extend straight back behind her.`,
    start: `CAMERA: side view (profile). She FACES RIGHT; a plain simple wooden chair
with a straight back stands at the RIGHT of frame in front of her.
She is hinged forward with a flat back, one hand braced on the chair back, her RIGHT
upper arm pinned HIGH beside her ribs, PARALLEL to the floor — with the ELBOW BENT to
90 degrees so the forearm and dumbbell hang straight DOWN from the elbow. The dumbbell
is below the elbow, never behind her.`,
    standaloneStart: true,
  },
  {
    id: 'db-lateral-raise',
    name: 'Lateral Raise',
    gender: 'male',
    top: `CAMERA: front view.
He stands tall at the TOP of a lateral raise: both arms raised OUT to the sides to
exactly SHOULDER height, elbows soft and leading, a dumbbell in each hand level with —
never above — the shoulders. Torso vertical and still.`,
    start: `Now draw the START of the repetition: the SAME standing position, but both
ARMS HANG at his sides, dumbbells resting beside his thighs.`,
  },
  {
    id: 'band-pull-apart',
    name: 'Band Pull-Apart',
    gender: 'male',
    top: `CAMERA: front view. ONE single man.
He stands tall at the FINISH of a band pull-apart: both ARMS STRAIGHT and spread WIDE
out to the sides at chest height. A red resistance band runs as ONE PERFECTLY STRAIGHT,
MAXIMALLY TAUT horizontal line from hand to hand across his chest — at full stretch it
can never droop, sag, or hang in a loop. Shoulder blades squeezed, shoulders down.`,
    start: `CAMERA: front view. ONE single man.
He FACES THE CAMERA STRAIGHT ON — a symmetric front view, both shoulders equally
visible, exactly like the other frame — never a side or three-quarter view.
He stands tall at the START of a band pull-apart: both arms STRAIGHT with elbows locked,
pointing directly FORWARD at chest height, parallel, hands shoulder-width apart. A SHORT
red band spans horizontally between his two hands, nearly straight under light tension —
NEVER a large drooping loop, never hanging below his hands. Both hands in front of his
chest.`,
    standaloneStart: true,
  },
  {
    id: 'incline-push-up',
    name: 'Incline Push-Up',
    gender: 'female',
    top: `CAMERA: side view (profile), she faces a sturdy waist-high counter on the LEFT.
She is at the BOTTOM of an incline push-up: hands on the counter's edge under her
shoulders, body one straight line from heels through hips to head, inclined; ELBOWS BENT
tracking about 45 degrees back so her chest is close to the counter edge. Heels down or
slightly lifted, toes on the floor.`,
    start: `CAMERA: side view (profile), she faces a sturdy waist-high counter on the LEFT.
She is at the TOP of an incline push-up: hands on the counter's edge under her shoulders,
ARMS FULLY EXTENDED and straight, body one straight line from heels through hips to
head, inclined, chest away from the counter. Toes on the floor.`,
    standaloneStart: true,
  },

  // ── Warmup seed frames (2026-07-15): single-figure stills that seed the Veo
  // warmup clips. Only frame -a is used (run as `id:a`); statics keep their
  // two-pose diagrams for the row thumbnails.
  {
    id: 'cat-cow',
    name: 'Cat-Cow',
    gender: 'female',
    top: `unused`,
    start: `CAMERA: side view (profile), she faces LEFT.
She is on hands and knees in a NEUTRAL tabletop: palms flat under the shoulders, knees
under the hips, shins on the floor, back flat and level, head in line with the spine.`,
    standaloneStart: true,
  },
  {
    id: 'leg-swings',
    name: 'Leg Swings',
    gender: 'male',
    top: `unused`,
    start: `CAMERA: side view (profile), he faces RIGHT. A plain wall edge at the LEFT.
He stands tall on his LEFT leg with his LEFT hand resting FLAT on the wall for balance.
His RIGHT leg hangs relaxed and straight, its foot just off the floor, ready to swing.`,
    standaloneStart: true,
  },
  {
    id: 'hip-circles',
    name: 'Hip Circles',
    gender: 'female',
    top: `unused`,
    start: `CAMERA: three-quarter front view.
She stands tall with feet shoulder-width apart and BOTH hands on her hips, elbows out,
relaxed confident posture, knees soft.`,
    standaloneStart: true,
  },
  {
    id: 'glute-bridge-warmup',
    name: 'Glute Bridge (warmup)',
    gender: 'male',
    top: `unused`,
    start: `CAMERA: side view (profile), at floor level, his head to the LEFT of frame.
The athlete lies FLAT on his back on the floor: head, shoulders, back and pelvis ALL
resting on the floor, arms at his sides palms down, knees bent to about 90 degrees so
only the knees point up, BOTH feet flat on the floor.`,
    standaloneStart: true,
  },
];

async function callModel(parts: Array<Record<string, unknown>>): Promise<Buffer | null> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${IMAGE_MODEL}:generateContent?key=${GOOGLE_AI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: {
          responseModalities: ['TEXT', 'IMAGE'],
          imageConfig: { aspectRatio: '1:1', imageSize: '2K' },
        },
      }),
    }
  );
  if (!response.ok) {
    console.error(`  API error: ${response.status} - ${await response.text()}`);
    return null;
  }
  const data = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ inlineData?: { data: string } }> } }>;
  };
  for (const part of data.candidates?.[0]?.content?.parts ?? []) {
    if (part.inlineData) return Buffer.from(part.inlineData.data, 'base64');
  }
  return null;
}

// Load the current top frame when only frame A is being retried. The PNG exists
// right after generation; after convert-to-webp only the .webp remains.
async function loadTopFrame(id: string): Promise<Buffer | null> {
  const png = path.join(OUTPUT_DIR, `${id}-b.png`);
  if (fs.existsSync(png)) return fs.readFileSync(png);
  const webp = path.join(OUTPUT_DIR, `${id}-b.webp`);
  if (fs.existsSync(webp)) return sharp(webp).png().toBuffer();
  return null;
}

const hasBand = (spec: MotionSpec) => /\bband\b/i.test(spec.top + spec.start);

async function generatePair(spec: MotionSpec, frames: ReadonlySet<string>): Promise<boolean> {
  let top: Buffer | null;
  if (frames.has('b')) {
    console.log(`Generating: ${spec.name} (frame B, top)…`);
    const topPrompt = `${styleFor(spec.gender, hasBand(spec))}\n\n=== EXERCISE: ${spec.name} — TOP POSITION ===\n\n${spec.top}`;
    top = await callModel([{ text: topPrompt }]);
    if (!top) return false;
    fs.writeFileSync(path.join(OUTPUT_DIR, `${spec.id}-b.png`), top);
    console.log(`  ✓ Saved: ${spec.id}-b.png`);
  } else if (!spec.standaloneStart) {
    top = await loadTopFrame(spec.id);
    if (!top) {
      console.error(`  no existing ${spec.id}-b frame to reference — generate frame b first`);
      return false;
    }
  } else {
    top = null; // standalone start needs no reference
  }
  if (!frames.has('a')) return true;

  if (spec.standaloneStart) {
    console.log(`Generating: ${spec.name} (frame A, start — standalone)…`);
    const prompt = `${styleFor(spec.gender, hasBand(spec))}\n\n=== EXERCISE: ${spec.name} — START POSITION ===\n\n${spec.start}`;
    const start = await callModel([{ text: prompt }]);
    if (!start) return false;
    fs.writeFileSync(path.join(OUTPUT_DIR, `${spec.id}-a.png`), start);
    console.log(`  ✓ Saved: ${spec.id}-a.png`);
    return true;
  }

  console.log(`Generating: ${spec.name} (frame A, start)…`);
  // The finished top frame goes first so the model anchors identity, camera and
  // props to it; the text then names the ONLY thing allowed to change.
  const startPrompt = `${styleFor(spec.gender, hasBand(spec))}

=== IDENTITY REFERENCE (ATTACHED) ===
The attached image is the OTHER frame of this two-frame animation: the TOP position of
${spec.name}. Draw the SAME woman — same face, hair, build, clothing — from the SAME
camera angle, at the SAME scale and position in frame, with the SAME props in the SAME
places, in the SAME ink style. The ONLY difference is her pose, described below. A
viewer flipping between the two images must see a body moving, not a scene changing.

THE POSE INSTRUCTION OUTRANKS THE REFERENCE. The reference supplies identity, camera
and props — NEVER the pose. If the pose below contradicts what the reference shows,
draw the pose below.

=== EXERCISE: ${spec.name} — START POSITION ===

${spec.start}`;
  const topResized = await sharp(top).resize(1024, 1024).png().toBuffer();
  const start = await callModel([
    { inlineData: { mimeType: 'image/png', data: topResized.toString('base64') } },
    { text: startPrompt },
  ]);
  if (!start) return false;
  fs.writeFileSync(path.join(OUTPUT_DIR, `${spec.id}-a.png`), start);
  console.log(`  ✓ Saved: ${spec.id}-a.png`);
  return true;
}

// Args: `id` regenerates both frames, `id:a` / `id:b` just one. No args = all pairs.
const requested = process.argv.slice(2).map((arg) => {
  const [id, frame] = arg.split(':');
  return { id, frames: new Set(frame ? [frame] : ['a', 'b']) };
});
const known = new Set(SPECS.map((s) => s.id));
const unknown = requested.filter((r) => !known.has(r.id));
if (unknown.length) {
  console.error(`Unknown ids: ${unknown.map((r) => r.id).join(', ')}`);
  process.exit(1);
}
const jobs = requested.length
  ? requested.map((r) => ({ spec: SPECS.find((s) => s.id === r.id)!, frames: r.frames }))
  : SPECS.map((spec) => ({ spec, frames: new Set(['a', 'b']) }));

let ok = 0;
for (const job of jobs) {
  if (await generatePair(job.spec, job.frames)) ok++;
}
console.log(`\nDone: ${ok}/${jobs.length} pairs. Now run convert-to-webp and LOOK at every frame.`);
