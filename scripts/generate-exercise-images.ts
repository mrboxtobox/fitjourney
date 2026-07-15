/**
 * Generate exercise illustrations in vintage instructional style
 * Inspired by Art of Manliness / Ted Slampyak illustrations
 *
 * Usage: export $(grep -v '^#' ~/code/imagineplay/.env | xargs) && npx tsx scripts/generate-exercise-images.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';

const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY;

if (!GOOGLE_AI_API_KEY) {
  console.error('Missing GOOGLE_AI_API_KEY. Run: export $(grep -v "^#" ~/code/imagineplay/.env | xargs)');
  process.exit(1);
}

// Image model configured below. See the IMAGE_MODEL comment for the empirical choice.
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

const OUTPUT_DIR = path.join(process.cwd(), 'public', 'exercises');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// =============================================================================
// STYLE GUIDE - Passed to EVERY image generation for consistency
// =============================================================================
const STYLE_GUIDE = `=== VINTAGE INSTRUCTIONAL ILLUSTRATION STYLE GUIDE ===

Create an exercise illustration in the style of classic 1950s-1960s fitness manuals and military training guides.

ARTISTIC STYLE:
- Traditional pen and ink illustration with crosshatching for shading
- Bold black ink outlines with varying line weights
- Clean, anatomically accurate figure drawing
- Professional instructional manual quality

COLOR PALETTE (USE ONLY THESE - NO OTHER COLORS):
- Background: Warm cream/off-white (#F5F0E6)
- Clothing: Deep navy blue (#1a3a5c)
- Ink lines: Rich black for all linework
- Skin: Cream background with black ink crosshatching for shading (no color fill)
- Motion arrows: Bold red (#c41e3a)

FIGURE REQUIREMENTS:
- EXACTLY 2 arms and EXACTLY 2 legs (no extra limbs)
- Athletic build with realistic proportions
- Profile or 3/4 view for clarity
- Simple athletic wear: tank top and shorts in navy blue

=== ANATOMICAL ACCURACY (NON-NEGOTIABLE) ===
This is an instructional medical-adjacent illustration. A physiotherapist should be
able to look at it and confirm the joint positions are correct.

- SKELETAL PLAUSIBILITY: every joint bends only in the direction it actually bends.
  Knees and elbows are hinges — they never bend sideways or backwards.
- JOINT ANGLES must match the described position. If the text says "shins vertical",
  draw the tibia perpendicular to the floor. If it says "90 degrees", draw 90 degrees.
- SPINE: draw a continuous, believable spinal curve. Unless the exercise explicitly
  calls for flexion, the spine is NEUTRAL — a gentle S, never a rounded C, never a
  sharply arched hyperextension.
- PELVIS AND RIBCAGE read as two distinct masses connected by the trunk. Where a cue
  says "ribs down" or "hips level", that relationship must be visible.
- LIMB PROPORTIONS: upper arm ≈ forearm; femur slightly longer than tibia. Hands and
  feet sized correctly — a common failure is tiny hands or oversized feet.
- MUSCLE BELLIES sit where they really are. Crosshatch shading should follow the
  direction of the muscle fibres, not arbitrary hatching.
- WEIGHT AND CONTACT: the figure must look supported by the surfaces it touches.
  Feet flat means the whole sole contacts the floor. No floating limbs.
- The working muscle may be subtly emphasised with denser crosshatching, but do NOT
  add colour, glow, highlight, or any callout to it.

=== MINI LOOP BANDS: DRAW AN ELLIPSE (READ EVERY TIME A BAND APPEARS) ===
A mini loop band is a CLOSED RUBBER RING. It is not a stripe, a strap, a belt, or a ribbon.
Repeated attempts have drawn it as a stripe painted across the legs. Draw it this way instead:

THINK OF IT AS AN ELLIPSE seen at an angle, lying around BOTH limbs:
  1. The NEAR ARC of the ellipse crosses in FRONT of both thighs. Draw this arc in red.
  2. The FAR ARC of the ellipse is HIDDEN BEHIND both thighs. Do not draw it — it is occluded.
  3. The two arcs MEET at the OUTER EDGE of each thigh. At that outer edge the red line curves
     around and vanishes behind the leg. It does not stop; it goes behind.
  4. Therefore the band's red line is VISIBLE only between the two outer thigh edges, and it
     NEVER terminates in open cream background.

- It sits at the SAME HEIGHT on both limbs — level, not skewed diagonally.
- Where specified "above the knees", it sits on the lower THIGHS, clearly ABOVE the kneecaps,
  never across or on top of a kneecap.
- Under tension it is a taut straight segment between the limbs, not a slack curve.
- If a ghost figure is drawn, the ghost does NOT get its own red band. There is ONE band.

FORBIDDEN, and these have all actually happened: a band painted as a stripe across one thigh;
a band whose two strands end in blunt flat cut ends beside the legs; a band draped over a
kneecap and running down a shin like a dangling strap; a band around only one leg; a band end
floating in the background; a second, duplicated band drawn on the ghost.

=== RED IS FOR MOTION AND FOR BANDS ONLY ===
Resistance bands are drawn in the same bold red as the motion arrows. Nothing else is red.

=== ARROWS MUST POINT THE RIGHT WAY ===
An arrow shows the CORRECT direction of movement or force. Never draw an arrow pointing along
the path of a fault. A knee that must be pushed OUT gets an arrow pointing OUTWARD, away from
the midline — never inward. Never draw an arrow that instructs the user to do the wrong thing.

=== HOW TO SHOW MOVEMENT: TWO ALLOWED COMPOSITIONS, AND NOTHING ELSE ===
Ghosted, faded, semi-transparent overlay figures are the single largest source of defects in
this library. They come out as disembodied legs, floating shoes, headless torsos, pairs of
free-floating forearms, mirrored bodies, and duplicated furniture. DO NOT DRAW ONE unless the
exercise's own description explicitly asks for it.

Use ONE of these two compositions instead:

  COMPOSITION A — ONE FIGURE (preferred, and the default):
  Draw exactly ONE person, at full ink weight. Show the movement with:
    - a thin BLACK DASHED ARC tracing the path a hand, foot or implement travels, and
    - ONE bold RED ARROW along that path showing the direction of travel.
  The dashed arc is a TRAJECTORY. Draw NO body part at either end of it: no ghost hand, no
  ghost foot, no ghost limb. It is a line, not a person.

  COMPOSITION B — TWO SEPARATE COMPLETE FIGURES (only where two positions must be compared):
  Draw exactly TWO people, BOTH at FULL INK WEIGHT, standing clearly APART with plain cream
  background between them. They must NOT overlap and NEITHER may be faded.
  Each figure is complete: one head, one torso, exactly two arms, exactly two legs, every limb
  ending in a properly drawn hand or foot.
  Any prop (bench, chair, wall, rail, pad) that both figures use is drawn ONCE per figure only
  if each figure genuinely needs its own; otherwise draw a single shared prop and place both
  figures around it. NEVER draw a duplicate of a fixed object floating beside a copy of it.

IF the exercise description below DOES explicitly call for a ghost, then all of this applies:
- AT MOST ONE ghost, in LIGHT GREY OUTLINE ONLY, never filled with navy clothing.
- It is a COMPLETE body: head, torso, two arms, two legs, each ending in a hand or foot. Never a
  lone limb, never a headless torso, never a pair of floating forearms, never a stray shoe.
- SAME camera angle, FACING THE SAME DIRECTION. Never mirrored, flipped or reversed end-for-end.
  Its head is at the same end of the image as the solid figure's head.
- It shares the solid figure's floor line and every fixed contact point.
- PROPS ARE DRAWN EXACTLY ONCE and shared. A bench, chair, rail, wall or pad cannot move between
  two moments of one repetition. Never duplicate a prop, an implement, or a band for the ghost.
- It shows the other end of the CORRECT movement. It NEVER demonstrates a fault.

=== LIMBS AND EXTREMITIES ===
- Each figure has EXACTLY ONE pair of arms and EXACTLY ONE pair of legs. Never add a second pair
  of forearms, a third arm, or a spare leg.
- EVERY limb terminates in a properly articulated hand (with fingers) or foot (with toes).
  A limb that ends in a blunt rounded stump is a defect.
- Every limb is visibly attached to a torso. Nothing floats.

=== SHOWING RANGE OF MOTION ===
Show the RANGE OF MOTION with a dashed trajectory line and a red arrow, as described in the
"HOW TO SHOW MOVEMENT" section below. Do not add a ghosted overlay figure unless this specific
exercise's description explicitly asks for one.

MOVEMENT INDICATORS:
- Bold red arrows connecting the two positions
- Arrows show the direction of movement from start to end
- Curved arrows for rotational movements
- Straight arrows for linear movements
- DASHED LINES: Use dashed/dotted lines to show:
  * The path of movement (arc of a swing, trajectory of a limb)
  * Guide lines showing alignment (e.g., spine alignment, limb path)
  * Range of motion arcs
- Dashed lines should be in black or dark gray, thinner than solid lines

The ghosted figure technique shows the RANGE OF MOTION and helps users understand the complete exercise movement pattern.

COMPOSITION:
- Both positions (solid + ghosted) on plain cream background
- No text, labels, or watermarks. This means NO writing of any kind: no words, no numerals,
  no degree symbols, no angle labels, no measurement ticks, no callout numbers. An illustration
  that prints "90°" on a joint is wrong.
- Square format
- Figures fill ~70% of frame
- The cream background runs edge-to-edge. Do NOT draw any border, frame, outline box, or rectangle around the illustration — no framing lines of any kind.`;

// =============================================================================
// Exercise definitions with HYPER-DETAILED form descriptions
// =============================================================================
interface ExerciseIllustration {
  id: string;
  name: string;
  formDescription: string;
  modelGender: 'male' | 'female';
  /**
   * Optional stick-figure POSE REFERENCE, as an SVG string.
   *
   * Prose cannot pin down a joint configuration. Some poses — the seated 90/90 above all —
   * defeated six rounds of increasingly precise text: the model kept drifting into a Z-sit,
   * a straddle, or a kneeling lunge. A skeleton removes the ambiguity: the model is
   * multimodal, so we rasterise this SVG and send it as an image part with the prompt,
   * telling the model to match the joint positions exactly and redraw in the house style.
   *
   * Coordinates are in a 1024x1024 box. Draw the skeleton in the SAME camera angle the
   * final illustration should use.
   */
  poseSvg?: string;
}

const EXERCISES: ExerciseIllustration[] = [
  // =========================================================================
  // FINISHERS — scored metabolic blocks. These diagrams must read as a
  // CIRCUIT or repeated effort, not a single static exercise.
  // =========================================================================
  {
    id: 'swing-storm',
    name: 'Finisher: Swing Storm',
    modelGender: 'female',
    formDescription: `A dynamic, high-energy illustration of repeated kettlebell swings — this is an INTERVAL WORKOUT diagram, not a single rep.

CAMERA ANGLE: Side view (profile).

=== OVERRIDE: NO GHOSTED OVERLAY FOR THIS ILLUSTRATION ===
Ignore the ghosted overlay technique described in the style guide. Overlapping a ghost onto
the figure produces chimeras — extra arms, extra kettlebells, limbs attached to nothing.

THE COMPOSITION — TWO SEPARATE, COMPLETE FIGURES SIDE BY SIDE:
Draw EXACTLY TWO women, both at FULL INK WEIGHT, standing clearly APART from each other with
CLEAR CREAM BACKGROUND BETWEEN THEM. They must NOT overlap, and neither may be faded.
Each figure has EXACTLY 2 arms, EXACTLY 2 legs, and holds EXACTLY ONE kettlebell in BOTH hands.
There are EXACTLY TWO kettlebells in the entire image.

  LEFT FIGURE — the bottom of the swing:
  - Deep HIP HINGE: hips driven back, shins near-vertical, knees barely bent
  - Flat back from tailbone to head
  - The kettlebell is swung BACK BETWEEN the thighs, arms straight

  RIGHT FIGURE — the top of the swing:
  - Standing tall, hips locked out, glutes squeezed
  - Arms straight and roughly HORIZONTAL
  - The kettlebell floats at CHEST height. NEVER higher than the chest. Not at the chin,
    not at the forehead, not overhead.

MOVEMENT INDICATORS:
- ONE bold dashed ARC between the two figures, tracing the bell's pendulum path from between
  the thighs up to chest height
- TWO bold red arrows on that arc: one pointing up along it, one pointing down along it,
  showing the bell swings up AND down, over and over
- Small motion/speed lines around each bell conveying explosive pace

ENERGY: This must look INTENSE — a sweat-dripping conditioning effort, not a calm demonstration.

FORBIDDEN: any ghosted, faded, phantom or semi-transparent figure; a third figure; a third
kettlebell; a third arm or leg; any limb, hand, foot or shoe not attached to a torso; the two
figures overlapping; the bell above chest height; a squat instead of a hip hinge; a rounded back.
CRITICAL: TWO complete separate figures. TWO kettlebells. Four arms and four legs in total,
every one of them attached to a body.

=== PHYSIO REVIEW FIXES (MUST HOLD) ===
- The backswing figure's KNEES BARELY BEND. The bell is HIKED HIGH between the thighs,
  forearms pressed against the inner thighs — never a squat, never the bell dropped
  low at shin height.

FINAL CORRECTIONS:
- In the backswing figure the kettlebell handle is IN her gripped hands, wrists pressed against her upper inner thighs, the bell tucked just behind and below the pelvis. The bell is CONNECTED to her hands.`,
  },
  {
    id: 'the-burner',
    name: 'Finisher: The Burner',
    modelGender: 'female',
    formDescription: `A THREE-PANEL CIRCUIT diagram showing a mini-band glute circuit — like a vintage fitness manual's circuit chart.

LAYOUT — THREE VIGNETTES IN A HORIZONTAL ROW, equal size, clearly separated by white space:

PANEL 1 (left) — LATERAL BAND WALK:
- Front view of a woman in a quarter squat, red mini loop band around both lower thighs just above the knees
- She steps sideways, band stretched taut between her legs
- Small red arrow pointing sideways

PANEL 2 (center) — MONSTER WALK:
- 3/4 view of the same woman in a quarter squat, same red band above the knees
- She steps diagonally forward, knees pushed out
- Small red arrow pointing diagonally forward

PANEL 3 (right) — STANDING KICKBACK:
- Side view of the same woman standing tall holding a chair back, red band around both ankles
- One leg kicked straight back, glute squeezed
- Small red arrow showing the leg sweeping back

CONNECTING THE CIRCUIT:
- A bold red arrow flows from panel 1 to panel 2, and from panel 2 to panel 3
- A curved dashed arrow loops from panel 3 back around/under to panel 1 — showing the circuit REPEATS continuously

CRITICAL: Three separate small vignettes of the SAME woman, arranged left to right, connected by arrows into a repeating loop. Each vignette is simple and clear. The red mini loop band is visible in all three.

=== PHYSIO REVIEW FIXES (MUST HOLD) ===
- In EVERY panel that shows a thigh band, the red band sits ABOVE BOTH kneecaps on the
  lower thighs — never at, on, or below a knee.`,
  },
  {
    id: 'carry-heavy',
    name: 'Finisher: Carry Heavy',
    modelGender: 'male',
    formDescription: `A dynamic illustration of a farmer's carry SHUTTLE — walking back and forth with a kettlebell, as a conditioning effort.

CAMERA ANGLE: Side view (profile).

THE COMPOSITION — BACK-AND-FORTH SHUTTLE:
- ONE man shown TWICE:
  1. SOLID figure: walking left-to-right, mid-stride, carrying a kettlebell in one hand at his side — perfect tall posture, shoulders level
  2. GHOSTED figure (lighter, smaller, further away): the same man walking back the other direction (right-to-left), having turned around
- A long dashed PATH on the floor runs the width of the image, with arrows on BOTH ends showing he walks down, turns, and walks back — a shuttle
- A curved red U-TURN arrow at the far end of the path showing the turnaround
- Bold red arrow showing his current walking direction
- His posture is rigid and upright: shoulders packed and level despite the weight on one side

ENERGY: Brisk, purposeful walking under load — gritty effort, not a stroll.

CRITICAL: ONE kettlebell carried in one hand, hanging at the side with a straight arm. Shoulders stay perfectly level. The dashed shuttle path with arrows at both ends + the U-turn arrow are essential — they show this is a back-and-forth carry.`,
  },
  {
    id: 'bridge-inferno',
    name: 'Finisher: Bridge Inferno',
    modelGender: 'female',
    formDescription: `A TWO-PANEL CIRCUIT diagram showing a glute bridge + kickback circuit — like a vintage fitness manual's circuit chart.

LAYOUT — TWO VIGNETTES SIDE BY SIDE, equal size, separated by white space:

PANEL 1 (left) — GLUTE BRIDGE:
- Side view of a woman lying on her back, hips thrust UP high, knees bent, feet flat
- Body forms a straight ramp from shoulders to knees, glutes squeezed at the top
- A small red arrow at the hips pointing up
- A red mini loop band around both thighs just above the knees

PANEL 2 (right) — STANDING KICKBACK:
- Side view of the same woman standing tall holding a chair back, red band around both ankles
- One leg kicked straight back behind her, glute squeezed, knee straight
- A small red curved arrow showing the leg sweeping back

CONNECTING THE CIRCUIT:
- A bold red arrow flows from panel 1 to panel 2
- A curved dashed arrow loops from panel 2 back to panel 1 — the circuit repeats continuously

CRITICAL: Two separate vignettes of the SAME woman side by side, connected by arrows into a repeating loop. The red band appears in both panels.`,
  },
  {
    id: 'hinge-and-drive',
    name: 'Finisher: Hinge & Drive',
    modelGender: 'female',
    formDescription: `A dynamic, high-energy illustration of FAST repeated kettlebell deadlifts — an interval conditioning diagram, not a single calm rep.

CAMERA ANGLE: Side view (profile).

THE COMPOSITION — REPEATED FAST REPS:
- ONE woman shown in TWO overlapping positions of the kettlebell deadlift:
  1. SOLID figure: standing fully tall at lockout — hips forward, glutes squeezed, kettlebell hanging from both hands in front of the thighs
  2. GHOSTED figure (lighter): hinged at the bottom — hips far back, flat back, kettlebell at mid-shin between her feet
- A bold DOUBLE-HEADED red arrow (pointing both up and down) beside her showing the bell travels up and down rapidly, rep after rep
- A dashed vertical line tracing the bell's straight up-down path
- Small motion/speed lines around the hips and the bell conveying speed and effort

ENERGY: Quick, powerful, repeated — this is conditioning. Strong lines, dynamic feel.

CRITICAL: A hip hinge — flat back, shins near vertical, hips push back. The double-headed arrow showing up-AND-down repeated movement is essential.

=== PHYSIO REVIEW FIXES (MUST HOLD) ===
- The hinged figure's NECK stays NEUTRAL — head in line with the flat back, gaze at
  the floor ahead, never craned up to look forward.
- The kettlebell is gripped with BOTH hands in both positions.`,
  },

  // =========================================================================
  // McGILL BIG 3
  // =========================================================================
  {
    id: 'mcgill-curl-up',
    name: 'McGill Curl-Up',
    modelGender: 'male',
    formDescription: `Side profile view of a man doing a McGill curl-up exercise.

The man lies on his back. His head is on the left, feet on the right.

=== PRIMARY POSITION (SOLID - Top of curl-up) ===
LEG POSITIONS - ASYMMETRICAL:
- His LEFT leg: knee bent, foot flat on floor (like sitting in a chair while lying down)
- His RIGHT leg: completely straight, lying flat on the floor from hip to heel

HAND POSITION:
- Both hands are tucked underneath his lower back, palms down
- His lower back has a slight arch with hands filling that space
- His elbows point outward and rest on the floor

HEAD/SHOULDERS:
- His head and shoulder blades are raised just 1-2 inches off the ground — BARELY lifted
- His torso stays almost flat: the angle between his back and the floor is LESS THAN 15 DEGREES
- His mid back and lower back REMAIN ON THE FLOOR — only the head and the very top of the shoulder blades hover
- Looking straight up at the ceiling (NOT forward at his knees)
- Tiny movement, not a full sit-up

=== WHAT THIS IS NOT (CRITICAL) ===
- This is NOT a sit-up. NOT a crunch. The torso NEVER comes up to 45 degrees.
- DO NOT draw the man sitting up. DO NOT lift the torso off the floor.
- If the torso is more than a few inches off the floor, the drawing is WRONG.

=== GHOSTED POSITION (FADED - Start position) ===
Show a lighter/faded version of the same figure with:
- Head and shoulders FLAT on the ground (not lifted)
- Same leg positions (one bent, one straight)
- Same hand position under lower back
- This shows the starting position before the curl-up

MOVEMENT ARROWS:
- Small red curved arrow at the head showing the tiny upward lift (a few inches only)

The KEY visuals are: (1) the asymmetry — one bent knee with foot on floor, one straight leg flat, (2) the TINY range of motion — head and shoulders barely hover off the floor.

Vintage pen-and-ink style, crosshatching, navy shorts, cream background.`,
  },
  {
    id: 'mcgill-side-plank',
    name: 'McGill Side Plank',
    modelGender: 'female',
    formDescription: `CAMERA: side view. A SINGLE woman holds a forearm side plank on the floor. She is the only person.

THE BOTTOM ARM IS THE WHOLE POINT:
- Her bottom elbow is bent to a right angle and sits directly beneath her bottom shoulder.
- Her bottom FOREARM lies FLAT ALONG THE FLOOR, pressed to the ground from elbow to hand, pointing
  forward in front of her chest. The whole forearm touches the floor.
- Her upper arm is vertical. Her bottom hand rests flat on the ground.

THE BODY: ankles, hips and shoulders form one straight line. Hips lifted and stacked, not rotated
toward the floor. Feet stacked. Her top hand rests on her top hip.

MARKS: one black dashed line running from her ankles through her hips to her head, and one red arrow
beneath her hips pointing up.

FORBIDDEN: a straight bottom arm; a locked elbow; a palm or fist planted with the arm extended; a
second figure; a ghost; any border or frame; the cream must reach all four edges of the picture.`,
  },
  {
    id: 'mcgill-bird-dog',
    name: 'Bird Dog',
    modelGender: 'male',
    formDescription: `CAMERA: a three-quarter view from ABOVE and behind him, looking down on his back, so that BOTH of his
arms and BOTH of his legs are clearly visible and none is hidden behind his body.

A SINGLE man on hands and knees. He has TWO ARMS and TWO LEGS. Draw all four, complete.

  - His LEFT hand is planted flat on the floor beneath his left shoulder. That arm is straight.
  - His RIGHT knee rests on the floor beneath his right hip. That shin lies on the ground.
  - His RIGHT arm reaches straight FORWARD at shoulder height, ending in an open hand.
  - His LEFT leg extends straight BACK at hip height, ending in a pointed foot.

So the reaching arm (right) and the extending leg (left) are on OPPOSITE sides of his body, forming a
diagonal across his back. The supporting limbs, the left hand and the right knee, are also opposite.
His extended leg is no higher than his hip. His back is flat and level, hips square.

MARKS: one dashed line along his flat back; one small red arrow at the reaching hand; one at the heel.

FORBIDDEN: the reaching arm and extending leg on the SAME side; the leg above hip height; a missing or
hidden limb; a ghost; a frame; a white margin.`,
  },

  // =========================================================================
  // STRENGTH EXERCISES
  // =========================================================================
  {
    id: 'goblet-squat',
    name: 'Goblet Squat',
    modelGender: 'female',
    formDescription: `CAMERA ANGLE: 3/4 view from the front-left, so we can see both the front of the body and slight side profile.

=== PRIMARY POSITION (SOLID - Bottom of squat) ===
BODY POSITION - BOTTOM OF THE SQUAT:
- Person is in a DEEP squat position (bottom position of the squat)
- This is the lowest point of the movement

FEET:
- Feet are shoulder-width apart or slightly wider
- Feet are flat on the ground (heels DOWN, not raised)
- Toes point outward at about 15-30 degrees

KNEES:
- Knees are bent deeply (more than 90 degrees)
- Knees track OUTWARD over the toes (not caving inward)
- Knees may be pushed out by the elbows

HIPS:
- Hips are dropped DOWN, below knee level
- This is a DEEP squat, not a half squat
- Buttocks are close to the ground (but not touching)

KETTLEBELL AND ARMS:
- Kettlebell is held at CHEST height
- Both hands cup the sides of the kettlebell handle (like holding a goblet/chalice)
- The kettlebell is vertical (bottom of bell faces down)
- Elbows point down and can touch the inside of the knees

TORSO:
- Chest is UP and proud (not collapsed forward)
- Back is straight, maintaining upright torso
- Slight forward lean is okay, but torso stays as vertical as possible

HEAD:
- Head is neutral, looking forward
- Chin is level

=== GHOSTED POSITION (FADED - Standing with KB) ===
Show a lighter/faded version of the same figure with:
- Standing UPRIGHT at full height
- Feet in same shoulder-width stance
- Kettlebell held at chest in same grip
- Knees straight (or very slightly bent)
- This is the starting position before descending into the squat

MOVEMENT ARROWS:
- Red arrow pointing DOWN from ghosted standing figure to solid squat position
- Shows the descent path of the movement
- Small curved arrows at knees showing them pushing outward

CRITICAL: This is a DEEP squat - hips well below knees in solid figure. Ghosted figure shows standing start position. Heels stay flat on ground.`,
  },
  {
    id: 'farmers-carry',
    name: "Farmer's Carry",
    modelGender: 'male',
    formDescription: `CAMERA ANGLE: Side view (profile), person walking from left to right.

=== PRIMARY POSITION (SOLID - Mid-stride) ===
BODY POSITION - MID-STRIDE:
- Person is WALKING with perfect upright posture
- Caught mid-step, one foot forward, one foot back

KETTLEBELL:
- ONE kettlebell held in the RIGHT hand (arm at side)
- Arm hangs straight down, kettlebell at thigh level
- Grip is firm, knuckles facing forward
- LEFT hand is empty (this is a single-arm carry)

POSTURE - CRITICAL:
- Shoulders are PERFECTLY LEVEL (not tilting toward the weight)
- Both shoulders are at the same height
- Shoulder blades are pulled back and down
- Spine is VERTICAL - no leaning to either side

WALKING STANCE:
- Left leg is forward, foot about to contact ground (heel strike)
- Right leg is back, pushing off from toes
- Natural walking stride - not too wide

HEAD:
- Head is up, eyes looking forward
- Chin is level, neck is neutral

=== GHOSTED POSITION (FADED - Standing start) ===
Show a lighter/faded version of the same figure with:
- Standing still with feet together or hip-width apart
- Same kettlebell grip position
- Same perfect upright posture
- This shows the starting position before walking

MOVEMENT INDICATORS:
- Red arrow pointing FORWARD showing walking direction
- Dashed line path showing the forward movement trajectory
- Small arrows at the shoulders showing they stay LEVEL
- Dashed horizontal line across shoulders showing alignment

CRITICAL: Shoulders stay LEVEL despite holding weight on only one side. Walking with tall posture.`,
  },
  {
    id: 'kb-deadlift',
    name: 'Kettlebell Deadlift',
    modelGender: 'female',
    formDescription: `CAMERA ANGLE: Side view (profile), looking at person from their right side.

=== PRIMARY POSITION (SOLID - Bottom/hinged position) ===
BODY POSITION - BOTTOM OF THE DEADLIFT (hinged position):
- Person is in a HIP HINGE position - bent forward at the hips
- This is NOT a squat - the movement is a hinge, not a sit

FEET:
- Feet are hip-width apart
- Feet are flat on ground
- Weight is in heels and mid-foot

KETTLEBELL POSITION:
- Kettlebell is on the GROUND between the feet
- Both hands grip the kettlebell handle
- Arms are straight, hanging down from shoulders

HIP HINGE - CRITICAL:
- Hips are pushed FAR BACK (like closing a car door with your butt)
- Torso is hinged forward at approximately 45-degree angle from vertical
- The fold happens at the HIP JOINT, not the lower back

BACK:
- Back is FLAT (neutral spine) - not rounded
- Chest is up, creating a flat back position
- Shoulders are pulled back (not rounded forward)

KNEES:
- Knees have a SOFT BEND (about 15-20 degrees)
- Knees are NOT deeply bent like a squat
- Shins are nearly VERTICAL

HEAD:
- Head is neutral, continuing line of spine
- Looking at a spot on the ground a few feet ahead

=== GHOSTED POSITION (FADED - Standing top position) ===
Show a lighter/faded version of the same figure with:
- Standing FULLY UPRIGHT
- Hips fully extended (standing tall)
- Kettlebell held at thigh level with arms straight down
- This is the top/lockout position of the deadlift

MOVEMENT INDICATORS:
- Red arrow pointing UP from the kettlebell showing lift direction
- Dashed line showing the path of the kettlebell from floor to standing
- Dashed line along the spine showing it stays FLAT throughout
- Curved arrow at hips showing the hinge motion (hips going back/forward)

CRITICAL: This is a HIP HINGE, not a squat. Solid figure shows bottom position (hinged). Ghosted figure shows standing top position.

=== PHYSIO REVIEW FIXES (MUST HOLD) ===
- SHINS NEAR VERTICAL: the knees stay behind the toes; the hips travel back, not down.`,
  },
  {
    id: 'kb-swing',
    name: 'Kettlebell Swing',
    modelGender: 'male',
    formDescription: `CAMERA ANGLE: Side view (profile), looking at person from their right side.

=== PRIMARY POSITION (SOLID - Top of swing) ===
BODY POSITION - TOP OF THE SWING:
- Person is at the TOP/PEAK of a kettlebell swing
- This is the moment of full hip extension

STANCE:
- Feet are shoulder-width apart
- Feet flat and planted firmly
- Weight distributed evenly

HIPS AND LEGS - CRITICAL:
- Hips are FULLY EXTENDED - pushed forward
- Standing COMPLETELY UPRIGHT (vertical torso)
- Glutes are SQUEEZED hard
- Knees are straight (but not hyperextended/locked)

KETTLEBELL POSITION:
- Kettlebell is at CHEST HEIGHT (not overhead!)
- Kettlebell is in FRONT of the body
- Arms are STRAIGHT (elbows not bent)
- The kettlebell appears to "float" at the top of its arc

ARMS:
- Both arms are straight, extended forward
- Arms are parallel to the ground at chest height
- Hands grip kettlebell handle firmly
- Shoulders are DOWN (not shrugged up)

TORSO:
- Torso is VERTICAL (standing straight up)
- Core is braced
- Body forms a straight vertical line from head to heels

HEAD:
- Head neutral, eyes forward
- Chin level

=== GHOSTED POSITION (FADED - Bottom of swing) ===
Show a lighter/faded version of the same figure with:
- Hip hinged back (butt pushed back)
- Torso tipped forward at 45 degrees
- Kettlebell swung BETWEEN the legs (behind the knees)
- Arms straight, kettlebell at bottom of arc
- This is the backswing/bottom position

MOVEMENT INDICATORS:
- Large CURVED DASHED LINE showing the full ARC of the swing (from between legs up to chest height)
- Red arrow along this arc showing the swing direction
- Arrow at hips showing the forward HIP SNAP/THRUST
- The dashed arc is critical to show the pendulum swing path

CRITICAL: Kettlebell is at CHEST height (NOT overhead) in solid figure. Ghosted figure shows bottom position between legs. Dashed arc connects the two positions.

=== PHYSIO REVIEW FIXES (MUST HOLD) ===
- The backswing ghost holds the bell HIKED HIGH into the groin, forearms against the
  inner thighs, knees barely bent — never dangling at knee height.

FINAL CORRECTIONS:
- In the backswing ghost the kettlebell handle is IN his gripped hands, wrists pressed against the upper inner thighs, bell tucked behind the pelvis — connected to the hands, never floating.`,
  },

  // =========================================================================
  // MINI LOOP BAND EXERCISES (Glute Activation & Hip Stability)
  // All exercises use a mini loop band placed ABOVE THE KNEES
  // =========================================================================
  {
    id: 'band-lateral-walk',
    name: 'Lateral Band Walk',
    modelGender: 'female',
    formDescription: `CAMERA: front view. A SINGLE woman stepping sideways with a resistance band.
She is the only person.

DRAW HER COMPLETE: head with a face and hair, neck, torso in a navy tank top and shorts, TWO whole
arms each ending in a hand, TWO whole legs each ending in a shoe. Nothing is cropped by the edge.

=== READING THE ATTACHED POSE REFERENCE ===
The attached stick figure shows the skeleton. The big dots on her legs are her KNEES. The RED BAR is
the resistance band.
  - Notice the red bar sits WELL ABOVE both knee dots, up on the lower thighs. Place the band there.
  - Her knees are bent and her stance is wide: a shallow athletic quarter squat.
Reproduce those positions. Do NOT draw the stick figure or the floor line.

HER POSITION: a clear QUARTER SQUAT — knees visibly BENT, hips pushed BACK, chest up, hands on hips.
She is NOT standing upright and her legs are NOT straight. Feet wider than her hips, mid-side-step.

THE BAND: ONE red loop on her LOWER THIGHS, a clear hand's width ABOVE both kneecaps. It never touches
or crosses a kneecap. Its red line crosses the front of both thighs, level and horizontal, and curves
out of sight behind the outer edge of each thigh. No red end is ever visible in the background.

MARKS: one bold red arrow at floor level pointing sideways.

FORBIDDEN: a band on, across or below a kneecap; a slanted band; a visible band end; straight legs;
standing upright; a missing or cropped head; a limb ending in a stump; a ghost; a frame; a white margin;
drawing the stick figure itself.

=== PHYSIO REVIEW FIXES (MUST HOLD) ===
- She is in a TRUE quarter squat: hips visibly back and down, knees clearly bent —
  never standing tall.

FINAL CORRECTIONS:
- Her THIGHS slope at about 45 degrees — hips pushed back and down as if about to sit, knees clearly bent. If her legs look straight the drawing is WRONG.`,
    poseSvg: `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <rect width="1024" height="1024" fill="#ffffff"/>
  <line x1="60" y1="900" x2="964" y2="900" stroke="#cccccc" stroke-width="6"/>
  <g stroke="#000000" stroke-width="12" stroke-linecap="round" fill="none">
    <line x1="512" y1="250" x2="512" y2="470"/>
    <line x1="420" y1="300" x2="604" y2="300"/>
    <line x1="420" y1="300" x2="380" y2="400"/>
    <line x1="380" y1="400" x2="452" y2="470"/>
    <line x1="604" y1="300" x2="644" y2="400"/>
    <line x1="644" y1="400" x2="572" y2="470"/>
    <line x1="452" y1="470" x2="572" y2="470"/>
    <line x1="452" y1="470" x2="360" y2="660"/>
    <line x1="360" y1="660" x2="330" y2="900"/>
    <line x1="572" y1="470" x2="664" y2="660"/>
    <line x1="664" y1="660" x2="694" y2="900"/>
  </g>
  <g fill="#000000">
    <circle cx="512" cy="200" r="48"/>
    <circle cx="420" cy="300" r="12"/><circle cx="604" cy="300" r="12"/>
    <circle cx="380" cy="400" r="10"/><circle cx="644" cy="400" r="10"/>
    <circle cx="452" cy="470" r="14"/><circle cx="572" cy="470" r="14"/>
    <circle cx="360" cy="660" r="16"/><circle cx="664" cy="660" r="16"/>
    <circle cx="330" cy="900" r="12"/><circle cx="694" cy="900" r="12"/>
  </g>
  <line x1="372" y1="600" x2="652" y2="600" stroke="#d81f34" stroke-width="18" stroke-linecap="round"/>
</svg>`,
  },
  {
    id: 'band-monster-walk',
    name: 'Monster Walk',
    modelGender: 'male',
    formDescription: `CAMERA: front view. A SINGLE woman steps diagonally forward with a resistance band. She is the only person.

DRAW HER COMPLETE: a head with a face and hair, a neck, a torso in a navy tank top and shorts, TWO
whole arms each ending in a hand, and TWO whole legs each ending in a shoe. Nothing is cropped.

HER POSITION — a deep QUARTER SQUAT held throughout:
- BOTH knees are clearly BENT, roughly 45 degrees, and pressed apart. Her hips are LOW and pushed back.
- NEITHER leg is straight, not even the trailing one. She stays low, like a wrestler's stance.
- Her hands are clasped in front of her chest.

THE BAND — ONE red loop, and no other red on the page except a single arrow:
- It sits on her LOWER THIGHS, a clear hand's width ABOVE both kneecaps. It never touches a kneecap.
- Its red line crosses the front of both thighs and curves out of sight behind the outer edge of each
  thigh. No red end is visible anywhere in the background.

MARKS: black dashed footprints on the floor ahead, and ONE bold red arrow showing the diagonal step.

FORBIDDEN: a straight leg; standing upright; a band on a kneecap; any floating red arc, curve or
parenthesis shape in the cream; more than one red arrow; a missing or cropped head.

=== PHYSIO REVIEW FIXES (MUST HOLD) ===
- The red band sits ABOVE BOTH kneecaps on the lower thighs — never below a knee,
  never on a shin.`,
  },
  {
    id: 'band-glute-bridge',
    name: 'Banded Glute Bridge',
    modelGender: 'male',
    formDescription: `CAMERA ANGLE: Side view (profile).

THIS IS THE SAME AS THE REGULAR GLUTE BRIDGE IN THE WARMUP SECTION - just with a band added.

=== EXACT BODY POSITION ===
A man lying on his back doing a hip thrust / glute bridge:

1. HEAD AND SHOULDERS: Flat on the ground, on the LEFT side of the image
2. ARMS: Resting on the ground beside the body
3. HIPS: Thrust UP HIGH toward the ceiling (this is the "bridge")
4. KNEES: Bent at 90 degrees, pointing toward the ceiling
5. FEET: FLAT ON THE GROUND, on the RIGHT side of image

The body makes a RAMP shape:
- Low point: shoulders on ground
- High point: hips raised up
- Knees bent, feet planted on floor

=== THE BAND — CRITICAL ===
- A red mini loop band is a SINGLE CONTINUOUS LOOP that wraps around BOTH thighs at once, just ABOVE both kneecaps (on the lower thighs, NOT on the shins)
- The band passes around the outside of the near thigh, stretches across the gap between the legs, and around the outside of the far thigh — connecting the two legs like a rubber band around two posts
- The band is visibly STRETCHED/TAUT between the two thighs because the knees push outward
- DO NOT draw the band around only one leg. DO NOT draw it on the shins or over the hips. It sits on the lower thighs just above BOTH kneecaps.

=== ARROWS ===
- Red arrow at hips pointing UP
- Small red arrows at both knees pointing OUTWARD (away from each other)

CRITICAL: This is a HIP THRUST shown as ONE single solid figure — NO ghosted second figure, NO extra figures anywhere in the image. Feet are PLANTED on the ground. Hips are lifted UP at the top of the bridge. The single loop band wraps around BOTH lower thighs above the knees and stretches between them. Exactly one person in the image.

=== MUST FIX ===
- The mini loop band is a CLOSED RED RING encircling BOTH THIGHS, sitting on the lower thighs clearly ABOVE both kneecaps. It passes in front of the near thigh, wraps around both, and disappears behind the far thigh. It has NO visible ends.
- The red arrows at the knees point OUTWARD, away from each other, showing the knees pressing APART against the band.
FORBIDDEN: a band lying on a kneecap; a band running down a shin like a dangling strap; a band across one thigh only; any blunt band end; ANY arrow pointing inward at a knee (that is the caving-knee fault).

=== ROUND 3 — THE BAND KEEPS BECOMING A STRAP. FOLLOW EXACTLY. ===
COMPOSITION A: EXACTLY ONE woman lying on her back with knees bent, feet flat, hips lifted. NO ghost.
There is EXACTLY ONE red band in the whole picture.

DRAW THE BAND THIS WAY:
  1. Pick a point on her LOWER THIGHS, clearly ABOVE both kneecaps, roughly a hand's width up the thigh.
  2. Draw a red line crossing the FRONT of the near thigh at that height.
  3. Continue that red line straight across the gap to the far thigh, at the SAME height.
  4. At the OUTER edge of the far thigh the red line CURVES AROUND AND VANISHES BEHIND the leg.
  5. At the OUTER edge of the near thigh it likewise curves around and vanishes behind.
  The red band is visible ONLY between the two outer thigh edges. It has NO ends. It never touches a
  kneecap, never runs down a shin, never appears in the open cream background.

- Red arrows: one at each knee, pointing OUTWARD and away from each other, showing the knees pressing
  apart against the band.
FORBIDDEN: a band on or below a kneecap; a band running down a shin; a strand ending in the background;
a second white or outlined strap; any arrow pointing inward at a knee; any ghost.

=== PHYSIO REVIEW FIXES (MUST HOLD) ===
- The red band sits on the LOWER THIRD OF THE THIGHS with a clear visible gap ABOVE
  both kneecaps. It never touches or crosses a kneecap.`,
  },
  {
    id: 'band-clamshell',
    name: 'Clamshell',
    modelGender: 'female',
    formDescription: `CAMERA: she lies on her side on the floor, seen from in front. A SINGLE woman, the only person.

DRAW HER COMPLETE and inside the frame: head with face and hair resting on her lower arm, torso in a
navy top and shorts, two whole arms, two whole legs ending in bare feet with toes.

HER BODY MAKES A "Z" SHAPE — this is the whole point:
- Her torso lies straight along the floor.
- At her hips, both THIGHS bend FORWARD about 45 degrees, angling away from her torso toward the
  viewer's left.
- At her knees, both SHINS bend BACK sharply, folding underneath so that her HEELS COME UP CLOSE TO
  HER BUTTOCKS. Her knees are bent to a right angle or tighter.
- So: torso one way, thighs forward, shins folded back. A Z. Her legs are tightly folded, never
  stretched out, never straight, never lying in a long line with her torso.
- Her two FEET ARE PRESSED TOGETHER, one stacked directly on the other, heels touching her backside.
- Her TOP knee is lifted and rotated open toward the ceiling, like a clamshell hinging. Her BOTTOM
  knee stays resting on the floor. Her feet stay touching as the top knee opens.

THE BAND: a red loop around both thighs, just above both kneecaps. It crosses the outer face of the
top thigh and disappears behind the bottom thigh. No end, tip or loose strap is ever visible, and it
never reaches the floor.

MARKS: one small red arrow above the top knee, curving upward.

FORBIDDEN: straight legs; legs stretched out in a long line; heels far from the buttocks; the feet
apart; a red strap reaching the floor; a visible band end; a cropped head.

=== PHYSIO REVIEW FIXES (MUST HOLD) ===
- BOTH strands of the red band sit ABOVE the knees on the lower thighs — the lower
  strand never rides at or below the bottom knee.`,
  },

  {
    id: 'band-kickback',
    name: 'Banded Kickback',
    modelGender: 'female',
    formDescription: `CAMERA ANGLE: Side view (profile). A chair or wall for support is on the LEFT.

=== PRIMARY POSITION (SOLID - leg kicked back) ===
A woman performing a standing banded glute kickback:

SETUP:
- Standing TALL, facing a chair back / wall on the left side of the image
- BOTH hands rest lightly on the chair back / wall for balance
- A small RED LOOP BAND wraps around BOTH ankles — one continuous loop encircling the left ankle and the right ankle
- The band is visibly STRETCHED between the two ankles

THE KICKBACK:
- Her STANDING leg (closer to the support) is planted flat, knee soft (slightly bent)
- Her WORKING leg is kicked STRAIGHT BACK and slightly up, knee straight, toes pointed down toward the floor
- The working leg lifts only to about 30-45 degrees behind her — a controlled squeeze, not a high kick
- Her GLUTE on the working side is visibly squeezed/contracted
- TORSO stays upright and still — she does NOT lean far forward, and her lower back does NOT arch
- Hips stay square (both hip bones face the support)

=== GHOSTED POSITION (faded - feet together) ===
Lighter version with both feet together under the hips, band relaxed around both ankles (start position).

MOVEMENT INDICATORS:
- Bold red curved arrow showing the working leg sweeping straight back
- Dashed arc showing the leg's path from standing to kicked-back
- Dashed vertical line along the torso showing it stays upright (no arching)

CRITICAL: The red loop band wraps around BOTH ankles and stretches as the leg kicks back. The kicking leg stays STRAIGHT. The torso stays tall — all the movement comes from the hip. Standing knee stays soft.

=== MUST FIX — LIMIT THE RANGE ===
- The moving leg travels BACKWARD only a SMALL amount: about 15 to 20 degrees behind the vertical standing leg. The foot stays LOW, close to the floor.
- The leg is NOWHERE NEAR horizontal and never reaches hip height.
- The LOW BACK STAYS FLAT AND NEUTRAL. The pelvis does NOT tilt forward. There is NO lumbar arch. The torso stays upright.
FORBIDDEN: the leg raised to horizontal or to hip height; an arched or hyperextended low back; an anterior pelvic tilt; the torso pitching forward to gain extra range. These are the exercise's own listed faults and must not be depicted.

=== ROUND 3 — PREVIOUS ATTEMPTS FAILED. FOLLOW EXACTLY. ===
COMPOSITION A: draw EXACTLY ONE woman standing. NO ghost, no faded legs, no second band.
- She holds a chair back with both hands. Her standing leg is vertical with a soft knee.
- The MOVING LEG travels backward only a SHORT way: its foot lifts barely off the floor, only
  about 15 to 20 degrees behind the standing leg. The foot stays LOW, below her opposite knee.
  The leg is nowhere near horizontal.
- Her LOW BACK IS FLAT. Draw a straight dashed line along her spine from tailbone to head to prove
  it. Her pelvis is level. There is NO arch, NO backward lean, NO forward tilt.
- Her torso stays upright.
- EXACTLY ONE red band, an ELLIPSE around BOTH ANKLES, disappearing behind each ankle.
- Movement: a short black dashed arc behind the moving foot, and ONE small red arrow along it.
FORBIDDEN: a ghost or faded legs; a second red band; the leg raised to horizontal or to hip height;
any arch in the low back; the pelvis tipping forward. Those are the exercise's own listed faults.`,
  },

  // =========================================================================
  // NEW STRENGTH — glute-focused, knee-friendly
  // =========================================================================
  {
    id: 'glute-bridge',
    name: 'Glute Bridge',
    modelGender: 'female',
    formDescription: `CAMERA ANGLE: Side view (profile). Head/shoulders on the LEFT, feet on the RIGHT.

=== PRIMARY POSITION (SOLID - top of bridge) ===
A woman lying on her back, hips lifted into a bridge:
- Head, shoulders and upper back flat on the floor
- Arms resting flat on the floor beside the hips, palms down
- HIPS lifted HIGH so the body forms a straight ramp from shoulders to knees
- KNEES bent about 90 degrees, pointing up
- FEET flat on the floor, hip-width apart, directly under the knees
- Glutes visibly squeezed at the top

=== GHOSTED POSITION (faded - start) ===
Lighter version with the hips resting DOWN on the floor, knees still bent, feet planted.

MOVEMENT INDICATORS:
- Bold red arrow at the hips pointing UP
- Dashed arc showing the hip path from floor to top
- Dashed straight line from shoulders to knees showing the locked-out top line

CRITICAL: Feet stay flat on the floor the whole time. No weights, no band. Hips drive straight up. This is pure bodyweight glute work.`,
  },
  {
    id: 'hip-thrust',
    name: 'Hip Thrust',
    modelGender: 'female',
    formDescription: `CAMERA: side view, seen from her left. A SINGLE woman at the TOP of a hip thrust.
She is the only person. There is ONE couch.

=== READING THE ATTACHED POSE REFERENCE ===
The attached stick figure shows the exact skeleton of the LOCKED-OUT top position:
  - Her upper back rests on the couch edge (the grey rectangle).
  - Her TORSO is HORIZONTAL — a level line from shoulder to hip, parallel with the floor.
  - Her SHIN is VERTICAL — a straight up-and-down line from knee to ankle.
  - The black bar across her hips is the DUMBBELL, sitting in the hip crease at the very top of
    her thighs.
Reproduce those angles exactly. Do NOT draw the stick figure, the grey box or the floor line.

THE POSITION: shoulders on the couch edge, hips driven all the way up so shoulders, hips and knees
form one straight horizontal line, parallel with the floor.

HER SHIN IS VERTICAL — draw this carefully. Her ANKLE sits DIRECTLY BENEATH her KNEE. If you dropped a
plumb line from her kneecap it would land on her shoelaces. Her foot is planted directly under the knee,
NOT out in front of it, and her heel is down. The shin makes a right angle with the horizontal thigh.

Ribs down, chin tucked.
The dumbbell rests LOW across the very top of her thighs, where a low-slung belt would sit — not on
her waist, not on her belly, not on her ribs. Both hands steady it there.

MARKS: one black dashed straight line from her knee through her hip to her shoulder, proving they are
level; one red arrow beneath her hips pointing straight up.

FORBIDDEN: a reclined, sloping or sagging torso; the bottom of the movement; a shin that slants
forward so the foot is ahead of the knee; a foot planted out in front of the knee; the weight
above the hip crease; a second couch; a ghost or faded figure; a frame; a white margin; drawing the
stick figure itself.

=== PHYSIO REVIEW FIXES (MUST HOLD) ===
- The dumbbell LIES ON ITS SIDE ACROSS both hips — a horizontal bar across the hip
  crease, steadied by both hands. Never standing on end, never balanced on one point.`,
    poseSvg: `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <rect width="1024" height="1024" fill="#ffffff"/>
  <line x1="60" y1="860" x2="964" y2="860" stroke="#cccccc" stroke-width="6"/>
  <rect x="140" y="470" width="150" height="390" fill="none" stroke="#cccccc" stroke-width="8"/>
  <g stroke="#000000" stroke-width="12" stroke-linecap="round" fill="none">
    <line x1="320" y1="470" x2="600" y2="470"/>
    <line x1="600" y1="470" x2="720" y2="470"/>
    <line x1="720" y1="470" x2="720" y2="860"/>
    <line x1="720" y1="860" x2="810" y2="860"/>
    <line x1="320" y1="470" x2="430" y2="580"/>
    <line x1="430" y1="580" x2="590" y2="500"/>
  </g>
  <g fill="#000000">
    <circle cx="252" cy="452" r="44"/>
    <circle cx="320" cy="470" r="14"/>
    <circle cx="430" cy="580" r="11"/>
    <circle cx="590" cy="500" r="11"/>
    <circle cx="600" cy="470" r="17"/>
    <circle cx="720" cy="470" r="17"/>
    <circle cx="720" cy="860" r="13"/>
  </g>
  <rect x="556" y="440" width="90" height="40" rx="10" fill="#000000"/>
</svg>`,
  },
  {
    id: 'single-leg-glute-bridge',
    name: 'Single-Leg Glute Bridge',
    modelGender: 'female',
    formDescription: `CAMERA ANGLE: Side view (profile). Head/shoulders on the LEFT, planted foot on the RIGHT.

=== PRIMARY POSITION (SOLID - top) ===
A woman doing a single-leg glute bridge:
- Head, shoulders, upper back flat on the floor
- Arms flat on the floor beside the body
- HIPS lifted high, body in a straight line from shoulder to the lifted leg
- ONE foot planted flat on the floor, knee bent ~90 degrees (the working leg)
- The OTHER leg extended straight out, in line with the torso, lifted off the floor
- Hips level (not dropped to one side)

=== GHOSTED POSITION (faded - start) ===
Lighter version with the hips lowered toward the floor, one leg still extended.

MOVEMENT INDICATORS:
- Bold red arrow at the hips pointing UP
- Dashed line showing the straight body-to-leg line at the top

CRITICAL: Exactly two legs — one planted with bent knee, one extended straight. Hips lift evenly. Bodyweight only.`,
  },
  {
    id: 'db-rdl',
    name: 'Dumbbell RDL',
    modelGender: 'female',
    formDescription: `CAMERA: a THREE-QUARTER FRONT view, turned about 30 degrees toward the viewer, so BOTH of her arms and
BOTH dumbbells are fully visible side by side. Neither arm is hidden behind her body or her thigh.

A SINGLE woman in a hip hinge. She has TWO complete arms of the SAME length. Draw each one fully:
shoulder, upper arm, elbow, forearm, closed fist.

  - Her LEFT arm hangs down from her left shoulder, its fist gripping ONE dumbbell.
  - Her RIGHT arm hangs down from her right shoulder, its fist gripping a SECOND dumbbell.
  - The two dumbbells hang side by side at the SAME height, in front of her shins, a little apart.
  - Two arms. Two fists. Two dumbbells. One dumbbell per fist.

HER POSITION: hips driven back, shins near vertical, knees softly bent, back FLAT from tailbone to head,
chest angled toward the floor. MARKS: one dashed straight line along her flat back.

FORBIDDEN: an arm without a shoulder or elbow; a thin hairline arm; two dumbbells at different heights;
one fist on two dumbbells; a dumbbell with no fist; a rounded back; a ghost; a frame; a white margin.

=== PHYSIO REVIEW FIXES (MUST HOLD) ===
- Both dumbbells BRUSH AGAINST the legs — in contact with the shins/thighs, zero
  daylight between bell and leg.`,
  },
  {
    id: 'box-squat',
    name: 'Box Squat',
    modelGender: 'male',
    formDescription: `CAMERA: side view. A SINGLE woman at the bottom of a box squat. She is the only person.

- She sits back until her buttocks lightly touch the top edge of a simple wooden chair behind her.
- Her shins are near vertical, her heels flat on the floor, her chest up, her arms reaching forward
  for balance. Her knees track out over her toes and do not cave inward.
- THE CHAIR IS DRAWN IN BLACK INK LINE WORK AND CROSSHATCHING ONLY, with no colour fill whatsoever.
  No brown, no tan, no wood tone. It is line art on cream, like everything else.

MARKS: one red arrow beside her hips pointing straight up, showing the drive off the chair.

CRITICAL BACKGROUND: the warm cream background fills the ENTIRE square, edge to edge, corner to
corner. There is NO white margin, NO white border, NO frame, NO inset panel, NO drop shadow around
the artwork. The cream touches all four edges of the image.

FORBIDDEN: a white margin or border of any kind; a coloured or wooden-toned chair; a second chair;
a ghost or faded figure; heels lifting; knees caving inward.

=== PHYSIO REVIEW FIXES (MUST HOLD) ===
- His bottom only LIGHTLY GRAZES the front edge of the seat — daylight visible under
  his thighs; he is hovering, not seated. Never settled onto the chair.

FINAL CORRECTIONS:
- Both legs are NORMAL drawn legs with crosshatch shading — never transparent, never showing bones or skeleton inside.`,
  },

  {
    id: 'b-stance-rdl',
    name: 'B-Stance RDL',
    modelGender: 'female',
    formDescription: `CAMERA: a THREE-QUARTER FRONT view, turned about 30 degrees toward the viewer, so BOTH of her arms and
BOTH of her feet are fully visible. Neither arm is hidden behind her torso.

A SINGLE woman. She has TWO complete arms, each with a shoulder, elbow, forearm and hand. Draw both.
One hand grips a kettlebell hanging in front of her front shin; the other arm hangs relaxed at her side.

HER FEET ARE ALMOST TOGETHER:
- Her FRONT foot is flat on the floor, carrying nearly all her weight, toes pointing forward.
- Her BACK foot is only a SHORT step behind, its TOES level with the front foot's HEEL — about one
  foot-length of gap. BOTH shoes point FORWARD in the same direction. The back heel is lightly down.
- The back leg is only a kickstand. Both legs have full calf and thigh volume; neither is a thin sliver.

HER POSITION: a hip hinge on the front leg. Hips back, front shin vertical, back FLAT.
MARKS: one dashed straight line along her flat back.

FORBIDDEN: a missing arm; a long stride; a split stance; a lunge; feet a leg-length apart; a rear shoe
pointing backward or the opposite way from the front shoe; a paper-thin leg; a ghost; a frame.

=== PHYSIO REVIEW FIXES (MUST HOLD) ===
- The rear foot is a KICKSTAND ONLY: it sits just HALF A FOOT-LENGTH behind the front
  foot, toes down, heel up, carrying almost no weight. The feet are nearly together.
- FORBIDDEN: a stride/lunge stance; the rear foot a full step behind; a loaded,
  deeply bent rear leg.`,
  },

  // =========================================================================
  // CORE & ABS (new)
  // =========================================================================
  {
    id: 'dead-bug',
    name: 'Dead Bug',
    modelGender: 'female',
    formDescription: `CAMERA: a three-quarter view from ABOVE and slightly to her side, looking down at her as she lies on
her back on the floor. This angle is chosen so that BOTH of her arms and BOTH of her legs are fully
visible against the floor. Nothing is hidden behind her body.

A SINGLE woman. She has TWO ARMS and TWO LEGS. Draw all four. Count them.

  - Her LEFT arm points straight UP toward the ceiling, ending in an open hand.
  - Her RIGHT arm lies stretched back beyond her head along the floor, ending in an open hand.
  - Her RIGHT knee is bent to a right angle and held up over her right hip: thigh vertical, shin
    horizontal, ankle, whole foot.
  - Her LEFT leg is stretched out nearly straight, hovering just above the floor, ending in a whole foot.

So her RAISED ARM (left) and her RAISED KNEE (right) are on OPPOSITE sides of her body, and her lowered
arm and lowered leg are likewise opposite. That crossing diagonal is the exercise.

Her low back is pressed flat. MARKS: one dashed line along the floor beneath her spine.

FORBIDDEN: fewer than two arms; fewer than two legs; a limb hidden behind her body; a limb ending in a
stump; a raised arm and raised knee on the same side; a ghost; a frame; a white margin.`,
  },
  {
    id: 'front-plank',
    name: 'Front Plank',
    modelGender: 'male',
    formDescription: `CAMERA ANGLE: Side view (profile).

=== PRIMARY POSITION (SOLID) ===
A man holding a forearm front plank:
- FOREARMS flat on the floor, elbows directly under the shoulders
- Body in ONE PERFECTLY STRAIGHT LINE from the heels through the hips to the head — like a rigid wooden board
- The shoulders, hips, knees and heels all lie ON the same straight line
- Hips neither sagging down nor piked up — the buttocks do NOT rise above the line and do NOT dip below it
- Toes on the floor, legs straight
- Neck neutral, looking at the floor
- Glutes and abs braced

MOVEMENT INDICATORS:
- ONE dashed straight line running from the heels through the hips to the head, showing that the body lies exactly on this line
- The dashed line must touch the back of the heels, the buttocks, and the shoulders — proving the body is straight

CRITICAL: The body must lie EXACTLY on the dashed line — shoulders, hips/buttocks, and heels all on one straight line. If the buttocks stick up above the line, the drawing is WRONG. A held static position. No ghosted second position needed — show one clean strong plank. No red arrows needed.`,
  },
  {
    id: 'hollow-hold',
    name: 'Hollow Hold',
    modelGender: 'female',
    formDescription: `CAMERA ANGLE: Side view (profile).

ONE woman only — no second figure, no ghost, no faded copy. This is a static hold.

She holds a gymnastic hollow hold:
- Lying on her BACK on the floor
- Low back PRESSED firmly into the floor — no gap anywhere beneath it
- Shoulder blades and head lifted slightly off the floor
- ARMS extended straight overhead past her ears, hovering just off the floor
- LEGS straight and together, lifted to a LOW hover — heels about a foot off the floor
- The whole body forms one shallow banana/dish curve

MARKS:
- A short dashed line on the floor directly under her low back, showing it stays pressed down
- One small red arrow at the hands and one at the heels, each pointing gently upward

FORBIDDEN: a second or faded figure; bent or tucked knees; sitting up; a visible gap
under the low back; a frame; a white margin.

=== PHYSIO REVIEW FIXES (MUST HOLD) ===
- Her LOW BACK IS GLUED to the floor — the whole lumbar area in contact. Contact runs
  from mid-back to pelvis; only shoulder blades and legs hover.
- SHALLOW dish: heels about 30cm off the floor, shoulder blades barely lifted.
- FORBIDDEN: a V-sit; legs or torso held high; floor contact at the sacrum only.`,
  },
  {
    id: 'pallof-press',
    name: 'Pallof Press',
    modelGender: 'male',
    formDescription: `THIS IS A BIRD'S-EYE VIEW DIAGRAM — the camera looks STRAIGHT DOWN from the ceiling at a man standing on the floor below. We see the top of his head, the tops of his shoulders, and his arms from above. Classic instructional-manual overhead diagram.

=== THE OVERHEAD SCENE ===
Looking straight down from above:
- The MAN stands in the center-right of the image. From above we see: the top of his head (dark hair), his two shoulders either side of it, and his feet peeking out below
- A vertical POST/POLE is at the far LEFT edge of the image (seen from above as a small circle/column top)
- A taut RED BAND runs in a straight horizontal line from the post on the left to the man's hands

=== THE KEY GEOMETRY (the entire point of this diagram) ===
- The man's CHEST FACES UP (toward the top of the image) — his shoulders form a horizontal line, his head above them
- His ARMS are extended STRAIGHT UP the image (the direction his chest faces) — both arms together, hands clasped, pointing toward the TOP of the image
- The BAND runs from his clasped hands toward the LEFT edge of the image (to the anchor post)
- So: ARMS point UP the image, BAND runs LEFT across the image — they form a clear 90-DEGREE "L" SHAPE at his hands
- The band is taut and pulls his hands toward the left; small red arrows on his torso show he RESISTS rotating

=== MOVEMENT INDICATORS ===
- A bold red arrow along his arms showing the press direction (up the image, away from his chest)
- A dashed line tracing the band to the anchor (left)
- A small curved arrow near his torso with an "X" or crossed-out styling is NOT needed — instead show two small red arrows at his shoulders pointing inward, showing his torso staying square

CRITICAL: This is an OVERHEAD/TOP-DOWN diagram. The 90-degree angle between the extended arms (pointing up the image) and the band (running left to the anchor) must be unmistakable. NO text or labels.`,
  },

  // =========================================================================
  // ARMS (new)
  // =========================================================================
  {
    id: 'db-bicep-curl',
    name: 'Dumbbell Curl',
    modelGender: 'female',
    formDescription: `CAMERA ANGLE: Side view (profile) or slight 3/4 front.

=== PRIMARY POSITION (SOLID - top of curl) ===
A woman doing a standing dumbbell biceps curl:
- Standing tall, feet hip-width
- UPPER ARMS pinned vertically against the sides of the torso (elbows do not drift forward)
- A DUMBBELL in EACH hand
- Forearms curled UP so the dumbbells are near the shoulders, palms facing the body/up
- Wrists straight, shoulders down

=== GHOSTED POSITION (faded - arms extended) ===
Lighter version with the arms hanging straight down, dumbbells at the thighs (bottom of the curl).

MOVEMENT INDICATORS:
- Bold red curved arrows at both forearms showing the curl arc upward
- Dashed line showing the elbow staying fixed at the side

CRITICAL: Elbows stay pinned to the sides. A dumbbell in EACH hand (two dumbbells). Only the forearms move.`,
  },
  {
    id: 'db-overhead-press',
    name: 'Overhead Press',
    modelGender: 'male',
    formDescription: `CAMERA ANGLE: Front view (facing viewer).

=== PRIMARY POSITION (SOLID - locked out overhead) ===
A man pressing two dumbbells overhead:
- Standing tall, feet hip-width, core braced, ribs down (no back arch)
- A DUMBBELL in EACH hand
- Arms pressed STRAIGHT UP overhead, dumbbells above the shoulders, elbows nearly locked
- Wrists stacked over the shoulders

=== GHOSTED POSITION (faded - racked at shoulders) ===
Lighter version with the dumbbells racked at shoulder height, elbows bent and tucked (start position).

MOVEMENT INDICATORS:
- Bold red arrows on both sides pointing UP showing the press
- Dashed vertical lines showing the dumbbells travel straight up over the shoulders

CRITICAL: A dumbbell in EACH hand (two dumbbells). Press straight overhead. Two arms only. No excessive back arch.`,
  },
  {
    id: 'db-tricep-kickback',
    name: 'Triceps Kickback',
    modelGender: 'female',
    formDescription: `CAMERA: side view. A SINGLE woman does a one-arm triceps kickback. She is the only person.
There is exactly ONE dumbbell in the entire picture.

- She is hinged forward at the hips, back flat, her free hand braced on a chair for support.
- Her working UPPER ARM is pinned against her ribs and is HORIZONTAL, parallel to the floor, pointing
  BACKWARD from her shoulder. It does not move.
- Her working FOREARM is straight, extending BACKWARD past her hip, so the whole working arm forms one
  straight horizontal line from shoulder to dumbbell. The dumbbell is BEHIND her, at hip height.

MARKS: a short black dashed arc under the dumbbell showing where it swings up from a bent elbow, and
ONE red arrow along that arc pointing BACKWARD toward the straight lockout. Draw no arm and no dumbbell
at the other end of the arc.

FORBIDDEN: two dumbbells; a dumbbell reaching FORWARD past her head; the arm hanging vertically down;
a dumbbell at knee height; an arrow pointing forward; a ghost or faded limb; any border or frame.`,
  },
  {
    id: 'db-lateral-raise',
    name: 'Lateral Raise',
    modelGender: 'male',
    formDescription: `CAMERA: front view. A SINGLE woman does a dumbbell lateral raise. She is the only person.

DRAW HER COMPLETE: head with face and hair, neck, torso in a navy tank top and shorts, two whole arms,
and two whole legs each ending in a bare foot with toes standing on the floor. Nothing is cropped.

HER ARMS — the elbows are the highest point:
- Her UPPER ARMS are horizontal, stretched out sideways, LEVEL WITH HER SHOULDERS.
- Her ELBOWS are the highest points of her arms, level with the tops of her shoulders.
- Her FOREARMS angle slightly DOWNWARD from those elbows, so her HANDS hang a little LOWER than her
  elbows. Each dumbbell therefore sits slightly BELOW shoulder level, roughly at armpit height.
- Nothing rises above her shoulders. Her hands are never at chin or eye level.

MARKS: one horizontal black dashed line drawn straight across the picture through both shoulder joints
and both ELBOWS, showing the elbows stopped level with the shoulders. The hands hang just under it.

COLOUR: skin is bare cream with black ink crosshatching. No peach, tan, orange or brown fill anywhere.
The dumbbells are black ink line work.

FORBIDDEN: hands above the shoulders; hands at chin or eye level; wrists higher than elbows; arms
sloping upward; a leg ending in a stump; a missing foot; a cropped head; peach or tan skin.`,
  },
  {
    id: 'push-up',
    name: 'Push-Up',
    modelGender: 'female',
    formDescription: `CAMERA ANGLE: Side view (profile).

=== PRIMARY POSITION (SOLID - bottom of push-up) ===
A woman at the bottom of a push-up:
- Body in ONE STRAIGHT LINE from heels to head
- Hands flat on the floor under the shoulders, slightly wider than shoulders
- Elbows bent, tracking back at roughly 45 degrees from the body
- Chest lowered to just above the floor
- Toes on the floor, legs straight, glutes braced

=== GHOSTED POSITION (faded - top) ===
Lighter version at the top with the arms straight, body still in a straight line.

MOVEMENT INDICATORS:
- Bold red arrow showing the body pressing UP
- Dashed straight line from heels to head showing the rigid body line

CRITICAL: Straight body line throughout (no sagging hips). Hands under shoulders. Show one clear strong push-up from the side.`,
  },
  {
    id: 'incline-push-up',
    name: 'Incline Push-Up',
    modelGender: 'female',
    formDescription: `CAMERA ANGLE: Side view (profile).

=== THE SURFACE (CRITICAL) ===
The woman's hands are on a RAISED, STURDY, HORIZONTAL SURFACE — a kitchen counter or
a solid table, drawn as a simple rectangular slab about hip-to-waist height.
Her FEET ARE ON THE FLOOR, well behind the surface. Her body is therefore INCLINED
at roughly 40 degrees to the floor — head high, feet low.
This is NOT a push-up on the floor. This is NOT a decline. The hands are HIGHER than the feet.

=== PRIMARY POSITION (SOLID - bottom) ===
- Hands flat on the surface edge, directly under the shoulders, slightly wider than shoulder width
- Elbows bent, upper arms angled back about 45 degrees from the ribs — NOT flared straight out to the sides
- Chest lowered until it is close to the surface edge
- Body in ONE STRAIGHT LINE from heels through hips to the crown of the head
- Legs straight, heels down, glutes braced, ribs down

=== GHOSTED POSITION (faded - top) ===
The ghost is the SAME woman, from the SAME camera angle, with her HANDS STILL FLAT ON
THE SAME SURFACE and her FEET STILL ON THE FLOOR IN EXACTLY THE SAME SPOT. She pivots
about her toes, so the body angle changes only slightly.
The ONLY differences from the solid figure: her elbows are now fully straight, so her
shoulders and chest sit a little higher and further from the surface.
Draw the ghost overlapping the solid figure, sharing the same feet.

FORBIDDEN FOR THE GHOST: a different camera angle, a detached or floating body, hands
not touching the surface, feet in a different place, a dramatically steeper body angle,
a standing or kneeling posture.

MOVEMENT INDICATORS:
- Bold red arrow showing the body pressing UP and away from the surface
- Dashed straight guide line running from the heels through the hips to the head, showing the rigid line

FORBIDDEN: sagging hips, piked hips, hands on the floor, feet elevated, kneeling, high-heeled shoes.
CRITICAL: The hands are on a raised surface and the feet are on the floor. Flat athletic shoes or bare feet.`,
  },
  {
    id: 'band-row',
    name: 'Band Row',
    modelGender: 'female',
    formDescription: `CAMERA ANGLE: Side view (profile).

=== SETUP ===
A woman SEATED UPRIGHT on the floor with her legs extended straight in front of her.
A resistance band is looped around the soles of BOTH FEET, and she holds ONE END OF
THE BAND IN EACH HAND. The band runs from her feet back to her hands in two roughly
parallel lines. Draw the band as a smooth, continuous elastic cord with visible tension.

=== PRIMARY POSITION (SOLID - the pull) ===
- Torso VERTICAL and tall. The spine is neutral — a gentle natural curve, NOT rounded.
- Elbows pulled BACK past the ribs, tucked close to the sides of the torso
- Shoulder blades squeezed together, chest open, shoulders DOWN away from the ears
- Hands at the lower ribs, wrists straight and neutral
- Legs straight, feet flexed so the band cannot slip

=== ONE FIGURE ONLY — NO GHOSTED SECOND FIGURE ===
Draw EXACTLY ONE woman. Do NOT draw a ghosted, faded, phantom, or semi-transparent
second figure. Do NOT draw ghosted, faded, or disembodied arms floating in the air.
There is ONE body, ONE pair of arms, ONE pair of legs, drawn at full ink weight.

=== THE POSITION (the pull, at full ink weight) ===
- Torso VERTICAL and tall. The spine is neutral — a gentle natural curve, NOT rounded,
  NOT leaning backward.
- Elbows pulled BACK past the ribs, tucked close to the sides of the torso
- Shoulder blades squeezed together, chest open, shoulders DOWN away from the ears
- Hands at the lower ribs, wrists straight and neutral
- Legs straight, feet flexed so the band cannot slip
- The band runs taut from BOTH feet back to BOTH hands. Draw the band as one continuous
  elastic cord. Both ends are gripped. No loose or unattached band ends anywhere.

=== SHOWING THE MOVEMENT WITHOUT A SECOND FIGURE ===
- A DASHED CURVED PATH LINE running forward from each hand, out to where the hands would
  be at full reach (arms straight, at chest height). The dashed line is thin and black —
  it is a trajectory, not an arm. Draw NO hand and NO arm at the far end of it.
- A bold red arrow along that dashed path, pointing BACKWARD toward the ribs, showing the
  direction the hands travel.
- A dashed vertical guide line up the spine showing the torso stays upright.

FORBIDDEN: any ghosted figure, any floating limb, leaning the torso backward, shrugged
shoulders, rounded low back, elbows flared wide, a band end attached to nothing.
CRITICAL: The band is looped around BOTH feet and held in BOTH hands — never one side only.
ONE figure. The movement is shown by a dashed path and a red arrow, nothing else.`,
  },
  {
    id: 'db-row',
    name: 'Dumbbell Row',
    modelGender: 'female',
    formDescription: `CAMERA ANGLE: Side view (profile), showing her left side.

=== SETUP (CRITICAL — a SUPPORTED single-arm row) ===
A woman hinged forward at the hips beside a sturdy CHAIR.
- Her RIGHT hand is planted flat on the chair seat, that arm straight, supporting her torso
- Her LEFT hand holds ONE dumbbell hanging straight down toward the floor
- Feet on the floor, roughly hip-width, knees SOFT (a slight bend, not a squat)
- Hips pushed BACK so the torso is inclined to roughly 45 degrees — closer to horizontal than vertical
- The BACK IS FLAT from tailbone to the crown of the head. Draw a straight, neutral spine.
  The head continues the line of the spine; she looks at the floor, NOT up.

=== PRIMARY POSITION (SOLID - top of the row) ===
- The dumbbell has been pulled up to the HIP, not to the chest or shoulder
- The left elbow is driven straight BACK past the ribs, tucked close to the torso
- The shoulder blade is squeezed toward the spine
- The torso stays SQUARE — the shoulders have NOT rotated open toward the ceiling
- Wrist straight and neutral, the dumbbell horizontal

=== GHOSTED POSITION (faded - bottom) ===
Lighter version with the left arm hanging straight down, dumbbell near the floor,
shoulder blade allowed to slide forward. Identical torso angle and flat back.

MOVEMENT INDICATORS:
- Bold red arrow following the dumbbell's path straight UP to the hip
- Dashed straight guide line along the spine from tailbone to head, showing the flat back
- Short dashed horizontal line at the shoulders showing they stay level (no rotation)

FORBIDDEN: rounded low back, twisting the torso open, standing upright, both hands holding dumbbells,
pulling the dumbbell to the chest, looking up.
CRITICAL: EXACTLY ONE dumbbell, in the LEFT hand. The RIGHT hand is flat on the chair.
The back is FLAT and the torso does NOT rotate.`,
  },
  {
    id: 'band-pull-apart',
    name: 'Band Pull-Apart',
    modelGender: 'male',
    formDescription: `CAMERA ANGLE: Front view (facing viewer).

=== PRIMARY POSITION (SOLID - band pulled apart) ===
A man doing a band pull-apart:
- Standing tall, feet hip-width
- ARMS extended STRAIGHT out in front at chest height
- A RED resistance band held taut between BOTH hands
- Hands pulled APART out to the sides so the band stretches across the chest, arms forming a wide shape
- Shoulder blades squeezed together, chest proud

=== GHOSTED POSITION (faded - hands together) ===
Lighter version with the arms straight out front and the hands close together, band relaxed (start position).

MOVEMENT INDICATORS:
- Bold red arrows showing both hands pulling OUTWARD to the sides
- Dashed line showing the band stretching across the chest

CRITICAL: Arms stay straight out at chest height; the hands pull apart sideways, stretching the band across the chest. Show the band clearly held in both hands.

=== MUST FIX — EXACTLY TWO ARMS ===
The man has EXACTLY TWO ARMS: one pair of shoulders, one pair of elbows, one pair of hands. Count them.
Both arms are STRAIGHT, held out to the sides at chest height, each hand gripping one end of the red band. The band is ONE continuous red line running from the left fist, across in front of the chest, to the right fist.
FORBIDDEN: four arms; a second pair of bent forearms; a second pair of fists meeting at the sternum; any loose red band stub hanging in the air from a fist; any band end that is not held in a hand.

=== ROUND 3 — THE FIGURE KEEPS GETTING FOUR ARMS. FOLLOW EXACTLY. ===
COMPOSITION A: draw EXACTLY ONE man, front view, at full ink weight. NO ghost.
He has ONE head, ONE torso, and EXACTLY TWO ARMS. Count them before you finish: two shoulders,
two elbows, two hands. There is no third arm and no second pair of forearms anywhere.
- Both arms are STRAIGHT and held out to the sides at chest height, forming one straight horizontal
  line from left hand through the shoulders to the right hand.
- Each hand grips ONE end of a red band. The band is ONE continuous red line running from the left
  fist, passing in FRONT of the chest, to the right fist. It touches nothing else.
- Movement: ONE red arrow at each hand pointing OUTWARD, away from the body, showing the band being
  pulled apart.
FORBIDDEN: four arms; a second pair of bent forearms; two fists meeting at the sternum; any ghost;
any loose red band stub hanging in the air; a band end not held in a hand.`,
  },

  // =========================================================================
  // MOBILITY EXERCISES
  // =========================================================================
  {
    id: '90-90',
    name: '90/90 Hip Stretch',
    modelGender: 'female',
    formDescription: `CAMERA for the finished drawing: three-quarter view, from slightly ABOVE and IN FRONT of her,
looking down at the floor.

A SINGLE woman sits on the floor. She is the only person.

=== READING THE ATTACHED POSE REFERENCE ===
The attached diagram is a BIRD'S-EYE PLAN of this pose — the floor seen from directly overhead.
It shows which direction each limb points ALONG THE FLOOR. Because it is a view from above,
EVERY limb in it lies flat on the ground.
  - DOWN the diagram = in front of her.   UP the diagram = behind her.
  - Her FRONT leg: the thigh points forward, the knee folds, the SHIN runs across to her right.
  - Her BACK leg: the thigh points out to her side, the knee folds, the SHIN runs backward behind her.
  - Both knees are right angles. Both thighs meet at roughly a right angle.
Reproduce those limb directions and joint angles, then draw her from the three-quarter camera above.

HER LEGS: both hips bent to a right angle, both knees bent to a right angle. BOTH SHINS LIE FLAT ON
THE FLOOR — one in front of her, one behind her — with the ankle and outer edge of each foot resting
on the ground. Neither foot is lifted into the air. Neither leg is straight or stretched out.
This is NOT a Z-sit, NOT a side-sit, NOT a hurdler stretch, NOT a straddle, NOT a kneeling lunge.

HER TORSO: tall, upright, vertical, on both sit-bones, spine straight, chest lifted. One hand rests
lightly on the floor beside her.

THE ONLY MARK besides her is ONE small curved red arrow near her hips.

FORBIDDEN: a lifted foot; a shin off the floor; a straight leg; a leg stretched out; a rounded or
leaning torso; any dashed line; any angle tick, corner square or arc at a joint; any numeral or
letter; a ghost; a frame; a white margin; drawing the stick figure itself.`,
    poseSvg: `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <rect width="1024" height="1024" fill="#ffffff"/>
  <g stroke="#000000" stroke-width="11" stroke-linecap="round" fill="none">
    <line x1="512" y1="340" x2="512" y2="470"/>
    <line x1="432" y1="340" x2="592" y2="340"/>
    <line x1="432" y1="340" x2="360" y2="410"/>
    <line x1="360" y1="410" x2="330" y2="470"/>
    <line x1="592" y1="340" x2="664" y2="410"/>
    <line x1="664" y1="410" x2="694" y2="470"/>
    <line x1="470" y1="470" x2="554" y2="470"/>
    <line x1="470" y1="470" x2="452" y2="650"/>
    <line x1="452" y1="650" x2="232" y2="668"/>
    <line x1="554" y1="470" x2="740" y2="486"/>
    <line x1="740" y1="486" x2="760" y2="286"/>
  </g>
  <g fill="#000000">
    <circle cx="512" cy="300" r="46"/>
    <circle cx="432" cy="340" r="13"/><circle cx="592" cy="340" r="13"/>
    <circle cx="360" cy="410" r="10"/><circle cx="664" cy="410" r="10"/>
    <circle cx="330" cy="470" r="10"/><circle cx="694" cy="470" r="10"/>
    <circle cx="470" cy="470" r="14"/><circle cx="554" cy="470" r="14"/>
    <circle cx="452" cy="650" r="16"/><circle cx="740" cy="486" r="16"/>
    <circle cx="232" cy="668" r="13"/><circle cx="760" cy="286" r="13"/>
  </g>
</svg>`,
  },
  {
    id: 'deep-squat-hold',
    name: 'Supported Squat Hold',
    modelGender: 'male',
    formDescription: `CAMERA ANGLE: Side/3-4 view showing the person holding a vertical support.

=== PRIMARY POSITION (SOLID - supported squat hold) ===
A man holding a comfortable squat while HOLDING ONTO A VERTICAL SUPPORT for assistance (this is a knee-friendly, assisted mobility hold):
- A VERTICAL POLE, DOORFRAME EDGE, or sturdy RAIL drawn in front of him
- BOTH hands grip the support at about chest/shoulder height
- He uses the support to take weight off the knees and stay balanced
- Squatting down to a COMFORTABLE depth — hips around knee height, NOT slammed to the bottom (depth is moderate, knee-friendly)
- HEELS FLAT on the ground
- Feet shoulder-width, toes slightly out, knees tracking over toes
- Torso upright (the support helps keep the chest tall)
- Calm, relaxed expression — this is a held stretch

=== GHOSTED POSITION (FADED - standing) ===
Lighter version standing tall, still lightly holding the support, before sinking into the squat.

MOVEMENT INDICATORS:
- Bold red arrow showing the hips descending to the squat
- Dashed line at the heels emphasizing they stay FLAT
- Dashed horizontal line at hip/knee height showing the moderate (not maximal) depth

CRITICAL: He is HOLDING A VERTICAL SUPPORT (pole/doorframe/rail) with both hands for assistance. Depth is MODERATE and comfortable, not the deepest possible squat — this is the knee-friendly version. Heels stay flat. Show the support clearly.

=== MUST FIX ===
There is EXACTLY ONE vertical rail or doorframe in the picture, standing on the floor with a visible base where it meets the ground.
BOTH the solid figure and the ghost hold THAT SAME rail. A fixed support cannot move between two moments of the same hold.
FORBIDDEN: two rails; a duplicated rail drawn for the ghost; a rail that floats and never reaches the floor.

=== ROUND 3 NOTE ===
Keep exactly ONE vertical rail with a visible floor base. If a ghost is drawn it must be a complete
grey-outline body holding THAT SAME rail. Preferably draw no ghost at all.`,
  },
  {
    id: 'couch-stretch',
    name: 'Couch Stretch',
    modelGender: 'female',
    formDescription: `CAMERA ANGLE: Side view (profile), looking at person from their left side. A wall is on the right side of the image.

=== PRIMARY POSITION (SOLID - Full stretch position) ===
BODY POSITION - LUNGE WITH BACK FOOT ON WALL:
- Person is in a deep lunge position with back foot elevated against a wall

FRONT LEG (left leg, closer to camera):
- Foot is flat on the ground
- Knee is bent at approximately 90 degrees
- Shin is vertical (perpendicular to ground)
- Thigh is horizontal (parallel to ground)

BACK LEG (right leg, against wall) - CRITICAL:
- KNEE is on the ground (use a pad/mat for comfort)
- SHIN runs UP the wall VERTICALLY
- TOP of the FOOT is pressed against the wall
- This creates an intense stretch in the hip flexor and quadricep

WALL:
- The wall is behind the person
- The back shin/foot is pressed against the wall
- The corner where wall meets floor is where the back knee rests

TORSO:
- Torso is UPRIGHT and TALL (not leaning forward)
- Spine is vertical
- Core is engaged
- Back glute is SQUEEZED to intensify the stretch

ARMS:
- Hands rest on the front knee for support

HEAD:
- Head neutral, looking forward
- Tall posture

=== GHOSTED POSITION (FADED - Setup position) ===
Show a lighter/faded version of the same figure with:
- Same lunge position but torso LEANING FORWARD with hands on ground
- This is the easier/setup position before coming upright
- Back knee and shin still in position against wall
- Shows the progression into the full stretch

MOVEMENT INDICATORS:
- Dashed arc showing the torso path from forward lean to upright
- Arrow at back hip showing the hip OPENING/EXTENDING
- Arrow at back glute showing the SQUEEZE
- Dashed vertical line at front shin showing it stays vertical

CRITICAL: Back shin goes UP the wall with top of foot against wall. Knee on ground at base of wall. Solid figure is upright, ghosted figure shows setup position.

=== MUST FIX ===
If a ghost is drawn, it must be in the SAME kneeling couch-stretch position: back knee on the SAME pad against the SAME wall, front foot planted, torso TALL. The ghost differs only slightly — a fractionally more upright torso and a stronger back-glute squeeze.
Any red arrow must point FROM a slightly forward-leaning position TOWARD the tall upright position. The arrow shows the user what to DO.
FORBIDDEN: a ghost on hands and knees; a ghost out in open space away from the wall; a ghost whose back knee has left the pad; a red arrow running from the tall torso toward a collapsed forward-leaning body. Never draw an arrow that instructs the fault "leaning the torso forward to escape the stretch".

=== ROUND 3 — THE GHOST KEEPS COLLAPSING ONTO ALL FOURS. FOLLOW EXACTLY. ===
COMPOSITION A: draw EXACTLY ONE woman. NO ghost, no faded figure, no second body.
- Her BACK KNEE rests on a folded pad on the floor, pressed against the base of a WALL. Her back
  shin runs straight UP the face of the wall, toes pointing up.
- Her FRONT foot is planted flat on the floor ahead, front knee bent about 90 degrees.
- Her TORSO IS TALL AND VERTICAL, stacked over her hips. Her back glute is squeezed and her pelvis
  is tucked slightly under, so her low back is FLAT, not arched.
- Movement: ONE small red arrow at her back hip pointing forward, showing the hip driving forward
  into the stretch. Optionally a short vertical dashed line up her spine to show it stays tall.
FORBIDDEN: any ghost or faded figure; a figure on hands and knees; a body out in open space away
from the wall; a back knee off the pad; ANY red arrow pointing from the tall torso toward a
forward-leaning position. Never illustrate leaning the torso forward — that is the listed fault.`,
  },
  {
    id: 'pigeon-stretch',
    name: 'Pigeon Stretch',
    modelGender: 'male',
    formDescription: `A SINGLE woman, alone on an empty cream page. Count the heads in this picture: exactly ONE.
There is no second person, no faded person, no grey person, no overlay, no phantom, no shadow figure.

CAMERA: three-quarter view from slightly above and in front, so the floor and both of her legs are
clearly visible against plain cream.

HER POSE — the pigeon stretch, sitting upright:
- FRONT LEG, nearest the viewer, drawn complete and entirely visible: hip, then a THIGH angling
  forward, then a clearly bent KNEE, then a SHIN lying flat on the floor across the front of her
  body, then an ANKLE, then a whole FOOT with toes. Every joint is drawn. Nothing is hidden behind
  her shorts, her hand, or her body.
- BACK LEG, drawn complete: hip, THIGH extending straight back behind her, KNEE, SHIN resting along
  the floor, ANKLE, and a whole FOOT with the top of the foot flat on the ground.
- Her hips are square to the floor. Her chest is tall and lifted. Her spine is straight, not rounded.
- Her hands rest lightly on the floor beside her hips.

THE ONLY MARK on the page besides the figure is ONE small red arrow at her front hip, pointing gently
down, showing the hip sinking toward the floor.

FORBIDDEN: a second figure of any kind. A faded, grey, ghosted or semi-transparent body. A figure
folded forward over its leg. A dashed arc leading away to another body. A leg ending in a blunt
rounded stump. A foot hidden behind the body. A rounded spine.

=== PHYSIO REVIEW FIXES (MUST HOLD) ===
- HIPS SQUARE to the floor: both hip bones face straight down, the back leg trailing
  STRAIGHT behind on the centre line, hands planted symmetrically either side.`,
  },

  // =========================================================================
  // WARMUP EXERCISES
  // =========================================================================
  {
    id: 'cat-cow',
    name: 'Cat-Cow',
    modelGender: 'female',
    formDescription: `CAMERA ANGLE: Side view (profile), looking at person from their left side.

=== PRIMARY POSITION (SOLID - "CAT" position) ===
BODY POSITION - "CAT" POSITION (spinal flexion):
- Person is on HANDS and KNEES (quadruped position)
- Showing the "CAT" portion of cat-cow

HANDS AND ARMS:
- Hands flat on ground, DIRECTLY UNDER shoulders
- Arms are straight (elbows not bent)
- Fingers spread for stability

KNEES AND LEGS:
- Knees on ground, DIRECTLY UNDER hips
- Shins flat on ground behind
- Thighs are vertical

SPINE - THE KEY ELEMENT:
- Back is ROUNDED UP toward the ceiling
- Like an angry/scared cat arching its back
- Maximum spinal FLEXION (rounding)
- The middle of the back is the highest point

HEAD:
- Head is dropped DOWN
- Chin tucked toward chest
- Looking at knees or navel
- Neck continues the rounded curve of spine

PELVIS:
- Tailbone is tucked UNDER
- Pelvis tilts posteriorly (pubic bone lifts toward navel)

ABDOMEN:
- Belly is pulled IN toward spine
- Core is engaged

=== GHOSTED POSITION (FADED - "COW" position) ===
Show a lighter/faded version of the SAME figure, FACING THE SAME DIRECTION.

ORIENTATION (CRITICAL — this has failed before):
- The solid figure's HEAD is at the LEFT of the image and her FEET are at the RIGHT.
- The ghost's HEAD must ALSO be at the LEFT and her FEET ALSO at the RIGHT.
- The ghost must NOT be mirrored, flipped, or reversed end-for-end. Her hands must be
  under HER OWN shoulders at the LEFT, directly overlapping the solid figure's hands.
- The ghost shares the solid figure's hand positions and knee positions exactly; she is
  the same person on the same floor, one instant later.
- Only the SPINE and the HEAD ANGLE differ between the two figures.

The ghost shows:
- Same hands and knees position on ground
- Back ARCHED DOWNWARD (sway back) - spine dips toward floor
- Head LIFTED UP, looking forward or slightly up

FORBIDDEN: a ghost facing the opposite direction; a ghost whose head is at the right; a
mirrored ghost; any composition that reads as one animal with a head at each end; a foot
drawn beneath the other figure's face.
- Belly relaxed and dropping toward floor
- Tailbone tilted UP (opposite of cat)
- This is spinal EXTENSION (arching down)

MOVEMENT INDICATORS:
- Large curved arrow showing spine movement between positions
- Dashed curved line showing the range of spinal motion (from rounded up to arched down)
- Arrow at pelvis showing the tilt direction
- Arrow at head showing the lift/drop motion

CRITICAL: Solid figure shows CAT (rounded up). Ghosted figure shows COW (arched down). This shows the full range of the alternating movement.

=== ROUND 3 — THE GHOST KEEPS COMING OUT MIRRORED. FOLLOW EXACTLY. ===
COMPOSITION B: draw EXACTLY TWO complete women, BOTH at FULL INK WEIGHT, SIDE BY SIDE, clearly
SEPARATED with plain cream background between them. Neither is faded. Neither overlaps the other.
Both face the SAME direction: BOTH heads at the LEFT of the image, BOTH sets of feet at the RIGHT.

  LEFT FIGURE — the "CAT": on hands and knees, back ROUNDED UP toward the ceiling, head dropped,
  chin toward chest, tailbone tucked under.

  RIGHT FIGURE — the "COW": on hands and knees, back ARCHED DOWN toward the floor, chest opened,
  head lifted to look forward, tailbone lifted.

Each figure has one head, one torso, two arms and two legs, hands under shoulders and knees under
hips, on her own patch of floor.
MOVEMENT: a curved black dashed line above the two figures with a double-headed red arrow, showing
the spine cycling between the two shapes.
FORBIDDEN: a ghosted or faded figure; a mirrored figure; a figure whose head is at the right; the two
figures overlapping; a composition reading as one animal with a head at each end; a foot beneath the
other figure's face.`,
  },
  {
    id: 'leg-swings',
    name: 'Leg Swings',
    modelGender: 'male',
    formDescription: `CAMERA ANGLE: Side view (profile), looking at person from their right side. A wall or support is on the left.

=== PRIMARY POSITION (SOLID - Forward swing) ===
BODY POSITION - DYNAMIC LEG SWING:
- Person is standing on ONE leg, swinging the other leg forward

SUPPORT (THE HAND MUST TOUCH — past attempts left a gap):
- His LEFT hand rests FLAT ON the wall at shoulder height, palm in FULL CONTACT with
  the wall surface. Zero gap between hand and wall — he is leaning some weight on it.
- This provides balance during the dynamic movement

STANDING LEG (left leg):
- Left foot is flat on ground
- Left leg is STRAIGHT (or very slight bend)
- This leg stays STATIONARY and stable
- All weight is on this leg

SWINGING LEG (right leg):
- Right leg swings FORWARD and UP (in front of the body)
- Leg is lifted to approximately hip height or higher
- The leg stays RELATIVELY STRAIGHT during the swing
- Toes point forward

TORSO:
- Torso stays UPRIGHT and STABLE
- Core is braced
- Upper body does NOT swing with the leg
- Minimal forward/backward lean

HEAD:
- Looking forward
- Head stays stable

=== GHOSTED POSITION (FADED - Back swing) ===
Show a lighter/faded version of the same figure with:
=== OVERRIDE: ONE FIGURE ONLY — NO GHOSTED SECOND FIGURE ===
Ignore the ghosted overlay technique described in the style guide. Ghosting this pose has
repeatedly produced orphan legs and feet floating with no hip attached.

Draw EXACTLY ONE man, at full ink weight. He has EXACTLY 2 arms and EXACTLY 2 legs.
- His left hand rests flat on the wall at the left. His left arm is a normal ARM ending in a
  HAND — not a foot.
- His left foot is PLANTED FLAT on the floor, bearing all his weight.
- His right leg is swung FORWARD, straight, to about hip height. It is attached at his hip.
- Exactly TWO feet exist in the entire image: one planted on the floor, one at the end of the
  swinging leg.

=== SHOWING THE MOVEMENT WITHOUT A SECOND FIGURE ===
- A large curved DASHED ARC beneath and in front of him, tracing the pendulum path the foot
  travels from behind his body to in front of it. It is a thin black trajectory line — draw NO
  leg, NO foot and NO shoe at the far end of it.
- ONE double-headed bold red arrow following that arc, showing the leg swings forward and back.
- A dashed vertical guide line down the standing leg showing it stays stable.

FORBIDDEN: any ghosted, faded, phantom or semi-transparent figure; a second person; a third
leg; any foot, shoe, hand or limb not attached to the single figure's body; a floating foot
near the wall; any small circle, ring or annotation drawn on the hip.

CRITICAL: ONE man. TWO arms. TWO legs. TWO feet. The movement is shown by a dashed arc and one
red double-headed arrow, and by nothing else.`,
  },
  {
    id: 'hip-circles',
    name: 'Hip Circles',
    modelGender: 'female',
    formDescription: `CAMERA ANGLE: 3/4 front view, seeing front and slight side of person.

=== PRIMARY POSITION (SOLID - One point in circle) ===
BODY POSITION - STANDING HIP CIRCLES:
- Person is standing upright, moving hips in a circular motion
- Like hula hooping without a hoop

FEET:
- Feet are shoulder-width apart (or slightly wider)
- Feet stay FLAT and PLANTED on ground
- Feet do not move during the exercise

KNEES:
- Knees are SOFT (slight bend)
- Not locked straight, not deeply bent
- Knees may move slightly with the hip motion

HIPS - THE MOVING PART:
- Hips are shifted to the RIGHT SIDE (one point of the circle)
- Show clear lateral hip shift in this position
- Like stirring a pot with your hips

UPPER BODY:
- Upper body stays RELATIVELY STABLE
- Shoulders stay mostly level
- Upper body does not swing wildly

ARMS:
- HANDS ON HIPS (this is the classic position for this exercise)
- Elbows point outward
- This helps feel and control the hip movement

HEAD:
- Head stays neutral and relatively stable
- Looking forward

=== GHOSTED POSITION (FADED - Opposite point in circle) ===
Show a lighter/faded version of the same figure with:
- Same standing stance and hands on hips
- Hips shifted to the LEFT SIDE (opposite point of the circle)
- Shows the range of hip movement side to side

MOVEMENT INDICATORS:
- CIRCULAR DASHED LINE around the hip area showing the rotation path
- The dashed circle should be clearly visible in a horizontal plane
- Red arrow along the circle showing rotation direction (clockwise or counterclockwise)
- Dashed vertical line through the center showing the stable axis

CRITICAL: Hands on hips. Dashed circular path shows the hip rotation. Solid and ghosted figures show opposite points of the circle. Upper body and feet stay stable.`,
  },
  {
    id: 'glute-bridge-warmup',
    name: 'Glute Bridge',
    modelGender: 'male',
    formDescription: `CAMERA ANGLE: Side view (profile), looking at person from their right side.

=== PRIMARY POSITION (SOLID - Hips up/bridge position) ===
BODY POSITION - TOP OF THE BRIDGE:
The man's body makes a BRIDGE or RAMP shape:
- HEAD and SHOULDERS rest on the floor
- HIPS are thrust UP HIGH (the peak of the bridge)
- Body forms a straight line from shoulders to knees
- KNEES are bent at 90 degrees
- FEET are FLAT on the floor

ARMS:
- Arms rest on the floor beside the body
- Palms facing down for stability

CRITICAL: The man's feet must be on the ground. Both soles of his feet touch the floor. His knees point toward the ceiling. His hips are the highest point.

The silhouette looks like a triangle: floor to shoulders (low), up to hips (high), down to knees (medium), feet on floor.

DO NOT show legs in the air. DO NOT show a leg raise. The feet MUST be on the ground.

=== MOVEMENT INDICATORS (NO SECOND FIGURE) ===
Draw ONE figure only — no ghost, no faded copy, no second body.
- A black dashed arc tracing the path the hips travelled from the floor up to their lifted position
- One bold red arrow pointing UP at the hips
- A dashed straight line from shoulders through hips to knees marking the straight top position

CRITICAL: ONE man only. Feet flat on the ground, knees bent, hips the highest point.

FORBIDDEN: a second or faded figure; feet leaving the floor; a frame; a white margin.`,
  },
];

async function generateImage(exercise: ExerciseIllustration): Promise<boolean> {
  console.log(`Generating: ${exercise.name}...`);

  const poseNote = exercise.poseSvg
    ? `

=== POSE REFERENCE IMAGE (ATTACHED) ===
An attached stick-figure diagram shows the EXACT skeleton of this pose: the dots are joints
(head, shoulders, elbows, wrists, hips, knees, ankles) and the lines are bones.

- Reproduce those JOINT POSITIONS and LIMB ANGLES exactly. The reference is the ground truth
  for the pose; the words above only describe it.
- Match its camera angle, the direction each limb points, and which limbs touch the floor.
- Do NOT copy its appearance. Do NOT draw dots, lines, sticks or a skeleton. Draw a real,
  fully-rendered human in the vintage pen-and-ink style described above, flesh and clothing,
  standing in exactly that skeleton's pose.`
    : '';

  const prompt = `${STYLE_GUIDE}

=== EXERCISE: ${exercise.name} ===

${exercise.formDescription}${poseNote}

MODEL: Athletic ${exercise.modelGender}.

FINAL REMINDERS:
- Cream background, black ink lines, navy clothing, RED arrows
- NO text or labels
- Anatomically correct - exactly 2 arms, 2 legs
- Follow the position description EXACTLY`;

  // The pose reference goes FIRST in the parts array: the model reads it as context that the
  // following text refines, rather than as something to imitate stylistically.
  const parts: Array<Record<string, unknown>> = [];
  if (exercise.poseSvg) {
    const png = await sharp(Buffer.from(exercise.poseSvg)).png().toBuffer();
    parts.push({ inlineData: { mimeType: 'image/png', data: png.toString('base64') } });
  }
  parts.push({ text: prompt });

  try {
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
      const error = await response.text();
      console.error(`  API error: ${response.status} - ${error}`);
      return false;
    }

    const data = (await response.json()) as {
      candidates?: Array<{
        content?: {
          parts?: Array<{
            inlineData?: { data: string; mimeType: string };
          }>;
        };
      }>;
    };

    const responseParts = data.candidates?.[0]?.content?.parts || [];

    for (const part of responseParts) {
      if (part.inlineData) {
        const imageBuffer = Buffer.from(part.inlineData.data, 'base64');
        const imagePath = path.join(OUTPUT_DIR, `${exercise.id}.png`);
        fs.writeFileSync(imagePath, imageBuffer);
        console.log(`  ✓ Saved: ${exercise.id}.png`);
        return true;
      }
    }

    console.error(`  ✗ No image generated for ${exercise.name}`);
    return false;
  } catch (error) {
    console.error(`  ✗ Error generating ${exercise.name}:`, error);
    return false;
  }
}

// =============================================================================
// OG IMAGE GENERATION
// =============================================================================
async function generateOgImage(): Promise<boolean> {
  console.log('Generating OG image...');

  const ogPrompt = `Create a wide banner image (1200x630 pixels aspect ratio) for a fitness app called "Idaraya" (meaning "exercise" in Yoruba).

STYLE: Vintage 1950s-1960s fitness manual illustration style
- Traditional pen and ink illustration with crosshatching
- Clean, professional instructional manual quality
- Bold black ink lines

COLOR PALETTE:
- Background: Warm cream/off-white (#F5F0E6)
- Figures: Black ink linework with crosshatching
- Clothing: Deep navy blue (#1a3a5c)
- Accent arrows: Bold red (#c41e3a)

COMPOSITION:
- Wide banner format (landscape, approximately 1200x630 proportions)
- Show 3-4 small exercise vignettes arranged horizontally across the image
- Examples: kettlebell swing silhouette, deep squat figure, plank position, hip hinge
- Each figure is a small vintage-style illustration
- Figures should be evenly spaced across the width
- Leave some negative space between figures

VISUAL ELEMENTS:
- Decorative vintage border or frame around the edge (thin black line, possibly with corner ornaments)
- Small red accent arrows showing movement direction on 1-2 figures
- Dashed lines showing movement paths
- Each figure shows both solid and ghosted positions to indicate movement
- Overall feel: classic, timeless, professional fitness instruction

NO TEXT - just illustrations. The app name will be overlaid separately.

Make it look like a beautiful vintage fitness manual illustration spread.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${IMAGE_MODEL}:generateContent?key=${GOOGLE_AI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: ogPrompt }] }],
          generationConfig: {
            responseModalities: ['TEXT', 'IMAGE'],
            imageConfig: { aspectRatio: '16:9', imageSize: '2K' },
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error(`  API error: ${response.status} - ${error}`);
      return false;
    }

    const data = (await response.json()) as {
      candidates?: Array<{
        content?: {
          parts?: Array<{
            inlineData?: { data: string; mimeType: string };
          }>;
        };
      }>;
    };

    const parts = data.candidates?.[0]?.content?.parts || [];

    for (const part of parts) {
      if (part.inlineData) {
        const imageBuffer = Buffer.from(part.inlineData.data, 'base64');
        const ogPath = path.join(process.cwd(), 'public', 'og-image.png');
        fs.writeFileSync(ogPath, imageBuffer);
        console.log('  ✓ Saved: og-image.png');
        return true;
      }
    }

    console.error('  ✗ No OG image generated');
    return false;
  } catch (error) {
    console.error('  ✗ Error generating OG image:', error);
    return false;
  }
}

async function main() {
  console.log('\n========================================');
  console.log('EXERCISE ILLUSTRATION GENERATOR');
  console.log('Style: Vintage Instructional (Art of Manliness)');
  console.log(`Model: ${IMAGE_MODEL}`);
  console.log(`Output: ${OUTPUT_DIR}`);
  console.log('========================================\n');

  // Parse command line args to regenerate specific exercises or OG image
  const args = process.argv.slice(2);

  // Handle --og flag for OG image only
  if (args.includes('--og')) {
    await generateOgImage();
    return;
  }

  const exercisesToGenerate = args.length > 0
    ? EXERCISES.filter(e => args.includes(e.id))
    : EXERCISES;

  if (args.length > 0) {
    console.log(`Regenerating specific exercises: ${args.join(', ')}\n`);
  }

  let success = 0;
  let failed = 0;

  for (const exercise of exercisesToGenerate) {
    const result = await generateImage(exercise);
    if (result) {
      success++;
    } else {
      failed++;
    }

    // Rate limiting - wait between requests
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  // Also generate OG image if generating all exercises
  if (args.length === 0) {
    console.log('\n--- Generating OG Image ---');
    await generateOgImage();
  }

  console.log('\n========================================');
  console.log('RESULTS');
  console.log('========================================');
  console.log(`Exercises - Success: ${success}/${exercisesToGenerate.length}`);
  console.log(`Exercises - Failed: ${failed}/${exercisesToGenerate.length}`);
  console.log(`Output: ${OUTPUT_DIR}`);
  console.log('========================================\n');
}

main();
