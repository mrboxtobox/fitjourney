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

COMPOSITION:
- Single figure on plain cream background
- No text, labels, or watermarks
- Square format
- Figure fills ~70% of frame`;

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

LEG POSITIONS - ASYMMETRICAL:
- His LEFT leg: knee bent, foot flat on floor (like sitting in a chair while lying down)
- His RIGHT leg: completely straight, lying flat on the floor from hip to heel

HAND POSITION:
- Both hands are tucked underneath his lower back, palms down
- His lower back has a slight arch with hands filling that space
- His elbows point outward and rest on the floor

HEAD POSITION:
- His head and shoulder blades are raised just 1-2 inches off the ground
- Looking straight up at the ceiling
- Small movement, not a full sit-up

The KEY visual is the asymmetry: one bent knee with foot on floor, one straight leg flat.

Vintage pen-and-ink style, crosshatching, navy shorts, cream background. Red arrow pointing up at shoulders.`,
  },
  {
    id: 'mcgill-side-plank',
    name: 'McGill Side Plank',
    modelGender: 'female',
    formDescription: `CAMERA ANGLE: Front view, looking at the person from the front as they face the camera while in side plank.

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

ARROWS:
- One red arrow pointing UPWARD at the hip area, showing the lift direction
- Small arrow at the core area indicating bracing/engagement

CRITICAL: Body is a straight diagonal line from head to feet. Propped on forearm. Hips lifted. Not lying flat.`,
  },
  {
    id: 'mcgill-bird-dog',
    name: 'Bird Dog',
    modelGender: 'male',
    formDescription: `CAMERA ANGLE: Side view (profile), looking at the person from their left side.

BODY POSITION - BE EXTREMELY PRECISE:
- Person is on HANDS and KNEES (quadruped/tabletop position)
- Back is FLAT and horizontal like a tabletop - no arching or rounding

BASE OF SUPPORT (what touches the ground):
- LEFT hand is flat on ground, directly under left shoulder
- LEFT knee is on ground, directly under left hip
- ONLY the left hand and left knee touch the ground

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

STATIONARY LIMBS:
- Left arm: straight down from shoulder to ground, supporting body
- Right leg: bent at 90 degrees, knee on ground under hip

TORSO:
- Back is FLAT - horizontal like a tabletop
- No rotation in hips or shoulders - hips stay square to ground
- Core is braced/engaged

HEAD:
- Head in neutral position, looking at the ground
- Neck continues the line of the spine

ARROWS:
- Red arrow pointing FORWARD from the extended right arm
- Red arrow pointing BACKWARD from the extended left leg

CRITICAL: ONLY ONE arm raised (right), ONLY ONE leg raised (left) - OPPOSITE arm and leg. The other arm and leg stay on the ground. This is the key to the exercise.`,
  },

  // =========================================================================
  // STRENGTH EXERCISES
  // =========================================================================
  {
    id: 'goblet-squat',
    name: 'Goblet Squat',
    modelGender: 'female',
    formDescription: `CAMERA ANGLE: 3/4 view from the front-left, so we can see both the front of the body and slight side profile.

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

ARROWS:
- Red arrow pointing DOWN into the squat (showing descent)
- Red arrow pointing UP (showing the drive to stand)
- Small curved arrows at knees showing them pushing outward

CRITICAL: This is a DEEP squat - hips well below knees. Heels stay flat on ground. Kettlebell at chest.`,
  },
  {
    id: 'farmers-carry',
    name: "Farmer's Carry",
    modelGender: 'male',
    formDescription: `CAMERA ANGLE: Side view (profile), person walking from left to right.

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

CORE:
- Core is braced to prevent side bending
- The challenge is resisting the pull to lean toward the weight

ARROWS:
- Red arrow pointing FORWARD showing walking direction
- Small arrows at the shoulders showing they stay LEVEL
- Arrow at the core showing bracing/engagement

CRITICAL: Shoulders stay LEVEL despite holding weight on only one side. Walking with tall posture.`,
  },
  {
    id: 'kb-deadlift',
    name: 'Kettlebell Deadlift',
    modelGender: 'female',
    formDescription: `CAMERA ANGLE: Side view (profile), looking at person from their right side.

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

ARROWS:
- Curved red arrow at hips showing the hinge motion (hips going back)
- Red arrow pointing UP along the kettlebell/arms showing lift direction
- Arrow along the back showing it staying FLAT

CRITICAL: This is a HIP HINGE, not a squat. Hips push back, torso tips forward, back stays flat, knees are only slightly bent. Kettlebell is on/near the ground.`,
  },
  {
    id: 'kb-swing',
    name: 'Kettlebell Swing',
    modelGender: 'male',
    formDescription: `CAMERA ANGLE: Side view (profile), looking at person from their right side.

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

ARROWS:
- Large curved red arrow showing the ARC of the swing (from between legs up to chest height)
- Arrow at hips showing the forward HIP SNAP/THRUST
- Motion lines behind kettlebell showing momentum

CRITICAL: Kettlebell is at CHEST height (NOT overhead). Arms are straight forward, parallel to ground. Body is standing STRAIGHT UP with hips thrust forward. This is NOT an overhead press.`,
  },

  // =========================================================================
  // MOBILITY EXERCISES
  // =========================================================================
  {
    id: '90-90',
    name: '90/90 Hip Stretch',
    modelGender: 'female',
    formDescription: `CAMERA ANGLE: Front view, looking at the person from directly in front as they sit on the floor.

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
- Or hands can rest on the front knee

HEAD:
- Head neutral, looking forward
- Tall posture maintained

ARROWS:
- Curved arrow at front hip showing EXTERNAL rotation direction
- Curved arrow at back hip showing INTERNAL rotation direction
- Arrow at spine showing UPRIGHT posture

CRITICAL: Both knees at 90 degrees. Front leg externally rotated (inner thigh down). Back leg internally rotated (outer thigh down). Sitting upright.`,
  },
  {
    id: 'deep-squat-hold',
    name: 'Deep Squat Hold',
    modelGender: 'male',
    formDescription: `CAMERA ANGLE: 3/4 front view, seeing both front and slight side of the person.

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
- Arms are extended forward for balance, OR
- Hands in prayer position at chest with elbows pushing knees out

HEAD:
- Head neutral, looking forward
- Relaxed expression (this is a resting position)

ARROWS:
- Arrows at HEELS emphasizing they stay FLAT on ground
- Arrows at knees showing them pushing OUTWARD
- Arrow showing hips sinking DOWN

CRITICAL: This is the DEEPEST squat possible. Heels MUST be flat on the ground. Hips are very low, close to the ground. Not a half squat.`,
  },
  {
    id: 'couch-stretch',
    name: 'Couch Stretch',
    modelGender: 'female',
    formDescription: `CAMERA ANGLE: Side view (profile), looking at person from their left side. A wall is on the right side of the image.

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
- Or arms can be raised overhead

HEAD:
- Head neutral, looking forward
- Tall posture

ARROWS:
- Arrow at back hip showing the hip OPENING/EXTENDING
- Arrow at back glute showing the SQUEEZE
- Arrow at torso showing it staying UPRIGHT

CRITICAL: Back shin goes UP the wall with top of foot against wall. Knee on ground at base of wall. Front shin is vertical. Torso stays upright.`,
  },
  {
    id: 'pigeon-stretch',
    name: 'Pigeon Stretch',
    modelGender: 'male',
    formDescription: `CAMERA ANGLE: 3/4 front view, looking down slightly at the person on the floor.

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

ARROWS:
- Arrow at front hip showing EXTERNAL rotation
- Arrow at back hip showing hip flexor STRETCH
- Arrow at torso showing UPRIGHT posture

CRITICAL: Front leg bent on ground with outer hip down. Back leg is STRAIGHT and FLAT on the ground behind (not bent). Torso upright.`,
  },

  // =========================================================================
  // WARMUP EXERCISES
  // =========================================================================
  {
    id: 'cat-cow',
    name: 'Cat-Cow',
    modelGender: 'female',
    formDescription: `CAMERA ANGLE: Side view (profile), looking at person from their left side.

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

ARROWS:
- Large curved arrow showing spine rounding UPWARD (convex curve up)
- Arrow at pelvis showing tailbone tucking UNDER
- Arrow at head showing it dropping DOWN

OPTIONAL GHOSTED POSITION:
- Lighter/ghosted figure showing "COW" position (back arched downward, head up) to show the contrast

CRITICAL: Back is rounded UP like an angry cat. Head down, tailbone tucked. This is spinal FLEXION (rounding up).`,
  },
  {
    id: 'leg-swings',
    name: 'Leg Swings',
    modelGender: 'male',
    formDescription: `CAMERA ANGLE: Side view (profile), looking at person from their right side. A wall or support is on the left.

BODY POSITION - DYNAMIC LEG SWING:
- Person is standing on ONE leg, swinging the other leg forward and back

SUPPORT:
- LEFT hand touches a wall or support (on the left side of image)
- This provides balance during the dynamic movement

STANDING LEG (left leg):
- Left foot is flat on ground
- Left leg is STRAIGHT (or very slight bend)
- This leg stays STATIONARY and stable
- All weight is on this leg

SWINGING LEG (right leg) - SHOW MULTIPLE POSITIONS:
- Right leg swings like a pendulum from the HIP
- Show the leg in FORWARD swing position (primary)
- Show ghosted/lighter positions showing:
  - Leg swinging BACKWARD
  - Neutral position (hanging straight down)
- The leg stays RELATIVELY STRAIGHT during the swing
- Movement comes from the HIP JOINT

TORSO:
- Torso stays UPRIGHT and STABLE
- Core is braced
- Upper body does NOT swing with the leg
- Minimal forward/backward lean

HEAD:
- Looking forward
- Head stays stable

ARROWS:
- Large curved DOUBLE-HEADED arrow showing the pendulum swing path (forward AND backward)
- The arrow should arc from behind the body, down, and forward
- Small arrow at hip showing it as the PIVOT POINT
- Arrow at torso showing it staying STABLE

CRITICAL: Standing on one leg, other leg swings freely from the hip like a pendulum. Upper body stays stable. Show the swinging motion with multiple leg positions or motion blur.`,
  },
  {
    id: 'hip-circles',
    name: 'Hip Circles',
    modelGender: 'female',
    formDescription: `CAMERA ANGLE: 3/4 front view, seeing front and slight side of person.

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
- Hips move in a CIRCULAR motion
- Show hips shifted to ONE SIDE (as part of the circle)
- The hips trace a horizontal circle/oval shape
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

ARROWS:
- CIRCULAR arrow around the hip area showing the rotation path
- The arrow should make a complete circle (or 3/4 circle visible)
- Arrow can show clockwise or counterclockwise rotation
- Small arrows showing hips shifting through different points of the circle

CRITICAL: Hands on hips. Hips move in a circle. Upper body and feet stay stable. This mobilizes the hip joints and lower back.`,
  },
  {
    id: 'glute-bridge-warmup',
    name: 'Glute Bridge',
    modelGender: 'male',
    formDescription: `Illustration of a hip thrust / bridge exercise from a side view.

The man's body makes a BRIDGE or RAMP shape:
- HEAD and SHOULDERS rest on the floor
- HIPS are thrust UP HIGH (the peak of the bridge)
- KNEES are bent at 90 degrees
- FEET are FLAT on the floor

CRITICAL: The man's feet must be on the ground. Both soles of his feet touch the floor. His knees point toward the ceiling. His hips are the highest point.

The silhouette looks like a triangle: floor to shoulders (low), up to hips (high), down to knees (medium), feet on floor.

DO NOT show legs in the air. DO NOT show a leg raise. The feet MUST be on the ground.

Vintage pen-and-ink illustration style. Navy shorts. Cream background. Red upward arrow at hips.`,
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
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GOOGLE_AI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseModalities: ['image', 'text'],
            responseMimeType: 'text/plain',
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

async function main() {
  console.log('\n========================================');
  console.log('EXERCISE ILLUSTRATION GENERATOR');
  console.log('Style: Vintage Instructional (Art of Manliness)');
  console.log('Model: Gemini 2.0 Flash (Nano Banana)');
  console.log(`Output: ${OUTPUT_DIR}`);
  console.log('========================================\n');

  // Parse command line args to regenerate specific exercises
  const args = process.argv.slice(2);
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

  console.log('\n========================================');
  console.log('RESULTS');
  console.log('========================================');
  console.log(`Success: ${success}/${exercisesToGenerate.length}`);
  console.log(`Failed: ${failed}/${exercisesToGenerate.length}`);
  console.log(`Output: ${OUTPUT_DIR}`);
  console.log('========================================\n');
}

main();
