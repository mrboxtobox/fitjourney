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

You are creating exercise illustrations in the style of classic fitness manuals and Art of Manliness illustrations by Ted Slampyak.

ARTISTIC STYLE (CRITICAL - FOLLOW EXACTLY):
- Traditional pen and ink illustration with precise crosshatching for shading
- Bold, confident black ink outlines with varying line weights (thicker outlines, finer detail lines)
- Crosshatch shading technique using parallel lines at different angles for depth and form
- Clean, anatomically accurate figure drawing with visible muscle definition
- Professional instructional manual quality - like 1950s-1960s fitness guides

COLOR PALETTE (STRICT - USE ONLY THESE):
- Background: Warm cream/off-white (#F5F0E6) - like aged paper
- Primary figure color: Deep navy blue (#1a3a5c) for clothing/shorts
- Ink lines: Rich black (#1a1a1a) for all linework and crosshatching
- Skin tone: Leave as cream background with ink crosshatching for shading
- Motion arrows: Bold red (#c41e3a) with curved directional arrows showing movement path
- Accent highlights: Light blue wash (#a8c8e8) for subtle depth on clothing

FIGURE RENDERING:
- Athletic male or female figure with realistic proportions
- Clear muscle definition shown through ink crosshatching, not color
- Profile or 3/4 view preferred for clarity of movement
- Confident, focused facial expression
- Simple athletic wear: tank top/t-shirt and shorts
- Bare feet or simple athletic shoes

SHOWING MOVEMENT (CRITICAL):
- Use RED curved arrows to show direction of movement
- For exercises with multiple phases, show 2-3 positions of the figure (ghosted/lighter for previous positions, solid for current)
- Arrows should be bold, curved, and clearly indicate the motion path
- Small motion lines near moving body parts to indicate dynamic movement

COMPOSITION:
- Single figure centered on cream background
- Adequate white space around figure
- Clean, uncluttered composition
- No text, labels, or watermarks in the image
- Square format, figure fills ~70% of frame

TECHNICAL QUALITY:
- High contrast between ink lines and background
- Consistent line weight throughout
- Professional crosshatching technique
- Clean edges, no fuzzy or blurred lines

AVOID:
- Photorealistic rendering
- Gradients or digital airbrush effects
- Bright or neon colors
- Complex backgrounds or environments
- Cartoonish or anime styles
- 3D CGI look
- Watercolor or painterly effects

This should look like it came from a vintage physical fitness manual or military training guide.`;

// =============================================================================
// Exercise definitions with detailed form descriptions
// =============================================================================
interface ExerciseIllustration {
  id: string;
  name: string;
  formDescription: string;
  movementArrows: string;
  showMultiplePositions: boolean;
  modelGender: 'male' | 'female';
}

const EXERCISES: ExerciseIllustration[] = [
  // McGill Big 3
  {
    id: 'mcgill-curl-up',
    name: 'McGill Curl-Up',
    formDescription: `Person lying on back (supine position). One knee bent with foot flat on floor, other leg extended straight along the ground. Both hands placed underneath the lower back to maintain the natural lumbar curve - this is critical for spine protection. Head and shoulders lifted only 1-2 inches off the ground - NOT a full sit-up. Chin slightly tucked, eyes looking at ceiling. Core muscles braced and engaged. Hold this elevated position.`,
    movementArrows: `Red arrow pointing upward from the shoulders showing the small lifting motion. Small curved arrow near the head showing the slight chin tuck.`,
    showMultiplePositions: true,
    modelGender: 'male',
  },
  {
    id: 'mcgill-side-plank',
    name: 'McGill Side Plank',
    formDescription: `Person in side-lying position, propped up on forearm. Elbow positioned directly under the shoulder for proper alignment. Body forms a perfectly straight line from head to feet - no sagging or piking at the hips. Top arm resting on the hip or side of body. Feet stacked on top of each other. Knees can be bent for modified version. Core engaged, hips lifted and square. Neutral spine maintained throughout.`,
    movementArrows: `Red arrow pointing upward at the hip area showing the hip lift direction. Small arrow at the core indicating engagement/bracing.`,
    showMultiplePositions: true,
    modelGender: 'female',
  },
  {
    id: 'mcgill-bird-dog',
    name: 'Bird Dog',
    formDescription: `Person on hands and knees in quadruped position (tabletop). Hands directly under shoulders, knees directly under hips. Spine neutral and flat like a table - no arching or rounding. Right arm extending straight forward, parallel to the ground, thumb pointing up. Left leg extending straight back, parallel to the ground, toes pointing down. Hips remain perfectly square to the ground - no rotation or tilting. Core braced throughout. Head in neutral alignment with spine, looking at the floor.`,
    movementArrows: `Red arrow extending from the shoulder forward along the reaching arm. Red arrow extending from the hip backward along the extending leg. Both arrows show the extension direction.`,
    showMultiplePositions: true,
    modelGender: 'male',
  },

  // Strength exercises
  {
    id: 'goblet-squat',
    name: 'Goblet Squat',
    formDescription: `Person in deep squat position holding a kettlebell at chest height. Kettlebell held vertically with both hands cupping the sides of the handle (like holding a goblet). Feet shoulder-width apart or slightly wider, toes pointed slightly outward (15-30 degrees). Knees tracking over the toes, pushing outward - elbows can touch inside of knees at bottom. Full depth squat with hips well below knee level. Chest up and proud, back straight, maintaining upright torso. Weight in mid-foot to heels.`,
    movementArrows: `Two red arrows: one pointing downward showing the descent into the squat, one pointing upward showing the drive up to standing. Curved arrows at the knees showing them tracking outward over toes.`,
    showMultiplePositions: true,
    modelGender: 'female',
  },
  {
    id: 'farmers-carry',
    name: "Farmer's Carry",
    formDescription: `Person walking with upright posture while carrying a kettlebell in one hand (single-arm farmer's carry). Shoulders perfectly level - not tilting toward the weight. Shoulder blades packed down and back. Core braced hard to resist lateral flexion. Free arm can be slightly out for balance or held naturally. Walking with controlled, deliberate steps. Head up, eyes forward. Chest proud, tall spine. The loaded side works harder to maintain neutral posture.`,
    movementArrows: `Red arrow showing forward walking direction. Small arrows at the core/obliques showing the anti-lateral flexion engagement. Arrow at shoulders showing them staying level.`,
    showMultiplePositions: false,
    modelGender: 'male',
  },
  {
    id: 'kb-deadlift',
    name: 'Kettlebell Deadlift',
    formDescription: `Person performing hip hinge movement with kettlebell. Starting position: standing tall with kettlebell on the ground between feet. Feet hip-width apart. Movement: hinging at the hips (NOT squatting) - pushing hips back while maintaining flat back. Knees have a soft bend but shins stay relatively vertical. Back is flat with neutral spine - chest up, shoulders back. Arms straight, gripping the kettlebell handle. Weight in heels and mid-foot. Show the bottom position of the hinge with the torso at roughly 45-degree angle.`,
    movementArrows: `Red curved arrow at the hips showing the hip hinge movement (hips pushing back and then driving forward). Arrow pointing up showing the lift direction. Arrow at the back showing it staying flat/neutral.`,
    showMultiplePositions: true,
    modelGender: 'female',
  },
  {
    id: 'kb-swing',
    name: 'Kettlebell Swing',
    formDescription: `Person at the top of a kettlebell swing. Standing tall with hips fully extended and squeezed forward. Glutes contracted hard at the top. Kettlebell at chest height with arms straight (the arms don't lift the bell - the hip snap does). Shoulders packed down, not shrugged. Core braced, body forming a straight vertical line. Knees straight but not locked. This is the power position - all force comes from the explosive hip extension, not the arms.`,
    movementArrows: `Large curved red arrow showing the arc of the kettlebell swing from between the legs up to chest height. Arrow at the hips showing the powerful forward hip snap/thrust. Small motion lines behind the kettlebell showing its momentum.`,
    showMultiplePositions: true,
    modelGender: 'male',
  },

  // Mobility exercises
  {
    id: '90-90',
    name: '90/90 Hip Stretch',
    formDescription: `Person seated on the floor in the 90/90 position. Front leg: hip externally rotated, knee bent at 90 degrees, shin parallel to the front edge of the mat, inner thigh and inner knee resting on floor. Back leg: hip internally rotated, knee bent at 90 degrees, shin perpendicular to front shin, outer thigh and outer knee on floor. Torso upright and tall, sitting bones grounded. Hands can rest lightly on the floor for balance. This stretches both hip internal and external rotation simultaneously.`,
    movementArrows: `Red curved arrows showing the rotation direction of each hip - external rotation on front leg, internal rotation on back leg. Arrow at the spine showing upright posture.`,
    showMultiplePositions: false,
    modelGender: 'female',
  },
  {
    id: 'deep-squat-hold',
    name: 'Deep Squat Hold',
    formDescription: `Person in a full deep squat (also called Asian squat or malasana). Feet flat on the ground - heels down, not raised. Feet roughly shoulder-width apart, toes turned out slightly. Hips dropped as low as possible, below knee level. Knees tracking over toes, pushed out wide. Torso upright as much as flexibility allows. Arms can be in prayer position at chest, or extended forward for balance. This is a resting position, relaxed but with good posture. Chest lifted, spine as neutral as possible.`,
    movementArrows: `Small arrows at the heels emphasizing they stay flat on ground. Arrows at the knees showing them pressing outward. Arrow showing the hip sinking down low.`,
    showMultiplePositions: false,
    modelGender: 'male',
  },
  {
    id: 'couch-stretch',
    name: 'Couch Stretch',
    formDescription: `Person in a deep lunge position with back foot elevated against a wall (or couch). Front foot flat on ground, front knee at roughly 90 degrees, front shin vertical. Back knee on the ground (use pad for comfort), back shin running up the wall vertically so the top of the back foot is against the wall. Torso upright and tall, not leaning forward. Back glute squeezed to increase the hip flexor stretch. Hands can rest on front knee for support. This intensely stretches the hip flexors and quadriceps of the back leg.`,
    movementArrows: `Red arrow at the back hip showing the hip flexor stretch direction (hip extending/opening). Arrow at the glute showing the squeeze/contraction. Arrow showing torso staying upright.`,
    showMultiplePositions: false,
    modelGender: 'female',
  },
  {
    id: 'pigeon-stretch',
    name: 'Pigeon Stretch',
    formDescription: `Person in pigeon pose. Front leg: bent with shin roughly parallel to the front of the mat (or angled based on flexibility), outer thigh and hip resting on the ground, knee bent at roughly 90 degrees. Back leg: extended straight behind, top of thigh, knee, and top of foot all resting on the ground. Hips square to the front as much as possible. Torso can be upright for less intensity or folded forward over the front leg for deeper stretch. This deeply stretches the hip external rotators (piriformis, glutes) of the front leg.`,
    movementArrows: `Arrow showing the external rotation of the front hip. Arrow showing the hip flexor stretch of the back leg. If folded forward, arrow showing the forward fold direction.`,
    showMultiplePositions: true,
    modelGender: 'male',
  },

  // Warmup exercises
  {
    id: 'cat-cow',
    name: 'Cat-Cow',
    formDescription: `Person on hands and knees showing the CAT position (spinal flexion). Hands under shoulders, knees under hips. Back rounded up toward the ceiling like an angry cat - full spinal flexion. Head dropped down, chin toward chest. Tailbone tucked under. Abdominals pulled in. The opposite COW position would have the back arched, belly dropping, head lifted - but show the CAT position primarily with a ghosted cow position to show the movement.`,
    movementArrows: `Red curved arrows showing the spinal movement - arrow curving upward for the cat (rounding), and a lighter/ghosted arrow curving downward for the cow (arching). Arrow at the pelvis showing the tuck and tilt.`,
    showMultiplePositions: true,
    modelGender: 'female',
  },
  {
    id: 'leg-swings',
    name: 'Leg Swings',
    formDescription: `Person standing on one leg, other leg swinging forward and back in a controlled pendulum motion. Standing leg straight and stable, planted firmly. Swinging leg relaxed, moving from the hip in a smooth arc. One hand touching a wall or support for balance. Torso stays upright and stable - the movement is isolated to the swinging leg. Show the leg in mid-swing forward position, with ghosted positions showing the backward swing. This is a dynamic stretch for the hip flexors and hamstrings.`,
    movementArrows: `Large red curved double-arrow showing the pendulum swing path - forward and backward. Arrow at the hip showing it as the pivot point. Arrow at the torso showing it staying stable.`,
    showMultiplePositions: true,
    modelGender: 'male',
  },
  {
    id: 'hip-circles',
    name: 'Hip Circles',
    formDescription: `Person standing with feet shoulder-width apart, hands on hips. Hips moving in a circular motion - like hula hooping without the hoop. Knees slightly bent and soft. Upper body relatively stable while the hips trace a circle. Show the hips shifted to one side as part of the circular motion. This mobilizes the entire hip complex and lower back.`,
    movementArrows: `Red circular arrow around the hip area showing the clockwise (or counterclockwise) rotation path. Small arrows showing the hip shifting through the circle. Arrow at the upper body showing it staying relatively stable.`,
    showMultiplePositions: false,
    modelGender: 'female',
  },
  {
    id: 'glute-bridge-warmup',
    name: 'Glute Bridge',
    formDescription: `Person lying on back with knees bent, feet flat on floor about hip-width apart, close to the buttocks. Arms flat on the ground at sides, palms down for stability. Hips lifted high off the ground, creating a straight line from shoulders to knees - the bridge position. Glutes squeezed hard at the top. Core engaged. Weight in the heels, not the toes. Head and upper back remain on the ground. This activates the glutes and teaches hip extension.`,
    movementArrows: `Red arrow pointing upward at the hips showing the lift/bridge direction. Arrow at the glutes showing the squeeze/contraction. Small arrows at the heels showing weight pressing through heels.`,
    showMultiplePositions: true,
    modelGender: 'male',
  },
];

async function generateImage(exercise: ExerciseIllustration): Promise<boolean> {
  console.log(`Generating: ${exercise.name}...`);

  const multiPositionInstruction = exercise.showMultiplePositions
    ? `MULTIPLE POSITIONS: Show 2-3 positions of the figure to illustrate the movement. The starting or secondary positions should be rendered lighter/ghosted (using lighter line weight or less crosshatching), while the primary position is rendered fully. This shows the movement progression.`
    : `SINGLE POSITION: Show one clear position of the exercise at the key moment of the movement.`;

  const prompt = `${STYLE_GUIDE}

=== EXERCISE TO ILLUSTRATE ===

EXERCISE NAME: ${exercise.name}

FORM AND POSITION (Follow this exactly):
${exercise.formDescription}

MOVEMENT ARROWS TO INCLUDE:
${exercise.movementArrows}

${multiPositionInstruction}

MODEL: Athletic ${exercise.modelGender} figure with realistic proportions.

Remember:
- Cream/off-white background
- Black ink crosshatching for shading
- Navy blue for clothing
- RED arrows showing movement direction
- Professional instructional manual quality
- NO text or labels in the image
- Square format`;

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

  let success = 0;
  let failed = 0;

  for (const exercise of EXERCISES) {
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
  console.log(`Success: ${success}/${EXERCISES.length}`);
  console.log(`Failed: ${failed}/${EXERCISES.length}`);
  console.log(`Output: ${OUTPUT_DIR}`);
  console.log('========================================\n');
}

main();
