// Idaraya — exercise library.
//
// This file describes WHAT each movement is: its name, its coaching cue, the movement
// pattern it belongs to, whether it can hold external load, what a good repetition looks
// like, and the specific ways it goes wrong.
//
// It does NOT describe the DOSE. Sets, rep ranges, tempo, target RIR, and rest all live
// in src/clinical/parameters.ts, so a reviewing clinician can retune the program in a
// single diff without touching this file. `EXERCISES` composes the two.
//
// Movement-pattern ladders live in ./ladders.ts.

import {
  EXERCISE_DOSE,
  type ExerciseDose,
  type MovementPattern,
  type Prescription,
  type Tempo,
} from '../clinical/parameters';

export type { MovementPattern, Prescription, Tempo } from '../clinical/parameters';

export type Block = 'core' | 'strength' | 'arms' | 'mobility';

// The movement itself, independent of how hard it is being prescribed today.
export interface ExerciseIdentity {
  id: string;
  name: string;
  cue: string; // single-line coaching cue
  block: Block;
  pattern: MovementPattern;
  equipment?: string[];
  loadable: boolean; // true → progress by adding load; false → progress by variant, then reps
  standard: string; // what a good rep looks like — the pass/fail criterion
  faults: string[]; // the specific ways this movement goes wrong
  kneeNote?: string; // how to keep it knee-friendly
}

// An exercise as the rest of the app sees it: identity plus its clinical dose.
export type Exercise = ExerciseIdentity & ExerciseDose;

export interface WarmupExercise {
  id: string;
  name: string;
  duration: number;
  cue: string;
}

// ═══════════════════════════════════════════════════════════════════
// CORE & ABS — anti-movement stability (McGill Big 3) + direct ab work
// ═══════════════════════════════════════════════════════════════════

const MCGILL_CURL_UP: ExerciseIdentity = {
  id: 'mcgill-curl-up',
  name: 'Curl-Up',
  cue: 'Hands under low back. Lift head and shoulders slightly. Brace, hold.',
  block: 'core',
  pattern: 'trunkFlexion',
  loadable: false,
  standard: 'Head, neck and shoulders move as one block. The low back keeps its natural arch against your hands — it never flattens.',
  faults: [
    'Chin tucking to the chest and the neck doing the lifting',
    'Low back pressing flat into the hands',
    'Holding the breath instead of breathing shallowly through the brace',
  ],
};

const MCGILL_SIDE_PLANK: ExerciseIdentity = {
  id: 'mcgill-side-plank',
  name: 'Side Plank',
  cue: 'Forearm under the shoulder. Hips stacked and lifted, body one line. Both sides.',
  block: 'core',
  pattern: 'antiLateralFlexion',
  loadable: false,
  standard: 'Ankle, hip and shoulder form one straight line seen from the front. Hips stay stacked, not rotated toward the floor.',
  faults: [
    'Hips sagging toward the floor as the hold goes on',
    'Top hip rolling forward so the chest turns down',
    'Elbow drifting out from under the shoulder',
  ],
  kneeNote: 'Drop to the bottom knee to scale it down — keep the line from knee to head.',
};

const MCGILL_BIRD_DOG: ExerciseIdentity = {
  id: 'mcgill-bird-dog',
  name: 'Bird Dog',
  cue: 'Opposite arm and leg extend. Square hips. Slow and controlled.',
  block: 'core',
  pattern: 'antiRotation',
  loadable: false,
  standard: 'The trunk stays dead still while the limbs move. A glass of water on the low back would not spill.',
  faults: [
    'Hips rotating open as the leg lifts',
    'Lifting the leg above hip height and arching the low back',
    'Rushing — the value is in the control, not the reps',
  ],
};

const DEAD_BUG: ExerciseIdentity = {
  id: 'dead-bug',
  name: 'Dead Bug',
  cue: 'On back, arms up, knees over hips. Lower opposite arm and leg. Low back stays flat.',
  block: 'core',
  pattern: 'antiExtension',
  loadable: false,
  standard: 'The low back stays pressed to the floor for every rep. The moment it lifts, that rep is the last good one.',
  faults: [
    'Low back arching off the floor as the leg lowers',
    'Ribs flaring up toward the ceiling',
    'Lowering the limbs further than the brace can hold',
  ],
};

const FRONT_PLANK: ExerciseIdentity = {
  id: 'front-plank',
  name: 'Front Plank',
  cue: 'Forearms down, body one line. Squeeze glutes, brace abs. Breathe.',
  block: 'core',
  pattern: 'antiExtension',
  loadable: false,
  standard: 'Heels, hips and shoulders in one line. Glutes squeezed, ribs pulled down, breathing continues.',
  faults: [
    'Hips sagging and the low back arching',
    'Hips piked up to make it easier',
    'Holding the breath — a braced plank still breathes',
  ],
  kneeNote: 'Knees down for an easier version — keep the straight line from knees to head.',
};

const HOLLOW_HOLD: ExerciseIdentity = {
  id: 'hollow-hold',
  name: 'Hollow Hold',
  cue: 'On back, low back pressed to floor. Lift shoulders and legs slightly.',
  block: 'core',
  pattern: 'antiExtension',
  loadable: false,
  standard: 'The low back is glued to the floor. Shoulder blades and heels are both off the ground, body in a shallow banana.',
  faults: [
    'A gap opening between the low back and the floor',
    'Legs dropped so low the brace breaks',
    'Neck straining — the head rides with the shoulders, not ahead of them',
  ],
};

const PALLOF_PRESS: ExerciseIdentity = {
  id: 'pallof-press',
  name: 'Pallof Press',
  cue: 'Band anchored at side, chest height. Press straight out, resist the twist. Both sides.',
  block: 'core',
  pattern: 'antiRotation',
  equipment: ['mini band'],
  loadable: false,
  standard: 'Hands travel straight out from the sternum and back. The chest and hips never rotate toward the anchor.',
  faults: [
    'Torso rotating toward the band anchor',
    'Pressing across the body rather than straight ahead',
    'Standing too close to the anchor so there is no tension to resist',
  ],
};

// ═══════════════════════════════════════════════════════════════════
// STRENGTH — glute-focused, knee-friendly (hinge & bridge dominant)
// ═══════════════════════════════════════════════════════════════════

const GLUTE_BRIDGE: ExerciseIdentity = {
  id: 'glute-bridge',
  name: 'Glute Bridge',
  cue: 'Feet flat, hip-width. Drive through heels, squeeze glutes at top.',
  block: 'strength',
  pattern: 'bridge',
  loadable: false,
  standard: 'Shoulders, hips and knees form a straight line at the top. The lift comes from the glutes, not from arching the low back.',
  faults: [
    'Finishing the rep by arching the low back instead of extending the hip',
    'Pushing through the toes rather than the heels',
    'Rushing the top and skipping the squeeze',
  ],
  kneeNote: 'Knee-friendly: no knee load, pure glute work.',
};

const BAND_GLUTE_BRIDGE: ExerciseIdentity = {
  id: 'band-glute-bridge',
  name: 'Banded Glute Bridge',
  cue: 'Band above knees. Push knees out against band. Squeeze glutes at top.',
  block: 'strength',
  pattern: 'bridge',
  equipment: ['mini band'],
  loadable: false,
  standard: 'Knees press out against the band for the whole set — they never collapse inward, especially on the last reps.',
  faults: [
    'Knees caving in as fatigue arrives',
    'Arching the low back to finish the lift',
    'Band sitting on the kneecaps rather than above them',
  ],
};

const HIP_THRUST: ExerciseIdentity = {
  id: 'hip-thrust',
  name: 'Hip Thrust',
  cue: 'Upper back on couch edge, weight across hips. Drive hips up, ribs down.',
  block: 'strength',
  pattern: 'bridge',
  equipment: ['dumbbell'],
  loadable: true,
  standard: 'At the top the torso is horizontal and shins are vertical. Ribs stay down; the range comes from the hip, not the spine.',
  faults: [
    'Ribs flaring and the low back arching at lockout',
    'Chin lifting — the gaze should travel with the torso',
    'Feet too close or too far, so the hamstrings or quads take over from the glutes',
  ],
  kneeNote: 'Top glute builder with almost no knee strain.',
};

const SINGLE_LEG_GLUTE_BRIDGE: ExerciseIdentity = {
  id: 'single-leg-glute-bridge',
  name: 'Single-Leg Glute Bridge',
  cue: 'One foot planted, other leg extended. Drive through the heel, keep hips level.',
  block: 'strength',
  pattern: 'bridge',
  loadable: false,
  standard: 'The pelvis stays level side to side. The working glute lifts; the free leg is just along for the ride.',
  faults: [
    'The unsupported hip dropping toward the floor',
    'Twisting the pelvis toward the working side',
    'Hamstring cramping — a sign the foot is too far from the hips',
  ],
  kneeNote: 'Knee-friendly: builds single-leg glute strength without squatting.',
};

const KETTLEBELL_DEADLIFT: ExerciseIdentity = {
  id: 'kb-deadlift',
  name: 'Kettlebell Deadlift',
  cue: 'Hinge at hips, push butt back. Flat back. Stand tall, squeeze glutes.',
  block: 'strength',
  pattern: 'hinge',
  equipment: ['kettlebell'],
  loadable: true,
  standard: 'Hips travel back, not down. The back stays flat from tailbone to head, and the bell tracks close to the shins.',
  faults: [
    'Rounding the low back at the bottom',
    'Turning it into a squat — knees bending forward instead of hips going back',
    'Leaning back at the top to "finish" the lockout',
  ],
  kneeNote: 'Hinge from the hips, not the knees — shins stay near vertical.',
};

const DB_RDL: ExerciseIdentity = {
  id: 'db-rdl',
  name: 'Dumbbell RDL',
  cue: 'Soft knees, push hips back, dumbbells slide down thighs. Stand, squeeze.',
  block: 'strength',
  pattern: 'hinge',
  equipment: ['dumbbell'],
  loadable: true,
  standard: 'The depth is set by the hamstrings, not the spine. Stop where the back would otherwise start to round.',
  faults: [
    'Chasing depth by rounding the low back',
    'Dumbbells drifting away from the legs',
    'Bending the knees to reach lower instead of hinging',
  ],
  kneeNote: 'Hip hinge — minimal knee bend, great for glutes and hamstrings.',
};

const B_STANCE_RDL: ExerciseIdentity = {
  id: 'b-stance-rdl',
  name: 'B-Stance RDL',
  cue: 'One foot back, toes level with the front heel. The front leg does the work.',
  block: 'strength',
  pattern: 'hinge',
  equipment: ['kettlebell'],
  loadable: true,
  standard: 'Roughly 80% of the weight sits in the front leg. The back foot is a kickstand for balance only.',
  faults: [
    'Pushing through the back leg so it becomes a two-legged hinge',
    'Hips rotating open toward the back leg',
    'Back foot too far behind, turning it into a lunge',
  ],
  kneeNote: 'A hip hinge — soft front knee, shin stays vertical. The back leg is just a kickstand.',
};

const KETTLEBELL_SWING: ExerciseIdentity = {
  id: 'kb-swing',
  name: 'Kettlebell Swing',
  cue: 'Hinge, snap hips to float the bell. Power from glutes, not arms.',
  block: 'strength',
  pattern: 'hinge', // ballistic — stop well before form degrades
  equipment: ['kettlebell'],
  loadable: true,
  standard: 'The bell floats weightless at chest height, thrown there by the hips. Arms are ropes, not levers.',
  faults: [
    'Lifting the bell with the shoulders instead of snapping the hips',
    'Squatting the bell up rather than hinging',
    'Letting the bell drag the torso forward at the bottom',
  ],
  kneeNote: 'A hip hinge, not a squat — the knees barely bend.',
};

const BOX_SQUAT: ExerciseIdentity = {
  id: 'box-squat',
  name: 'Box Squat',
  cue: 'Stand in front of a chair. Sit back to lightly touch, drive up.',
  block: 'strength',
  pattern: 'squat',
  loadable: false,
  standard: 'The box caps the depth. Sit back to touch it lightly under control — never drop onto it.',
  faults: [
    'Collapsing onto the box and bouncing off it',
    'Knees caving inward on the drive up',
    'Heels lifting off the floor',
  ],
  kneeNote: 'Knee-friendly squat: the box caps your depth so the knee never overloads.',
};

const GOBLET_SQUAT: ExerciseIdentity = {
  id: 'goblet-squat',
  name: 'Goblet Squat',
  cue: 'Bell at chest, elbows inside knees. Sit back and down only as far as feels good.',
  block: 'strength',
  pattern: 'squat',
  equipment: ['kettlebell'],
  loadable: true,
  standard: 'Chest stays tall, knees track over the middle toes, and depth stops where the low back would otherwise tuck under.',
  faults: [
    'The low back tucking under at the bottom',
    'Knees caving inward',
    'Elbows drifting forward, pulling the chest down',
  ],
  kneeNote: 'Stop at the depth where the knee stays quiet. Keep knees tracking over toes.',
};

const FARMERS_CARRY: ExerciseIdentity = {
  id: 'farmers-carry',
  name: "Farmer's Carry",
  cue: 'Shoulders packed, ribs down. Walk tall and slow.',
  block: 'strength',
  pattern: 'carry',
  equipment: ['kettlebell'],
  loadable: true,
  standard: 'Torso stays vertical and square. No leaning away from the load, no shrugging up toward the ears.',
  faults: [
    'Side-bending away from the weight',
    'Shoulders shrugged rather than packed down',
    'Short shuffling steps instead of a normal walking stride',
  ],
};

const BAND_LATERAL_WALK: ExerciseIdentity = {
  id: 'band-lateral-walk',
  name: 'Lateral Band Walk',
  cue: 'Band above knees, quarter squat, chest up. Small steps sideways.',
  block: 'strength',
  pattern: 'abduction',
  equipment: ['mini band'],
  loadable: false,
  standard: 'Band tension never goes slack. The trailing foot steps in only halfway, so the hips stay loaded throughout.',
  faults: [
    'Standing up tall between steps and losing the quarter squat',
    'Letting the feet come together so the band goes slack',
    'Rocking the torso side to side to swing the leg out',
  ],
  kneeNote: 'Stay in a shallow quarter squat — knees track over toes.',
};

const BAND_MONSTER_WALK: ExerciseIdentity = {
  id: 'band-monster-walk',
  name: 'Monster Walk',
  cue: 'Band above knees, quarter squat, knees out. Step diagonally forward, stay low.',
  block: 'strength',
  pattern: 'abduction',
  equipment: ['mini band'],
  loadable: false,
  standard: 'Hips stay low and knees stay pushed out against the band on every diagonal step.',
  faults: [
    'Rising out of the quarter squat as you walk',
    'Knees drifting inward on the planted leg',
    'Steps too long, so the band tension collapses',
  ],
  kneeNote: 'Stay in a shallow quarter squat — knees track over toes.',
};

const BAND_CLAMSHELL: ExerciseIdentity = {
  id: 'band-clamshell',
  name: 'Clamshell',
  cue: 'On side, knees bent, band above knees. Lift top knee, feet stay touching.',
  block: 'strength',
  pattern: 'abduction',
  equipment: ['mini band'],
  loadable: false,
  standard: 'The pelvis stays perfectly still — only the knee opens. Feet remain in contact throughout.',
  faults: [
    'Rolling the pelvis backward to open the knee further',
    'Feet separating at the top of the rep',
    'Rushing — the side glute needs a deliberate squeeze',
  ],
  kneeNote: 'Knee-friendly: targets the side glute with no load through the joint.',
};

const BAND_KICKBACK: ExerciseIdentity = {
  id: 'band-kickback',
  name: 'Banded Kickback',
  cue: 'Band around ankles, hold a chair. Kick one leg straight back, squeeze the glute.',
  block: 'strength',
  pattern: 'hipExtension',
  equipment: ['mini band'],
  loadable: false,
  standard: 'The leg travels back from the hip while the low back stays still. Range stops where the pelvis would begin to tilt.',
  faults: [
    'Arching the low back to gain extra range',
    'Rotating the hips open on the kicking side',
    'Bending the standing leg into a squat',
  ],
  kneeNote: 'Knee-friendly: the standing knee stays soft, the moving leg stays straight.',
};

// ═══════════════════════════════════════════════════════════════════
// ARMS & UPPER BODY — push, pull, and accessories
// ═══════════════════════════════════════════════════════════════════

const INCLINE_PUSH_UP: ExerciseIdentity = {
  id: 'incline-push-up',
  name: 'Incline Push-Up',
  cue: 'Hands on a counter or sturdy table. Body one line, lower with control.',
  block: 'arms',
  pattern: 'horizontalPush',
  loadable: false,
  standard: 'Heels, hips and shoulders stay in one line. The chest — not the chin — touches down toward the surface.',
  faults: [
    'Hips sagging so the low back arches',
    'Only the head dipping while the chest stays high',
    'Elbows flaring straight out to the sides',
  ],
};

const PUSH_UP: ExerciseIdentity = {
  id: 'push-up',
  name: 'Push-Up',
  cue: 'Body one line, hands under shoulders. Lower with control, press up.',
  block: 'arms',
  pattern: 'horizontalPush',
  loadable: false,
  standard: 'One rigid line from heels to head, glutes squeezed. Elbows travel back at roughly 45°, not straight out.',
  faults: [
    'Hips sagging or piking up',
    'Elbows flaring to 90° from the body',
    'Partial range — the chest should come within a fist of the floor',
  ],
  kneeNote: 'Hands on a counter or knees down to scale it — keep the straight line.',
};

const BAND_ROW: ExerciseIdentity = {
  id: 'band-row',
  name: 'Band Row',
  cue: 'Sit tall, legs long, band looped around both feet. Pull elbows back, squeeze the shoulder blades.',
  block: 'arms',
  pattern: 'horizontalPull',
  equipment: ['mini band'],
  loadable: false,
  standard: 'Elbows drive back past the ribs while the torso stays upright and still. The shoulder blades pull first, the arms follow.',
  faults: [
    'Leaning the torso back to complete the pull',
    'Shrugging the shoulders up toward the ears',
    'Letting the knees bend so the band goes slack',
  ],
};

const DB_ROW: ExerciseIdentity = {
  id: 'db-row',
  name: 'Dumbbell Row',
  cue: 'Hinge forward, one hand on a chair. Pull the dumbbell to the hip, squeeze.',
  block: 'arms',
  pattern: 'horizontalPull',
  equipment: ['dumbbell'],
  loadable: true,
  standard: 'The back stays flat and the torso stays square. The dumbbell travels to the hip, driven by the elbow.',
  faults: [
    'Rotating the torso open to lift the weight higher',
    'Rounding the low back in the hinge',
    'Yanking with the biceps instead of driving the elbow back',
  ],
  kneeNote: 'Supported hinge — soft knees, no knee load.',
};

const DB_OVERHEAD_PRESS: ExerciseIdentity = {
  id: 'db-overhead-press',
  name: 'Overhead Press',
  cue: 'Dumbbells at shoulders. Brace, press straight overhead. Ribs down, no arch.',
  block: 'arms',
  pattern: 'verticalPush',
  equipment: ['dumbbell'],
  loadable: true,
  standard: 'The ribcage stays stacked over the pelvis. Lockout finishes with the dumbbells over the mid-foot, not in front of it.',
  faults: [
    'Arching the low back to press the weight up',
    'Pressing forward rather than straight overhead',
    'Ribs flaring as the arms lock out',
  ],
};

const DB_BICEP_CURL: ExerciseIdentity = {
  id: 'db-bicep-curl',
  name: 'Dumbbell Curl',
  cue: 'Elbows pinned to sides. Curl up slow, lower slower. No swinging.',
  block: 'arms',
  pattern: 'elbowFlexion',
  equipment: ['dumbbell'],
  loadable: true,
  standard: 'Elbows stay glued to the ribs. Only the forearm moves; the shoulder and torso are still.',
  faults: [
    'Swinging the torso to start the rep',
    'Elbows drifting forward at the top',
    'Dropping the weight instead of lowering it',
  ],
};

const DB_TRICEP_KICKBACK: ExerciseIdentity = {
  id: 'db-tricep-kickback',
  name: 'Triceps Kickback',
  cue: 'Hinge forward, upper arms pinned high. Straighten elbows back, squeeze.',
  block: 'arms',
  pattern: 'elbowExtension',
  equipment: ['dumbbell'],
  loadable: true,
  standard: 'The upper arm stays parallel to the floor and motionless. The elbow fully straightens and pauses.',
  faults: [
    'The upper arm dropping as the elbow extends',
    'Swinging the weight back with momentum',
    'Stopping short of full elbow lockout',
  ],
};

const DB_LATERAL_RAISE: ExerciseIdentity = {
  id: 'db-lateral-raise',
  name: 'Lateral Raise',
  cue: 'Soft elbows. Raise dumbbells to shoulder height, lead with elbows.',
  block: 'arms',
  pattern: 'lateralRaise',
  equipment: ['dumbbell'],
  loadable: true,
  standard: 'The elbow leads and stops level with the shoulder. The torso stays vertical and still.',
  faults: [
    'Swinging the torso to launch the weight',
    'Raising above shoulder height and shrugging',
    'Leading with the hands so the wrists finish higher than the elbows',
  ],
};

const BAND_PULL_APART: ExerciseIdentity = {
  id: 'band-pull-apart',
  name: 'Band Pull-Apart',
  cue: 'Band at chest height, arms straight. Pull apart, squeeze shoulder blades.',
  block: 'arms',
  pattern: 'scapularRetraction',
  equipment: ['mini band'],
  loadable: false,
  standard: 'Arms stay straight and level with the sternum. The movement comes from the shoulder blades sliding together.',
  faults: [
    'Bending the elbows to pull the band further',
    'Shrugging the shoulders toward the ears',
    'Arching the low back as the arms open',
  ],
};

// ═══════════════════════════════════════════════════════════════════
// MOBILITY — cooldown stretches. No load, no progression.
// ═══════════════════════════════════════════════════════════════════

const NINETY_NINETY: ExerciseIdentity = {
  id: '90-90',
  name: '90/90 Hip Stretch',
  cue: 'Both knees at 90°. Tall spine. Rotate gently side to side.',
  block: 'mobility',
  pattern: 'mobility',
  loadable: false,
  standard: 'Sit upright on both sit-bones with a tall spine. The stretch is felt in the hip, never the knee.',
  faults: [
    'Rounding the spine to lean forward',
    'Letting the back hip roll off the floor',
    'Forcing depth until the knee complains',
  ],
};

const DEEP_SQUAT_HOLD: ExerciseIdentity = {
  id: 'deep-squat-hold',
  name: 'Supported Squat Hold',
  cue: 'Hold a doorframe or rail for support. Sit into a comfortable squat. Heels down.',
  block: 'mobility',
  pattern: 'mobility',
  loadable: false,
  standard: 'Heels stay down and the chest stays tall. Depth stops well above any pinch in the knee.',
  faults: [
    'Heels lifting off the floor',
    'Sinking below a comfortable, pain-free depth',
    'Hanging on the support instead of holding position',
  ],
  kneeNote: 'Hold support and stay above any depth that pinches the knee.',
};

const COUCH_STRETCH: ExerciseIdentity = {
  id: 'couch-stretch',
  name: 'Couch Stretch',
  cue: 'Back knee padded against a wall. Squeeze glute, tall torso. Ease in gently.',
  block: 'mobility',
  pattern: 'mobility',
  loadable: false,
  standard: 'Torso vertical, back glute squeezed, pelvis tucked under. The stretch lands in the front of the hip.',
  faults: [
    'Letting the low back arch, which hides the hip stretch',
    'Leaning the torso forward to escape the stretch',
    'Grinding the back kneecap into a hard floor',
  ],
  kneeNote: 'Pad the back knee. Reduce the stretch if it pinches.',
};

const PIGEON_STRETCH: ExerciseIdentity = {
  id: 'pigeon-stretch',
  name: 'Pigeon Stretch',
  cue: 'Front shin angled, hips square. Sink gently, breathe deep.',
  block: 'mobility',
  pattern: 'mobility',
  loadable: false,
  standard: 'Hips stay square to the floor and the stretch is felt in the glute, never inside the front knee.',
  faults: [
    'Collapsing onto one hip so the pelvis twists',
    'Any pinching sensation inside the front knee',
    'Holding the breath through the stretch',
  ],
  kneeNote: 'Keep the front shin angled comfortably. Pain inside the knee means back off.',
};

// ═══════════════════════════════════════════════════════════════════

const IDENTITIES: ExerciseIdentity[] = [
  // Core & abs
  MCGILL_CURL_UP,
  MCGILL_SIDE_PLANK,
  MCGILL_BIRD_DOG,
  DEAD_BUG,
  FRONT_PLANK,
  HOLLOW_HOLD,
  PALLOF_PRESS,
  // Strength
  GLUTE_BRIDGE,
  BAND_GLUTE_BRIDGE,
  HIP_THRUST,
  SINGLE_LEG_GLUTE_BRIDGE,
  KETTLEBELL_DEADLIFT,
  DB_RDL,
  B_STANCE_RDL,
  KETTLEBELL_SWING,
  BOX_SQUAT,
  GOBLET_SQUAT,
  FARMERS_CARRY,
  BAND_LATERAL_WALK,
  BAND_MONSTER_WALK,
  BAND_CLAMSHELL,
  BAND_KICKBACK,
  // Arms & upper
  INCLINE_PUSH_UP,
  PUSH_UP,
  BAND_ROW,
  DB_ROW,
  DB_OVERHEAD_PRESS,
  DB_BICEP_CURL,
  DB_TRICEP_KICKBACK,
  DB_LATERAL_RAISE,
  BAND_PULL_APART,
  // Mobility
  NINETY_NINETY,
  DEEP_SQUAT_HOLD,
  COUCH_STRETCH,
  PIGEON_STRETCH,
];

// Identity + dose. A movement with no dose in src/clinical/parameters.ts is a
// programming error, not a runtime condition: it would silently vanish from the
// program. Fail at module load, where a guard test will catch it.
function withDose(identity: ExerciseIdentity): Exercise {
  const dose = EXERCISE_DOSE[identity.id];
  if (!dose) throw new Error(`No clinical dose defined for exercise: ${identity.id}`);
  return { ...identity, ...dose };
}

export const EXERCISES: Exercise[] = IDENTITIES.map(withDose);

const BY_ID = new Map(EXERCISES.map((e) => [e.id, e]));

// Throws rather than returning a fallback: a missing id is a programming error,
// and a silent default would hide a stranded ladder entry.
export function getExercise(id: string): Exercise {
  const ex = BY_ID.get(id);
  if (!ex) throw new Error(`Unknown exercise id: ${id}`);
  return ex;
}

export function hasExercise(id: string): boolean {
  return BY_ID.has(id);
}

// ═══════════════════════════════════════════════════════════════════
// DISPLAY HELPERS — the single place a prescription becomes prose
// ═══════════════════════════════════════════════════════════════════

// The concrete target for today, produced by the progression engine.
export function formatTarget(p: Prescription, target: number): string {
  switch (p.kind) {
    case 'reps':
      return p.perSide ? `${target} each side` : `${target} reps`;
    case 'hold':
      return p.perSide ? `${target}s each side` : `${target}s hold`;
    case 'steps':
      return `${target} steps`;
  }
}

// The same target, compressed for a single-line row where the dose sits beside the
// exercise name. `10s each side` becomes `10s/side`; `8s hold` becomes `8s`, because
// nothing else in a dose column is measured in seconds. The prose form above is what
// the detail sheet and the guided session say out loud.
export function formatTargetCompact(p: Prescription, target: number): string {
  switch (p.kind) {
    case 'reps':
      return p.perSide ? `${target}/side` : `${target}`;
    case 'hold':
      return p.perSide ? `${target}s/side` : `${target}s`;
    case 'steps':
      return `${target} steps`;
  }
}

export function formatRange(p: Prescription): string {
  const span = p.min === p.max ? `${p.min}` : `${p.min}–${p.max}`;
  switch (p.kind) {
    case 'reps':
      return p.perSide ? `${span} each side` : `${span} reps`;
    case 'hold':
      return p.perSide ? `${span}s each side` : `${span}s hold`;
    case 'steps':
      return `${span} steps`;
  }
}

export function formatTempo(t: Tempo): string {
  return `${t.eccentric}-${t.pauseBottom}-${t.concentric}-${t.pauseTop}`;
}

// Seconds a timed step should run for. Rep- and step-based work is untimed.
export function holdSeconds(p: Prescription, target: number): number | undefined {
  return p.kind === 'hold' ? target : undefined;
}

// ═══════════════════════════════════════════════════════════════════
// WARMUP
// ═══════════════════════════════════════════════════════════════════

export const WARMUP: WarmupExercise[] = [
  { id: 'cat-cow', name: 'Cat-Cow', duration: 45, cue: 'Breathe. Round and arch the spine slowly.' },
  { id: 'leg-swings', name: 'Leg Swings', duration: 30, cue: 'Front-back, 10 each leg. Hold support.' },
  { id: 'hip-circles', name: 'Hip Circles', duration: 30, cue: '10 circles each direction.' },
  { id: 'glute-bridge-warmup', name: 'Glute Bridge', duration: 30, cue: '10 reps, squeeze at top.' },
];

// ═══════════════════════════════════════════════════════════════════
// MUSCLE FOCUS — what each exercise targets, what to squeeze
// ═══════════════════════════════════════════════════════════════════

export interface MuscleFocus {
  targets: string[];
  squeeze: string;
}

export const EXERCISE_MUSCLES: Record<string, MuscleFocus> = {
  'mcgill-curl-up': { targets: ['Abs'], squeeze: 'Brace the abs like bracing for a punch — no movement, just tension.' },
  'mcgill-side-plank': { targets: ['Obliques', 'Side core'], squeeze: 'Feel the down-side waist fire to hold the hips up.' },
  'mcgill-bird-dog': { targets: ['Deep core', 'Glutes'], squeeze: 'Squeeze the reaching-leg glute; keep the trunk dead still.' },
  'dead-bug': { targets: ['Lower abs', 'Deep core'], squeeze: 'Feel the low abs as the back stays pinned flat.' },
  'front-plank': { targets: ['Abs', 'Glutes'], squeeze: 'Squeeze abs and glutes together — one rigid line.' },
  'hollow-hold': { targets: ['Lower abs'], squeeze: 'Feel the deep lower abs pressing the back down.' },
  'pallof-press': { targets: ['Obliques', 'Core'], squeeze: 'Brace the sides of the core to refuse the twist.' },
  'glute-bridge': { targets: ['Glutes'], squeeze: 'Squeeze the glutes hard at the top, ribs down.' },
  'band-glute-bridge': { targets: ['Glutes', 'Outer hip'], squeeze: 'Squeeze glutes up and push knees out against the band.' },
  'hip-thrust': { targets: ['Glutes', 'Hamstrings'], squeeze: 'Drive through heels, squeeze the glutes to lock the top.' },
  'single-leg-glute-bridge': { targets: ['Glutes', 'Hamstrings'], squeeze: 'Feel the working-side glute do all the lifting.' },
  'kb-deadlift': { targets: ['Glutes', 'Hamstrings', 'Back'], squeeze: 'Feel the hamstrings load, squeeze glutes to stand tall.' },
  'db-rdl': { targets: ['Hamstrings', 'Glutes'], squeeze: 'Feel the hamstrings stretch, then squeeze glutes up.' },
  'b-stance-rdl': { targets: ['Glutes', 'Hamstrings'], squeeze: 'Feel the front-leg glute and hamstring do all the work.' },
  'kb-swing': { targets: ['Glutes', 'Hamstrings'], squeeze: 'Snap the glutes to float the bell — power from the hips.' },
  'box-squat': { targets: ['Quads', 'Glutes'], squeeze: 'Drive up off the box and squeeze the glutes.' },
  'goblet-squat': { targets: ['Quads', 'Glutes'], squeeze: 'Push the floor away, squeeze glutes at the top.' },
  'farmers-carry': { targets: ['Grip', 'Traps', 'Core'], squeeze: 'Grip hard, brace the core, stay tall.' },
  'band-lateral-walk': { targets: ['Outer hip', 'Glutes'], squeeze: 'Feel the side glute on the leading leg with each step.' },
  'band-monster-walk': { targets: ['Glutes', 'Outer hip'], squeeze: 'Keep glutes switched on, knees out against the band.' },
  'band-clamshell': { targets: ['Outer hip'], squeeze: 'Feel the side glute open the knee — keep the hip still.' },
  'band-kickback': { targets: ['Glutes'], squeeze: 'Squeeze the glute to drive the leg back — no arching the low back.' },
  'incline-push-up': { targets: ['Chest', 'Triceps', 'Shoulders'], squeeze: 'Push the surface away; squeeze the chest at the top.' },
  'push-up': { targets: ['Chest', 'Triceps', 'Shoulders'], squeeze: 'Push the floor away; squeeze the chest at the top.' },
  'band-row': { targets: ['Upper back', 'Lats', 'Biceps'], squeeze: 'Squeeze the shoulder blades together as the elbows drive back.' },
  'db-row': { targets: ['Lats', 'Upper back', 'Biceps'], squeeze: 'Drive the elbow to the hip and squeeze the back, not the arm.' },
  'db-overhead-press': { targets: ['Shoulders', 'Triceps'], squeeze: 'Feel the shoulders press; lock out without arching.' },
  'db-bicep-curl': { targets: ['Biceps'], squeeze: 'Squeeze the biceps at the top; lower slow.' },
  'db-tricep-kickback': { targets: ['Triceps'], squeeze: 'Squeeze the back of the arm straight; pause at lockout.' },
  'db-lateral-raise': { targets: ['Side shoulders'], squeeze: 'Feel the side delts lift — lead with the elbows.' },
  'band-pull-apart': { targets: ['Upper back', 'Rear shoulders'], squeeze: 'Squeeze the shoulder blades together.' },
  '90-90': { targets: ['Hips', 'Glutes'], squeeze: 'Feel the stretch deep in the hip rotators.' },
  'deep-squat-hold': { targets: ['Hips', 'Ankles'], squeeze: 'Feel the hips and ankles open; breathe and relax.' },
  'couch-stretch': { targets: ['Hip flexors', 'Quads'], squeeze: 'Squeeze the back glute to deepen the front-hip stretch.' },
  'pigeon-stretch': { targets: ['Glutes'], squeeze: 'Feel the deep stretch in the front-leg glute.' },
};

export function getMuscleFocus(id: string): MuscleFocus | undefined {
  return EXERCISE_MUSCLES[id];
}

// ═══════════════════════════════════════════════════════════════════
// MOTION FRAMES — exercises with a two-frame animation (start ↔ top)
// ═══════════════════════════════════════════════════════════════════
//
// These ship `/exercises/<id>-a.webp` (start) and `<id>-b.webp` (top) alongside the
// static diagram, generated by scripts/generate-motion-frames.ts. The UI crossfades
// the pair so the movement itself is visible. Adding an id here without its frames
// fails the asset guard, not the user's screen.

export const MOTION_FRAMES: ReadonlySet<string> = new Set([
  // core
  'mcgill-bird-dog',
  'dead-bug',
  // pallof-press: animation pair not yet acceptable (bird's-eye camera drift) — static diagram ships instead
  // lower body
  'glute-bridge',
  'band-glute-bridge',
  'hip-thrust',
  'single-leg-glute-bridge',
  'kb-deadlift',
  'db-rdl',
  'b-stance-rdl',
  'kb-swing',
  'box-squat',
  'goblet-squat',
  // band-lateral-walk: animation pair not yet acceptable (gathered stance never narrow) — static diagram ships instead
  'band-monster-walk',
  // band-clamshell: pair failed physio review twice (knee angles / two figures) — single static passes
  'band-kickback',
  // upper body
  'incline-push-up',
  'push-up',
  'band-row',
  'db-row',
  'db-overhead-press',
  'db-bicep-curl',
  // db-tricep-kickback: pair failed twice (start frame never pins the upper arm) — single static passes
  'db-lateral-raise',
  'band-pull-apart',
]);

export function hasMotionFrames(id: string): boolean {
  return MOTION_FRAMES.has(id);
}

// What the two panels of a pose pair are called. "Start/Top" fits rising
// movements (bridges, rows, raises); descent movements start standing and
// travel DOWN, and mislabelling their bottom as "Top" teaches the rep
// upside-down — the adversarial physio review caught exactly that.
const POSE_CAPTION_OVERRIDES: Record<string, [string, string]> = {
  'kb-deadlift': ['Start', 'Lockout'],
  'db-rdl': ['Start', 'Bottom'],
  'b-stance-rdl': ['Start', 'Bottom'],
  'goblet-squat': ['Start', 'Bottom'],
  'box-squat': ['Start', 'Bottom'],
  'push-up': ['Start', 'Bottom'],
  'incline-push-up': ['Start', 'Bottom'],
  'kb-swing': ['Backswing', 'Float'],
  'band-clamshell': ['Closed', 'Open'],
};

export function poseCaptions(id: string): [string, string] {
  return POSE_CAPTION_OVERRIDES[id] ?? ['Start', 'Top'];
}

