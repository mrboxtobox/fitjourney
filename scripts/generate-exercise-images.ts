/**
 * Generate exercise illustrations in vintage instructional style
 * Inspired by Art of Manliness / Ted Slampyak illustrations
 *
 * Usage: export $(grep -v '^#' ~/code/imagineplay/.env | xargs) && npx tsx scripts/generate-exercise-images.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY;

if (!GOOGLE_AI_API_KEY) {
  console.error('Missing GOOGLE_AI_API_KEY. Run: export $(grep -v "^#" ~/code/imagineplay/.env | xargs)');
  process.exit(1);
}

// Nano Banana Pro — Gemini 3 Pro Image. Strongest model for instruction-following
// and clean line art. See https://ai.google.dev/gemini-api/docs/image-generation
const IMAGE_MODEL = 'gemini-3-pro-image-preview';

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

=== GHOSTED OVERLAY TECHNIQUE (CRITICAL) ===
Show BOTH the start and end positions of the movement using a ghosted/phantom figure overlay:

PRIMARY POSITION (solid figure):
- The main/key position drawn with full ink weight and normal line thickness
- Full crosshatching and shading
- 100% opacity/presence

SECONDARY/GHOSTED POSITION (phantom figure):
- A lighter, faded version of the figure in the alternate position
- Drawn with LIGHTER ink strokes (~30% line weight)
- Minimal or no crosshatching - just outline
- Appears transparent/ghosted compared to the primary figure
- Like a "shadow" or "echo" of the movement

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
- No text, labels, or watermarks
- Square format
- Figures fill ~70% of frame`;

// =============================================================================
// Exercise definitions with HYPER-DETAILED form descriptions
// =============================================================================
interface ExerciseIllustration {
  id: string;
  name: string;
  formDescription: string;
  modelGender: 'male' | 'female';
}

const EXERCISES: ExerciseIllustration[] = [
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
- His head and shoulder blades are raised just 1-2 inches off the ground
- Looking straight up at the ceiling
- Small movement, not a full sit-up

=== GHOSTED POSITION (FADED - Start position) ===
Show a lighter/faded version of the same figure with:
- Head and shoulders FLAT on the ground (not lifted)
- Same leg positions (one bent, one straight)
- Same hand position under lower back
- This shows the starting position before the curl-up

MOVEMENT ARROWS:
- Red curved arrow from the ghosted head position to the solid lifted position
- Arrow shows the small upward lift of the shoulders

The KEY visual is the asymmetry: one bent knee with foot on floor, one straight leg flat.

Vintage pen-and-ink style, crosshatching, navy shorts, cream background.`,
  },
  {
    id: 'mcgill-side-plank',
    name: 'McGill Side Plank',
    modelGender: 'female',
    formDescription: `CAMERA ANGLE: Front view, looking at the person from the front as they face the camera while in side plank.

=== PRIMARY POSITION (SOLID - Held plank position) ===
BODY POSITION - BE EXTREMELY PRECISE:
- Person is lying on their RIGHT side, propped up on their right forearm
- Body faces the CAMERA (viewer sees the front of their body)
- The body forms a STRAIGHT LINE from head to feet - like a wooden plank

RIGHT ARM (bottom arm):
- Right forearm is flat on the ground
- Right elbow is DIRECTLY under the right shoulder (90-degree angle at elbow)
- Right hand is flat on ground, fingers pointing forward

LEFT ARM (top arm):
- Left hand is placed on the left hip
- Left elbow points toward ceiling

LEGS:
- BOTH legs are straight and stacked on top of each other
- Right leg is on the bottom, left leg is on top
- Feet are stacked (left foot on top of right foot)

HIPS:
- Hips are LIFTED off the ground
- Hips are stacked vertically (not rotated forward or backward)
- There is a straight line from shoulders through hips to feet

HEAD:
- Head is in neutral alignment with spine
- Looking forward (at camera)

=== GHOSTED POSITION (FADED - Setup on ground) ===
Show a lighter/faded version of the same figure with:
- Same forearm position on ground
- But HIPS resting on the ground (not lifted)
- Body in the starting position before lifting into the plank
- Shows the setup position before engaging

MOVEMENT ARROWS:
- Red arrow pointing UPWARD at the hip area, from ghosted to solid position
- Shows the lift direction from ground to held plank

CRITICAL: Body is a straight diagonal line from head to feet in the solid figure. Propped on forearm. Hips lifted. Ghosted figure shows hips on ground.`,
  },
  {
    id: 'mcgill-bird-dog',
    name: 'Bird Dog',
    modelGender: 'male',
    formDescription: `CAMERA ANGLE: Side view (profile), looking at the person from their left side.

=== PRIMARY POSITION (SOLID - Extended position) ===
BODY POSITION - BE EXTREMELY PRECISE:
- Person is on HANDS and KNEES (quadruped/tabletop position)
- Back is FLAT and horizontal like a tabletop - no arching or rounding

BASE OF SUPPORT (what touches the ground):
- LEFT hand is flat on ground, directly under left shoulder
- RIGHT knee is on ground, directly under right hip
- ONLY the left hand and right knee touch the ground

RIGHT ARM (extended):
- Right arm extends STRAIGHT FORWARD, parallel to the ground
- Arm is at shoulder height
- Palm faces inward (thumb up)
- Arm is fully extended with slight bend at elbow

LEFT LEG (extended):
- Left leg extends STRAIGHT BACKWARD, parallel to the ground
- Leg is at hip height
- Toes point toward the ground
- Leg is fully extended

TORSO:
- Back is FLAT - horizontal like a tabletop
- No rotation in hips or shoulders - hips stay square to ground
- Core is braced/engaged

HEAD:
- Head in neutral position, looking at the ground
- Neck continues the line of the spine

=== GHOSTED POSITION (FADED - Start on all fours) ===
Show a lighter/faded version of the same figure with:
- ALL FOUR limbs on the ground (hands and knees position)
- Both hands flat on ground under shoulders
- Both knees on ground under hips
- Back flat in tabletop position
- This is the starting position before extending arm and leg

MOVEMENT ARROWS:
- Red arrow pointing FORWARD from the extended right arm
- Red arrow pointing BACKWARD from the extended left leg
- Arrows connect from the ghosted limb positions to the extended positions

CRITICAL: ONLY ONE arm raised (right), ONLY ONE leg raised (left) - OPPOSITE arm and leg in the solid figure. Ghosted figure shows all fours start position.`,
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

CRITICAL: This is a HIP HINGE, not a squat. Solid figure shows bottom position (hinged). Ghosted figure shows standing top position.`,
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

CRITICAL: Kettlebell is at CHEST height (NOT overhead) in solid figure. Ghosted figure shows bottom position between legs. Dashed arc connects the two positions.`,
  },

  // =========================================================================
  // MINI LOOP BAND EXERCISES (Glute Activation & Hip Stability)
  // All exercises use a mini loop band placed ABOVE THE KNEES
  // =========================================================================
  {
    id: 'band-lateral-walk',
    name: 'Lateral Band Walk',
    modelGender: 'female',
    formDescription: `CAMERA ANGLE: Front view, looking at person straight on as they side-step.

=== PRIMARY POSITION (SOLID - Mid-step to the right) ===
BODY POSITION - QUARTER SQUAT, STEPPING SIDEWAYS:
- Person is in an athletic quarter squat, stepping sideways to their right

MINI LOOP BAND PLACEMENT - CRITICAL:
- Small elastic LOOP BAND is placed ABOVE THE KNEES (on lower thighs)
- The band is a continuous loop (no ends/handles)
- Band is RED or visible color, clearly stretched between thighs
- Band creates constant tension pulling knees together

STANCE:
- In a QUARTER SQUAT position (knees bent ~30-45 degrees)
- Feet are wider than hip-width (stretching the band)
- Weight is low, athletic stance
- Chest up, slight forward lean

STEPPING LEG (right leg):
- Right foot is lifted slightly, stepping SIDEWAYS to the right
- Foot hovers just above the ground
- Leading the lateral movement

STANDING LEG (left leg):
- Left foot is flat and planted
- Supporting weight during the step
- Knee stays bent, pushing OUT against the band

KNEES - CRITICAL:
- BOTH knees push OUTWARD against the band resistance
- Knees track over toes (never caving inward)
- Constant outward pressure maintains band tension

ARMS:
- Hands on hips OR arms extended forward for balance

HEAD:
- Looking forward in direction of travel

=== GHOSTED POSITION (FADED - Feet together momentarily) ===
Show a lighter/faded version with:
- Feet closer together (trailing foot catching up)
- Still in quarter squat
- Shows the "step-together-step" pattern

MOVEMENT INDICATORS:
- Red arrow pointing RIGHT showing step direction
- Red arrows at BOTH knees pointing OUTWARD (against band)
- Dashed line showing the band stretched between thighs
- Small arrows showing constant outward knee pressure

CRITICAL: Mini loop band ABOVE KNEES. Quarter squat maintained throughout. Steps are SIDEWAYS (lateral). Knees push OUT against band the entire time.`,
  },
  {
    id: 'band-monster-walk',
    name: 'Monster Walk',
    modelGender: 'male',
    formDescription: `CAMERA ANGLE: 3/4 front view, showing diagonal stepping pattern.

=== PRIMARY POSITION (SOLID - Mid-step, diagonal forward) ===
BODY POSITION - QUARTER SQUAT, STEPPING DIAGONALLY:
- Person is in an athletic "monster walk" position
- Taking a diagonal step forward and outward

MINI LOOP BAND PLACEMENT - CRITICAL:
- Small elastic LOOP BAND is placed ABOVE THE KNEES (on lower thighs)
- The band is a continuous loop (no ends/handles)
- Band is RED or visible color, clearly stretched between thighs
- Band creates resistance against the wide stance

STANCE:
- Feet are WIDER than hip-width (band is stretched)
- In a QUARTER SQUAT position (knees bent ~30-45 degrees)
- Weight low, athletic stance
- Chest up, core engaged

STEPPING LEG (right leg):
- Right foot lifted, stepping FORWARD and OUTWARD at 45-degree angle
- Diagonal step pattern (like walking in a wide "V")
- Foot hovers mid-step

STANDING LEG (left leg):
- Left foot flat on ground
- Knee bent in quarter squat
- Supporting all weight

KNEES - CRITICAL:
- Both knees push OUTWARD against the band
- Knees track over toes
- Knees NEVER cave inward

TORSO:
- Upright, chest proud
- Core engaged
- Slight athletic forward lean okay

ARMS:
- Hands on hips OR arms in front for balance

=== GHOSTED POSITION (FADED - Opposite leg forward) ===
Show a lighter/faded version with:
- Left leg now stepping forward-diagonal
- Alternating step pattern visible
- Wide stance maintained

MOVEMENT INDICATORS:
- Red arrows showing DIAGONAL stepping direction (forward + outward)
- Red arrows at knees showing OUTWARD pressure
- Dashed "V" pattern on ground showing the walking path
- Dashed line showing band tension between thighs

CRITICAL: Mini loop band ABOVE KNEES. Quarter squat position. Steps are DIAGONAL (forward and out at 45°). Knees push outward constantly.`,
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

=== THE BAND ===
- Red mini loop band wrapped around BOTH thighs, just above the knees
- Knees push outward against the band

=== GHOSTED POSITION ===
Faded version showing hips DOWN on the ground (starting position)

=== ARROWS ===
- Red arrow at hips pointing UP
- Red arrows at knees pointing OUTWARD

CRITICAL: This is a HIP THRUST. Feet are PLANTED on the ground. Hips lift UP. It's the same as a regular glute bridge but with a band above the knees.`,
  },
  {
    id: 'band-clamshell',
    name: 'Clamshell',
    modelGender: 'female',
    formDescription: `A woman doing the clamshell exercise, viewed from BEHIND her back.

CAMERA POSITION: Behind the person, looking at their back.

THE PERSON:
- Woman lying on her side on the floor
- We see her BACK (spine, shoulder blades, back of head)
- She faces AWAY from the camera
- Her body is horizontal, head on the left, feet on the right

WHAT WE SEE FROM BEHIND:
- The back of her head (hair visible)
- Her back and spine
- Her bent legs (knees bent, stacked)
- Red mini loop band around her thighs

THE CLAMSHELL FROM BEHIND:
- Her top knee rotates UP and BACK toward the ceiling
- We see the knee opening from behind
- Her feet stay together

Two positions:
- Solid: knee open (rotated up)
- Ghosted: knee closed

Red arrow showing knee rotating up/back.

Vintage illustration, cream background, navy clothing, black ink.`,
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
    formDescription: `CAMERA ANGLE: Side view (profile). Bench/couch on the LEFT, feet on the RIGHT.

=== PRIMARY POSITION (SOLID - top of thrust) ===
A woman performing a dumbbell hip thrust with upper back supported on a low bench/couch edge:
- UPPER BACK / shoulder blades resting against the edge of a low bench or couch
- HIPS lifted HIGH, torso roughly horizontal, forming a tabletop from shoulders to knees
- KNEES bent 90 degrees, SHINS VERTICAL
- FEET flat on the floor, hip-width
- One DUMBBELL held across the front of the hips/lap with both hands
- Chin slightly tucked, ribs down

=== GHOSTED POSITION (faded - start) ===
Lighter version with the hips lowered toward the floor, dumbbell still across the hips, back still on the bench.

MOVEMENT INDICATORS:
- Bold red arrow at the hips pointing UP
- Dashed arc showing the hip path
- Dashed horizontal line at the top showing the level tabletop

CRITICAL: Upper back braced on the bench, shins vertical, dumbbell across the hips, hips drive up to a flat tabletop. Feet stay planted.`,
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
    formDescription: `CAMERA ANGLE: Side view (profile).

=== PRIMARY POSITION (SOLID - hinged position) ===
A woman performing a dumbbell Romanian deadlift, hinged forward:
- Standing, feet hip-width
- HINGED at the hips: butt pushed far BACK, torso leaning forward to about 45 degrees
- Back FLAT (neutral spine), not rounded
- KNEES only slightly bent (soft) — SHINS NEARLY VERTICAL
- A DUMBBELL in each hand, arms straight, dumbbells hanging just below the knees, close to the shins
- Head neutral, eyes down and slightly forward

=== GHOSTED POSITION (faded - standing tall) ===
Lighter version standing fully upright, dumbbells at the front of the thighs, glutes squeezed.

MOVEMENT INDICATORS:
- Bold red arrow at the hips showing the hinge (hips travel back and up)
- Dashed line along the flat back showing neutral spine
- Dashed horizontal line showing hips traveling backward

CRITICAL: This is a HIP HINGE, not a squat. Knees barely bend, hips push back, back stays flat. A dumbbell in EACH hand (two dumbbells).`,
  },
  {
    id: 'box-squat',
    name: 'Box Squat',
    modelGender: 'male',
    formDescription: `CAMERA ANGLE: Side view (profile). A sturdy box/chair on the RIGHT.

=== PRIMARY POSITION (SOLID - seated/touch on box) ===
A man squatting back to lightly touch a box/chair:
- A sturdy BOX or CHAIR behind him
- Hips sitting BACK and DOWN until the butt lightly touches the top of the box
- Thighs roughly PARALLEL to the floor (NOT a deep squat — depth is capped by the box)
- KNEES bent, tracking over the toes, shins fairly upright
- Feet flat, shoulder-width
- Chest up, back flat, arms extended forward for balance

=== GHOSTED POSITION (faded - standing) ===
Lighter version standing tall in front of the box, arms down.

MOVEMENT INDICATORS:
- Bold red arrow showing hips travelling DOWN and BACK toward the box
- Dashed horizontal line at the box top showing where depth stops
- Dashed line showing the back angle

CRITICAL: The box CAPS the depth at about parallel — this is a knee-friendly squat. Hips sit back to the box, chest stays up. Show the box/chair clearly.`,
  },

  // =========================================================================
  // CORE & ABS (new)
  // =========================================================================
  {
    id: 'dead-bug',
    name: 'Dead Bug',
    modelGender: 'female',
    formDescription: `CAMERA ANGLE: Side view (profile), looking at the person lying on their back.

=== PRIMARY POSITION (SOLID) ===
A woman doing the dead bug core exercise:
- Lying flat on her BACK on the floor, low back pressed down
- BOTH arms reaching straight UP toward the ceiling at the start
- ONE arm reaches back overhead toward the floor (extended) while the OPPOSITE leg extends straight out low, hovering just above the floor
- The other arm stays pointing up and the other knee stays bent over the hip (90/90)
- Low back stays flat on the floor throughout

=== GHOSTED POSITION (faded) ===
Lighter version showing both arms up and both knees bent over the hips (the start/center position).

MOVEMENT INDICATORS:
- Red arrows showing the opposite arm reaching back and opposite leg extending out
- Dashed line under the low back showing it stays pressed to the floor

CRITICAL: Exactly two arms and two legs. Opposite arm and leg extend together. Low back glued to the floor. Bodyweight, on the back.`,
  },
  {
    id: 'front-plank',
    name: 'Front Plank',
    modelGender: 'male',
    formDescription: `CAMERA ANGLE: Side view (profile).

=== PRIMARY POSITION (SOLID) ===
A man holding a forearm front plank:
- FOREARMS flat on the floor, elbows directly under the shoulders
- Body in ONE STRAIGHT LINE from the heels through the hips to the head
- Hips neither sagging down nor piked up
- Toes on the floor, legs straight
- Neck neutral, looking at the floor
- Glutes and abs braced

MOVEMENT INDICATORS:
- Dashed straight line running from heels to head showing the rigid plank line
- Small red arrows at the belly (pulling up/braced) and at the glutes (squeeze)

CRITICAL: Perfectly straight body line, forearms down, elbows under shoulders. A held static position. No ghosted second position needed — show one clean strong plank.`,
  },
  {
    id: 'hollow-hold',
    name: 'Hollow Hold',
    modelGender: 'female',
    formDescription: `CAMERA ANGLE: Side view (profile).

=== PRIMARY POSITION (SOLID) ===
A woman in a gymnastic hollow hold:
- Lying on her BACK
- Low back PRESSED firmly into the floor
- Shoulders and head lifted slightly off the floor
- ARMS extended straight overhead, just off the floor
- LEGS straight and together, lifted to a low hover off the floor
- Body forms a shallow banana/dish shape

=== GHOSTED POSITION (faded - easier regression) ===
Lighter version with the KNEES BENT (tucked) instead of legs straight — the easier version.

MOVEMENT INDICATORS:
- Dashed line under the low back showing it stays pressed down
- Small red arrows showing shoulders and legs lifted off the floor

CRITICAL: Low back stays flat on the floor (this is the whole point). Shallow dish shape. Arms overhead, legs hovering low.`,
  },
  {
    id: 'pallof-press',
    name: 'Pallof Press',
    modelGender: 'male',
    formDescription: `CAMERA ANGLE: Front view (facing the viewer), band anchored to the side.

=== PRIMARY POSITION (SOLID - pressed out) ===
A man performing a banded Pallof press (anti-rotation):
- Standing tall, feet shoulder-width, knees soft
- A RED resistance band runs horizontally from an anchor point at one SIDE (at chest height) into both hands
- BOTH hands grip the band together at the center of the chest, then PRESS the band STRAIGHT OUT in front of the chest, arms fully extended
- The band pulls him toward the anchor, but his torso stays SQUARE and does NOT rotate
- Core braced, ribs down

=== GHOSTED POSITION (faded - hands at chest) ===
Lighter version with the hands drawn back IN to the chest (start position).

MOVEMENT INDICATORS:
- Bold red arrow showing the hands pressing straight OUT from the chest
- Curved dashed arrow showing the band's sideways pull that the body resists
- Dashed vertical line through the torso showing it stays square (no twist)

CRITICAL: Band comes from the SIDE. Hands press straight forward from the chest. The whole point is the torso resists twisting. Show the side anchor and the band tension.`,
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
    formDescription: `CAMERA ANGLE: Side view (profile).

=== PRIMARY POSITION (SOLID - arm extended back) ===
A woman doing a dumbbell triceps kickback:
- Hinged forward at the hips to about 45 degrees, flat back, soft knees
- UPPER ARM pinned HIGH and parallel to the torso (elbow up near the ribs)
- A DUMBBELL in the hand
- FOREARM extended STRAIGHT BACK so the whole arm is straight and parallel to the floor, dumbbell behind the body
- Other hand can rest on the thigh for support

=== GHOSTED POSITION (faded - elbow bent) ===
Lighter version with the forearm hanging down, elbow bent 90 degrees (start position).

MOVEMENT INDICATORS:
- Bold red curved arrow showing the forearm extending straight back
- Dashed line showing the upper arm staying fixed and parallel to the torso

CRITICAL: Upper arm stays pinned and still; only the forearm swings back to lock out. Hinged-forward torso with flat back.`,
  },
  {
    id: 'db-lateral-raise',
    name: 'Lateral Raise',
    modelGender: 'male',
    formDescription: `CAMERA ANGLE: Front view (facing viewer).

=== PRIMARY POSITION (SOLID - arms raised to sides) ===
A man doing dumbbell lateral raises:
- Standing tall, feet hip-width
- A DUMBBELL in EACH hand
- Both arms raised OUT TO THE SIDES to shoulder height, forming a "T"
- Slight bend in the elbows, leading with the elbows
- Palms facing down, shoulders not shrugged up

=== GHOSTED POSITION (faded - arms down) ===
Lighter version with the arms hanging at the sides, dumbbells by the thighs (start position).

MOVEMENT INDICATORS:
- Bold red arrows on both sides arcing UP and OUT to shoulder height
- Dashed horizontal line at shoulder height showing the top of the raise

CRITICAL: A dumbbell in EACH hand (two dumbbells). Arms raise out to the sides to shoulder height only (not above). Two arms.`,
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

CRITICAL: Arms stay straight out at chest height; the hands pull apart sideways, stretching the band across the chest. Show the band clearly held in both hands.`,
  },

  // =========================================================================
  // MOBILITY EXERCISES
  // =========================================================================
  {
    id: '90-90',
    name: '90/90 Hip Stretch',
    modelGender: 'female',
    formDescription: `CAMERA ANGLE: Front view, looking at the person from directly in front as they sit on the floor.

=== PRIMARY POSITION (SOLID - Upright stretch position) ===
BODY POSITION - SEATED ON FLOOR:
- Person is SITTING on the ground
- Buttocks/sitting bones are on the floor

FRONT LEG (closer to camera):
- Hip is EXTERNALLY ROTATED (thigh rotated outward)
- Knee is bent at 90 degrees
- Shin is roughly horizontal, parallel to the front edge of an imaginary mat
- INNER thigh and INNER knee rest on the ground
- Foot is to the person's left

BACK LEG:
- Hip is INTERNALLY ROTATED (thigh rotated inward)
- Knee is bent at 90 degrees
- Shin points backward/away from camera
- OUTER thigh and OUTER knee rest on the ground
- Foot is behind the person

THE 90-90 SHAPE:
- Looking from above, the legs form a "Z" or "S" shape
- Both knees are bent at 90 degrees (hence "90/90")
- Front shin and back shin are roughly perpendicular to each other

TORSO:
- Torso is UPRIGHT and TALL
- Sitting straight up, not leaning forward
- Spine is vertical

ARMS:
- Hands rest lightly on the ground beside hips for balance

HEAD:
- Head neutral, looking forward
- Tall posture maintained

=== GHOSTED POSITION (FADED - Transitioning/entry) ===
Show a lighter/faded version of the same figure with:
- Same leg position (90-90)
- Torso LEANING FORWARD slightly, hinging at the hips
- Hands reaching forward toward the front foot
- Shows the deepening stretch variation

MOVEMENT INDICATORS:
- Curved arrow at front hip showing EXTERNAL rotation direction
- Curved arrow at back hip showing INTERNAL rotation direction
- Dashed arc showing the torso hinge forward and back
- Dashed lines at 90-degree angles showing the knee bend angles

CRITICAL: Both knees at 90 degrees. Front leg externally rotated (inner thigh down). Back leg internally rotated (outer thigh down). Solid shows upright, ghosted shows forward lean.`,
  },
  {
    id: 'deep-squat-hold',
    name: 'Deep Squat Hold',
    modelGender: 'male',
    formDescription: `CAMERA ANGLE: 3/4 front view, seeing both front and slight side of the person.

=== PRIMARY POSITION (SOLID - Bottom hold position) ===
BODY POSITION - FULL DEEP SQUAT (resting position):
- Person is in the DEEPEST possible squat position
- This is also called an "Asian squat" or "third world squat"
- This is a RESTING position, held statically

FEET - CRITICAL:
- Feet are shoulder-width apart or slightly wider
- HEELS are FLAT ON THE GROUND (not raised!)
- Entire foot including heel maintains contact with floor
- Toes point outward at about 30 degrees

KNEES:
- Knees are FULLY bent (maximum flexion)
- Knees push OUTWARD, tracking over toes
- Knees are wide apart

HIPS:
- Hips are dropped AS LOW AS POSSIBLE
- Buttocks are very close to the ground (almost touching heels)
- Hips are BELOW knee level by a significant amount

TORSO:
- Torso is as UPRIGHT as flexibility allows
- Chest is lifted
- Some forward lean is natural, but try to stay upright
- Back maintains natural curve

ARMS:
- Hands in prayer position at chest with elbows pushing knees out

HEAD:
- Head neutral, looking forward
- Relaxed expression (this is a resting position)

=== GHOSTED POSITION (FADED - Standing) ===
Show a lighter/faded version of the same figure with:
- Standing UPRIGHT at full height
- Feet in same shoulder-width stance
- Hands at sides or in front
- This shows the starting position before descending

MOVEMENT INDICATORS:
- Red arrow showing the descent from standing to deep squat
- Dashed vertical line showing the downward path
- Arrows at HEELS emphasizing they stay FLAT on ground
- Arrows at knees showing them pushing OUTWARD

CRITICAL: This is the DEEPEST squat possible. Heels MUST be flat on the ground. Hips are very low, close to the ground. Not a half squat. Ghosted figure shows standing start.`,
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

CRITICAL: Back shin goes UP the wall with top of foot against wall. Knee on ground at base of wall. Solid figure is upright, ghosted figure shows setup position.`,
  },
  {
    id: 'pigeon-stretch',
    name: 'Pigeon Stretch',
    modelGender: 'male',
    formDescription: `CAMERA ANGLE: 3/4 front view, looking down slightly at the person on the floor.

=== PRIMARY POSITION (SOLID - Full stretch position) ===
BODY POSITION - PIGEON POSE (upright version):
- Person is on the floor in pigeon pose/stretch

FRONT LEG (bent leg):
- Front leg is BENT with knee pointing forward/outward
- Shin is angled across the body (not straight forward)
- OUTER hip and OUTER thigh of front leg rest on the ground
- Front foot is near opposite hip
- Knee is bent at approximately 90 degrees

BACK LEG (straight leg) - CRITICAL:
- Back leg extends STRAIGHT BEHIND the body
- The ENTIRE back leg is on the ground:
  - Top of thigh on ground
  - Knee on ground
  - Top of foot on ground (not toes tucked)
- Back leg is fully extended (straight knee)
- Back leg is in line with the hip (not angled outward)

HIPS:
- Hips try to stay SQUARE (facing forward)
- Front hip will naturally be more open
- Both hip bones point forward as much as possible

TORSO:
- Torso is UPRIGHT (not folded forward in this version)
- Spine is tall and vertical
- Chest is lifted

ARMS:
- Hands on ground beside hips for support
- Arms help maintain upright position

HEAD:
- Head neutral, looking forward
- Tall posture

=== GHOSTED POSITION (FADED - Entry/setup position) ===
Show a lighter/faded version of the same figure with:
- Same leg positions on ground
- Torso FOLDED FORWARD over the front leg
- Arms extended forward, reaching along the ground
- Forehead approaching or touching the ground
- Shows the deepened stretch variation

MOVEMENT INDICATORS:
- Dashed arc showing the torso path from folded forward to upright
- Arrow at front hip showing EXTERNAL rotation
- Arrow at back hip showing hip flexor STRETCH
- Dashed line showing the back leg stays STRAIGHT

CRITICAL: Front leg bent on ground with outer hip down. Back leg is STRAIGHT and FLAT on the ground behind. Solid figure upright, ghosted figure shows forward fold variation.`,
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
Show a lighter/faded version of the same figure with:
- Same hands and knees position on ground
- Back ARCHED DOWNWARD (sway back) - spine dips toward floor
- Head LIFTED UP, looking forward or slightly up
- Belly relaxed and dropping toward floor
- Tailbone tilted UP (opposite of cat)
- This is spinal EXTENSION (arching down)

MOVEMENT INDICATORS:
- Large curved arrow showing spine movement between positions
- Dashed curved line showing the range of spinal motion (from rounded up to arched down)
- Arrow at pelvis showing the tilt direction
- Arrow at head showing the lift/drop motion

CRITICAL: Solid figure shows CAT (rounded up). Ghosted figure shows COW (arched down). This shows the full range of the alternating movement.`,
  },
  {
    id: 'leg-swings',
    name: 'Leg Swings',
    modelGender: 'male',
    formDescription: `CAMERA ANGLE: Side view (profile), looking at person from their right side. A wall or support is on the left.

=== PRIMARY POSITION (SOLID - Forward swing) ===
BODY POSITION - DYNAMIC LEG SWING:
- Person is standing on ONE leg, swinging the other leg forward

SUPPORT:
- LEFT hand touches a wall or support (on the left side of image)
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
- Same standing leg and support hand position
- Swinging leg extended BACKWARD (behind the body)
- Leg straight and lifted backward at hip height
- Shows the back swing of the pendulum motion

MOVEMENT INDICATORS:
- Large curved DASHED ARC showing the full pendulum swing path (from back to front)
- The dashed arc connects the two leg positions
- Double-headed red arrow along the arc showing back-and-forth motion
- Small arrow at hip showing it as the PIVOT POINT
- Dashed vertical line at the standing leg showing it stays stable

CRITICAL: Standing on one leg, other leg swings freely from the hip like a pendulum. Solid shows forward swing, ghosted shows back swing. Dashed arc shows full range of motion.`,
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

=== GHOSTED POSITION (FADED - Hips down/start position) ===
Show a lighter/faded version of the same figure with:
- Same lying position with bent knees
- Same feet flat on floor
- But HIPS resting ON THE GROUND (not lifted)
- Lower back touching the floor
- This is the starting position before lifting

MOVEMENT INDICATORS:
- Red arrow pointing UP at the hips showing the lift direction
- Dashed arc showing the path of hip movement from floor to top
- Dashed line from shoulders to knees showing the straight line at top position

CRITICAL: Solid figure shows top of bridge (hips up). Ghosted figure shows start position (hips down). Feet stay flat on ground throughout. Dashed arc shows hip lift path.`,
  },
];

async function generateImage(exercise: ExerciseIllustration): Promise<boolean> {
  console.log(`Generating: ${exercise.name}...`);

  const prompt = `${STYLE_GUIDE}

=== EXERCISE: ${exercise.name} ===

${exercise.formDescription}

MODEL: Athletic ${exercise.modelGender}.

FINAL REMINDERS:
- Cream background, black ink lines, navy clothing, RED arrows
- NO text or labels
- Anatomically correct - exactly 2 arms, 2 legs
- Follow the position description EXACTLY`;

  try {
    const response = await fetch(
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
  console.log(`Model: ${IMAGE_MODEL} (Nano Banana Pro)`);
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
