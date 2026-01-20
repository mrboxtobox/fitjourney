/**
 * Generate exercise illustrations in mid-century modern style
 * Inspired by Art of Manliness illustrations
 *
 * Usage: source ~/.env && npx tsx scripts/generate-exercise-images.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY;

if (!GOOGLE_AI_API_KEY) {
  console.error('Missing GOOGLE_AI_API_KEY. Run: source ~/.env');
  process.exit(1);
}

const OUTPUT_DIR = path.join(process.cwd(), 'public', 'exercises');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Mid-century modern illustration style prompt
const MID_CENTURY_STYLE = `=== MID-CENTURY MODERN ILLUSTRATION STYLE ===
Create a stylized fitness illustration inspired by 1950s-1960s instructional art:

ARTISTIC STYLE:
- Clean, bold linework with confident strokes
- Limited color palette: 2-3 muted tones (warm ochre, slate blue, dusty rose, sage green)
- Flat color blocks with subtle texture (like vintage screenprint or risograph)
- Geometric simplification of human form
- Strong silhouettes that read clearly at small sizes
- Retro mid-century modern aesthetic like Charley Harper meets fitness manual

FIGURE RENDERING:
- Anatomically proportioned but stylized (not cartoonish)
- Athletic build showing proper muscle engagement
- Clean, defined edges - no fuzzy or painterly effects
- Subtle halftone dot texture or paper grain for vintage feel
- Single figure demonstrating the exercise with perfect form

COMPOSITION:
- Clean background (solid muted color or simple gradient)
- Figure positioned to clearly show exercise mechanics
- Adequate negative space around the figure
- No text, labels, or UI elements
- Square format, centered composition

AVOID:
- Photorealistic rendering
- Bright neon colors
- Complex backgrounds or environments
- Multiple figures or action sequences
- 3D CGI look
- Anime or cartoon styles`;

// Exercise definitions with form cues for illustration
interface ExerciseIllustration {
  id: string;
  name: string;
  formDescription: string;
  modelGender: 'male' | 'female';
  modelEthnicity: string;
}

const EXERCISES: ExerciseIllustration[] = [
  // McGill Big 3
  {
    id: 'mcgill-curl-up',
    name: 'Curl-Up',
    formDescription: 'Person lying on back, one knee bent foot flat on floor, other leg extended straight. Hands placed under lower back to maintain natural spine curve. Head and shoulders lifted slightly off ground (only 1-2 inches), chin tucked, core braced. Eyes looking at ceiling.',
    modelGender: 'male',
    modelEthnicity: 'East Asian',
  },
  {
    id: 'mcgill-side-plank',
    name: 'Side Plank',
    formDescription: 'Person in side plank position on forearm. Elbow directly under shoulder, body in straight line from head to feet. Top arm resting on hip. Hips lifted and stacked, not sagging. Core engaged, neutral spine.',
    modelGender: 'female',
    modelEthnicity: 'Black/African',
  },
  {
    id: 'mcgill-bird-dog',
    name: 'Bird Dog',
    formDescription: 'Person on hands and knees (quadruped position). Right arm extended straight forward parallel to ground, left leg extended straight back parallel to ground. Spine neutral and flat like a table. Core braced, hips square to the ground.',
    modelGender: 'male',
    modelEthnicity: 'South Asian',
  },

  // Strength exercises
  {
    id: 'goblet-squat',
    name: 'Goblet Squat',
    formDescription: 'Person in deep squat position holding kettlebell at chest height with both hands cupping the bell. Feet shoulder-width apart, toes slightly out. Knees tracking over toes, elbows between knees. Chest up, back straight, full depth with hips below knees.',
    modelGender: 'female',
    modelEthnicity: 'Hispanic/Latino',
  },
  {
    id: 'farmers-carry',
    name: "Farmer's Carry",
    formDescription: 'Person walking tall while carrying kettlebell in one hand (single-arm carry shown). Shoulders level and packed down, not tilting to one side. Core braced, posture perfect. Looking straight ahead, confident stride mid-step.',
    modelGender: 'male',
    modelEthnicity: 'White/Caucasian',
  },
  {
    id: 'kb-deadlift',
    name: 'Kettlebell Deadlift',
    formDescription: 'Person at bottom of deadlift, hinging at hips. Kettlebell on ground between feet. Back flat with neutral spine, chest up. Knees slightly bent, weight in heels. Arms straight, shoulders over the bell, about to lift.',
    modelGender: 'female',
    modelEthnicity: 'Middle Eastern',
  },
  {
    id: 'kb-swing',
    name: 'Kettlebell Swing',
    formDescription: 'Person at top of kettlebell swing, hips fully extended. Kettlebell at chest height, arms straight. Standing tall with glutes squeezed, core tight. Powerful hip snap position, slight backward lean.',
    modelGender: 'male',
    modelEthnicity: 'Black/African',
  },

  // Mobility exercises
  {
    id: '90-90',
    name: '90/90 Hip Stretch',
    formDescription: 'Person seated on floor in 90/90 position. Front leg bent 90 degrees in front, back leg bent 90 degrees to the side. Torso upright and tall, sitting bones grounded. Hands on floor for light support.',
    modelGender: 'female',
    modelEthnicity: 'East Asian',
  },
  {
    id: 'deep-squat-hold',
    name: 'Deep Squat Hold',
    formDescription: 'Person in full deep squat (Asian squat position). Heels flat on ground, hips dropped below knees. Arms forward for balance or prayer position at chest. Spine neutral, chest lifted, relaxed breathing pose.',
    modelGender: 'male',
    modelEthnicity: 'Hispanic/Latino',
  },
  {
    id: 'couch-stretch',
    name: 'Couch Stretch',
    formDescription: 'Person in lunge position with back foot elevated against wall (shin vertical on wall). Front foot flat on ground, front knee at 90 degrees. Torso upright, squeezing back glute, stretching hip flexor. Hands on front knee.',
    modelGender: 'female',
    modelEthnicity: 'White/Caucasian',
  },
  {
    id: 'pigeon-stretch',
    name: 'Pigeon Stretch',
    formDescription: 'Person in pigeon pose. Front leg bent with shin roughly parallel to front of mat. Back leg extended straight behind. Torso upright or folded forward over front leg. Deep hip external rotation stretch.',
    modelGender: 'male',
    modelEthnicity: 'South Asian',
  },

  // Warmup exercises
  {
    id: 'cat-cow',
    name: 'Cat-Cow',
    formDescription: 'Person on hands and knees showing the "cat" position - back rounded up toward ceiling, head tucked down, tailbone tucked under. Hands under shoulders, knees under hips. Full spinal flexion.',
    modelGender: 'female',
    modelEthnicity: 'Black/African',
  },
  {
    id: 'leg-swings',
    name: 'Leg Swings',
    formDescription: 'Person standing on one leg, other leg swinging forward in a controlled dynamic stretch. One hand on wall for balance. Standing leg straight, swinging leg relaxed. Athletic, dynamic pose captured mid-swing.',
    modelGender: 'male',
    modelEthnicity: 'Middle Eastern',
  },
  {
    id: 'hip-circles',
    name: 'Hip Circles',
    formDescription: 'Person standing with hands on hips, feet shoulder-width apart. Hips rotating in a circular motion (shown mid-circle with hips shifted to one side). Knees soft, upper body stable.',
    modelGender: 'female',
    modelEthnicity: 'Hispanic/Latino',
  },
  {
    id: 'glute-bridge-warmup',
    name: 'Glute Bridge',
    formDescription: 'Person lying on back with knees bent, feet flat on floor hip-width apart. Hips lifted high, creating straight line from shoulders to knees. Arms flat on ground at sides. Glutes squeezed at top, core engaged.',
    modelGender: 'male',
    modelEthnicity: 'East Asian',
  },
];

async function generateImage(exercise: ExerciseIllustration): Promise<boolean> {
  console.log(`Generating: ${exercise.name} (${exercise.modelGender}, ${exercise.modelEthnicity})...`);

  const prompt = `${MID_CENTURY_STYLE}

EXERCISE: ${exercise.name}

FIGURE: ${exercise.modelGender === 'male' ? 'Athletic man' : 'Athletic woman'}, ${exercise.modelEthnicity} ethnicity, wearing simple workout attire (${exercise.modelGender === 'male' ? 'fitted t-shirt and shorts' : 'tank top and leggings'}).

POSE/FORM (CRITICAL - show this exactly):
${exercise.formDescription}

The illustration should clearly demonstrate proper exercise form that someone could learn from. Show the key position of the movement with anatomical accuracy.

NO text, NO labels, NO watermarks, NO UI elements.`;

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
        console.log(`  Saved: ${exercise.id}.png`);
        return true;
      }
    }

    console.error(`  No image generated for ${exercise.name}`);
    return false;
  } catch (error) {
    console.error(`  Error generating ${exercise.name}:`, error);
    return false;
  }
}

async function main() {
  console.log('\n========================================');
  console.log('EXERCISE ILLUSTRATION GENERATOR');
  console.log('Style: Mid-Century Modern');
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
