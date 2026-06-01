// Idaraya - Minimalist Movement Practice
// ~30 minute daily workout: supersets for density + a scored metabolic finisher
// Goals (in priority): glutes, core & abs, toned arms, real sweat
// Constraints: knee-friendly (low-impact, hinge-dominant, controlled range), gradual ramp
// Equipment: bodyweight, kettlebell, dumbbells, mini loop bands

export type Block = 'core' | 'strength' | 'arms' | 'mobility';

export interface Exercise {
  id: string;
  name: string;
  cue: string; // Single line coaching cue
  block: Block;
  sets: number;
  reps: number | string;
  hold?: number; // seconds for static holds
  restBetweenSets?: number; // seconds of rest between sets
  equipment?: string[];
  kneeNote?: string; // shown when relevant — how to keep it knee-friendly
}

export interface WarmupExercise {
  id: string;
  name: string;
  duration: number;
  cue: string;
}

// A superset pairs two non-competing exercises done back-to-back;
// rest comes only after the pair. This is what keeps the heart rate up.
export interface SupersetPair {
  exerciseIds: [string, string];
  restAfterPair: number; // seconds of rest after completing both
}

// A finisher is a short, scored metabolic block at the end of the workout.
// All finishers are hinge/bridge-based and knee-friendly.
export interface Finisher {
  id: string;
  name: string; // bold display name
  tagline: string; // the challenge, in one line
  format: 'intervals' | 'amrap';
  // intervals: rounds × (work + rest)
  workSeconds?: number;
  restSeconds?: number;
  rounds?: number;
  // amrap: one continuous block, repeat the task
  durationSeconds?: number;
  task?: string;
  scoreUnit: string; // what the user counts: 'swings', 'rounds', 'steps', 'reps'
  scoreCue: string;
  equipment?: string[];
  kneeNote?: string;
}

export interface WorkoutDay {
  type: 'workout' | 'rest';
  exercises: Exercise[];
  supersets: SupersetPair[];
  finisher: Finisher | null;
  warmup: WarmupExercise[];
}

// ═══════════════════════════════════════════════════════════════════
// CORE & ABS
// McGill Big 3 (anti-movement stability) + direct ab work.
// ═══════════════════════════════════════════════════════════════════

const MCGILL_CURL_UP: Exercise = {
  id: 'mcgill-curl-up',
  name: 'Curl-Up',
  cue: 'Hands under low back. Lift head and shoulders slightly. Brace, hold.',
  block: 'core',
  sets: 3,
  reps: '10s hold',
  hold: 10,
  restBetweenSets: 10,
};

const MCGILL_SIDE_PLANK: Exercise = {
  id: 'mcgill-side-plank',
  name: 'Side Plank',
  cue: 'Forearm or hand under the shoulder. Hips stacked and lifted, body one line. Both sides.',
  block: 'core',
  sets: 2,
  reps: '10s each',
  hold: 10,
  restBetweenSets: 10,
  kneeNote: 'Forearm version is easier on the wrist. Drop to the bottom knee to scale it down.',
};

const MCGILL_BIRD_DOG: Exercise = {
  id: 'mcgill-bird-dog',
  name: 'Bird Dog',
  cue: 'Opposite arm and leg extend. Square hips. Slow and controlled.',
  block: 'core',
  sets: 2,
  reps: '6 each',
  restBetweenSets: 10,
};

const DEAD_BUG: Exercise = {
  id: 'dead-bug',
  name: 'Dead Bug',
  cue: 'On back, arms up, knees over hips. Lower opposite arm and leg. Low back stays flat.',
  block: 'core',
  sets: 2,
  reps: '8 each',
  restBetweenSets: 15,
};

const FRONT_PLANK: Exercise = {
  id: 'front-plank',
  name: 'Front Plank',
  cue: 'Forearms down, body one line. Squeeze glutes, brace abs. Breathe.',
  block: 'core',
  sets: 2,
  reps: '20s hold',
  hold: 20,
  restBetweenSets: 20,
  kneeNote: 'Knees down for an easier version — keep the straight line from knees to head.',
};

const HOLLOW_HOLD: Exercise = {
  id: 'hollow-hold',
  name: 'Hollow Hold',
  cue: 'On back, low back pressed to floor. Lift shoulders and legs slightly. Bend knees to regress.',
  block: 'core',
  sets: 3,
  reps: '15s hold',
  hold: 15,
  restBetweenSets: 20,
};

const PALLOF_PRESS: Exercise = {
  id: 'pallof-press',
  name: 'Pallof Press',
  cue: 'Band anchored at side, chest height. Press straight out, resist the twist. Both sides.',
  block: 'core',
  sets: 2,
  reps: '10 each',
  restBetweenSets: 15,
  equipment: ['mini band'],
};

// ═══════════════════════════════════════════════════════════════════
// STRENGTH — Glute-focused, knee-friendly (hinge & bridge dominant)
// ═══════════════════════════════════════════════════════════════════

const GLUTE_BRIDGE: Exercise = {
  id: 'glute-bridge',
  name: 'Glute Bridge',
  cue: 'Feet flat, hip-width. Drive through heels, squeeze glutes at top. 2-sec hold.',
  block: 'strength',
  sets: 3,
  reps: 12,
  restBetweenSets: 20,
  kneeNote: 'Knee-friendly: no knee load, pure glute work.',
};

const BAND_GLUTE_BRIDGE: Exercise = {
  id: 'band-glute-bridge',
  name: 'Banded Glute Bridge',
  cue: 'Band above knees. Push knees out against band. Squeeze glutes at top, 2-sec hold.',
  block: 'strength',
  sets: 2,
  reps: 12,
  restBetweenSets: 20,
  equipment: ['mini band'],
};

const HIP_THRUST: Exercise = {
  id: 'hip-thrust',
  name: 'Hip Thrust',
  cue: 'Upper back on couch edge, weight across hips. Drive hips up, ribs down, squeeze hard.',
  block: 'strength',
  sets: 3,
  reps: 10,
  restBetweenSets: 30,
  equipment: ['dumbbell'],
  kneeNote: 'Top glute builder with almost no knee strain.',
};

const SINGLE_LEG_GLUTE_BRIDGE: Exercise = {
  id: 'single-leg-glute-bridge',
  name: 'Single-Leg Glute Bridge',
  cue: 'One foot planted, other leg extended. Drive through the heel, keep hips level.',
  block: 'strength',
  sets: 2,
  reps: '8 each',
  restBetweenSets: 20,
  kneeNote: 'Knee-friendly: builds single-leg glute strength without squatting.',
};

const KETTLEBELL_DEADLIFT: Exercise = {
  id: 'kb-deadlift',
  name: 'Kettlebell Deadlift',
  cue: 'Hinge at hips, push butt back. Flat back. Bell between feet. Stand tall, squeeze glutes.',
  block: 'strength',
  sets: 3,
  reps: 8,
  restBetweenSets: 30,
  equipment: ['kettlebell'],
  kneeNote: 'Hinge from the hips, not the knees — shins stay near vertical.',
};

const DB_RDL: Exercise = {
  id: 'db-rdl',
  name: 'Dumbbell RDL',
  cue: 'Soft knees, push hips back, dumbbells slide down thighs. Feel the hamstrings. Stand, squeeze.',
  block: 'strength',
  sets: 3,
  reps: 10,
  restBetweenSets: 30,
  equipment: ['dumbbell'],
  kneeNote: 'Hip hinge — minimal knee bend, great for glutes and hamstrings.',
};

const B_STANCE_RDL: Exercise = {
  id: 'b-stance-rdl',
  name: 'B-Stance RDL',
  cue: 'One foot back, toes level with the front heel. Hinge — the front leg does the work. Both sides.',
  block: 'strength',
  sets: 3,
  reps: '8 each',
  restBetweenSets: 30,
  equipment: ['kettlebell'],
  kneeNote: 'A hip hinge — soft front knee, shin stays vertical. The back leg is just a kickstand.',
};

const BOX_SQUAT: Exercise = {
  id: 'box-squat',
  name: 'Box Squat',
  cue: 'Stand in front of a chair. Sit back to lightly touch, drive up. Control the depth.',
  block: 'strength',
  sets: 3,
  reps: 10,
  restBetweenSets: 30,
  kneeNote: 'Knee-friendly squat: the box caps your depth so the knee never overloads.',
};

const GOBLET_SQUAT: Exercise = {
  id: 'goblet-squat',
  name: 'Goblet Squat',
  cue: 'Bell at chest, elbows inside knees. Sit back and down only as far as feels good.',
  block: 'strength',
  sets: 3,
  reps: 8,
  restBetweenSets: 30,
  equipment: ['kettlebell'],
  kneeNote: 'Stop at the depth where the knee stays quiet. Keep knees tracking over toes.',
};

const FARMERS_CARRY: Exercise = {
  id: 'farmers-carry',
  name: "Farmer's Carry",
  cue: 'Shoulders packed, ribs down. Walk tall and slow. 40 steps.',
  block: 'strength',
  sets: 2,
  reps: '40 steps',
  restBetweenSets: 20,
  equipment: ['kettlebell'],
};

const KETTLEBELL_SWING: Exercise = {
  id: 'kb-swing',
  name: 'Kettlebell Swing',
  cue: 'Hinge, snap hips to float the bell. Power from glutes, not arms. Soft knees.',
  block: 'strength',
  sets: 3,
  reps: 10,
  restBetweenSets: 20,
  equipment: ['kettlebell'],
  kneeNote: 'A hip hinge, not a squat — the knees barely bend.',
};

const BAND_LATERAL_WALK: Exercise = {
  id: 'band-lateral-walk',
  name: 'Lateral Band Walk',
  cue: 'Band above knees, quarter squat, chest up. Small steps sideways, tension constant.',
  block: 'strength',
  sets: 2,
  reps: '10 each way',
  restBetweenSets: 15,
  equipment: ['mini band'],
};

const BAND_MONSTER_WALK: Exercise = {
  id: 'band-monster-walk',
  name: 'Monster Walk',
  cue: 'Band above knees, quarter squat, knees out. Step diagonally forward, stay low.',
  block: 'strength',
  sets: 2,
  reps: '10 each leg',
  restBetweenSets: 15,
  equipment: ['mini band'],
};

const BAND_KICKBACK: Exercise = {
  id: 'band-kickback',
  name: 'Banded Kickback',
  cue: 'Band around ankles, hold a chair or wall. Kick one leg straight back, squeeze the glute. Both sides.',
  block: 'strength',
  sets: 2,
  reps: '12 each',
  restBetweenSets: 15,
  equipment: ['mini band'],
  kneeNote: 'Knee-friendly: the standing knee stays soft, the moving leg stays straight.',
};

const BAND_CLAMSHELL: Exercise = {
  id: 'band-clamshell',
  name: 'Clamshell',
  cue: 'On side, knees bent, band above knees. Lift top knee, feet stay touching. Slow.',
  block: 'strength',
  sets: 2,
  reps: '12 each',
  restBetweenSets: 15,
  equipment: ['mini band'],
  kneeNote: 'Knee-friendly: targets the side glute with no load through the joint.',
};

// ═══════════════════════════════════════════════════════════════════
// ARMS — toning, dumbbell + band + bodyweight
// ═══════════════════════════════════════════════════════════════════

const DB_BICEP_CURL: Exercise = {
  id: 'db-bicep-curl',
  name: 'Dumbbell Curl',
  cue: 'Elbows pinned to sides. Curl up slow, lower slower. No swinging.',
  block: 'arms',
  sets: 3,
  reps: 12,
  restBetweenSets: 20,
  equipment: ['dumbbell'],
};

const DB_OVERHEAD_PRESS: Exercise = {
  id: 'db-overhead-press',
  name: 'Overhead Press',
  cue: 'Dumbbells at shoulders. Brace, press straight overhead. Ribs down, no arch.',
  block: 'arms',
  sets: 3,
  reps: 10,
  restBetweenSets: 25,
  equipment: ['dumbbell'],
};

const DB_TRICEP_KICKBACK: Exercise = {
  id: 'db-tricep-kickback',
  name: 'Triceps Kickback',
  cue: 'Hinge forward, upper arms pinned high. Straighten elbows back, squeeze. Slow return.',
  block: 'arms',
  sets: 3,
  reps: 12,
  restBetweenSets: 20,
  equipment: ['dumbbell'],
};

const DB_LATERAL_RAISE: Exercise = {
  id: 'db-lateral-raise',
  name: 'Lateral Raise',
  cue: 'Soft elbows. Raise dumbbells to shoulder height, lead with elbows. Lower slow.',
  block: 'arms',
  sets: 3,
  reps: 12,
  restBetweenSets: 20,
  equipment: ['dumbbell'],
};

const PUSH_UP: Exercise = {
  id: 'push-up',
  name: 'Push-Up',
  cue: 'Body one line, hands under shoulders. Lower with control, press up. Squeeze glutes.',
  block: 'arms',
  sets: 3,
  reps: 8,
  restBetweenSets: 25,
  kneeNote: 'Hands on a counter or knees down to scale it — keep the straight line.',
};

const BAND_PULL_APART: Exercise = {
  id: 'band-pull-apart',
  name: 'Band Pull-Apart',
  cue: 'Band at chest height, arms straight. Pull apart, squeeze shoulder blades. Slow return.',
  block: 'arms',
  sets: 2,
  reps: 15,
  restBetweenSets: 20,
  equipment: ['mini band'],
};

// ═══════════════════════════════════════════════════════════════════
// MOBILITY
// ═══════════════════════════════════════════════════════════════════

const NINETY_NINETY: Exercise = {
  id: '90-90',
  name: '90/90 Hip Stretch',
  cue: 'Both knees at 90°. Tall spine. Rotate gently side to side.',
  block: 'mobility',
  sets: 1,
  reps: '30s each',
  hold: 30,
  restBetweenSets: 0,
};

const DEEP_SQUAT_HOLD: Exercise = {
  id: 'deep-squat-hold',
  name: 'Supported Squat Hold',
  cue: 'Hold a doorframe or rail for support. Sit into a comfortable squat. Heels down, breathe.',
  block: 'mobility',
  sets: 1,
  reps: '45s',
  hold: 45,
  restBetweenSets: 0,
  kneeNote: 'Hold support and stay above any depth that pinches the knee.',
};

const COUCH_STRETCH: Exercise = {
  id: 'couch-stretch',
  name: 'Couch Stretch',
  cue: 'Back knee padded against a wall. Squeeze glute, tall torso. Ease in gently.',
  block: 'mobility',
  sets: 1,
  reps: '30s each',
  hold: 30,
  restBetweenSets: 0,
  kneeNote: 'Pad the back knee. Reduce the stretch if it pinches.',
};

const PIGEON_STRETCH: Exercise = {
  id: 'pigeon-stretch',
  name: 'Pigeon Stretch',
  cue: 'Front shin angled, hips square. Sink gently, breathe deep.',
  block: 'mobility',
  sets: 1,
  reps: '45s each',
  hold: 45,
  restBetweenSets: 0,
};

// ═══════════════════════════════════════════════════════════════════
// FINISHERS — 4-6 minute scored metabolic blocks. The sweat lives here.
// All knee-friendly: hinges, bridges, carries, band work. No jumping.
// ═══════════════════════════════════════════════════════════════════

export const FINISHERS: Finisher[] = [
  {
    id: 'swing-storm',
    name: 'Swing Storm',
    tagline: 'Six rounds of swings. Power from the hips, every single rep.',
    format: 'intervals',
    workSeconds: 30,
    restSeconds: 15,
    rounds: 6,
    scoreUnit: 'swings',
    scoreCue: 'Count every swing across all six rounds.',
    equipment: ['kettlebell'],
    kneeNote: 'A hip hinge, not a squat — the knees barely bend.',
  },
  {
    id: 'the-burner',
    name: 'The Burner',
    tagline: 'Band on. Walk, walk, kick. No rest until the clock stops.',
    format: 'amrap',
    durationSeconds: 240,
    task: '10 lateral steps each way · 10 monster steps · 10 kickbacks each leg',
    scoreUnit: 'rounds',
    scoreCue: 'Move continuously. Count completed rounds.',
    equipment: ['mini band'],
    kneeNote: 'Stay in a shallow quarter squat — knees track over toes.',
  },
  {
    id: 'carry-heavy',
    name: 'Carry Heavy',
    tagline: 'Pick it up. Walk tall. Repeat until the clock saves you.',
    format: 'intervals',
    workSeconds: 40,
    restSeconds: 20,
    rounds: 5,
    scoreUnit: 'steps',
    scoreCue: 'Count total steps across all five carries.',
    equipment: ['kettlebell'],
  },
  {
    id: 'bridge-inferno',
    name: 'Bridge Inferno',
    tagline: 'Four minutes. Glutes only. Feel the burn build.',
    format: 'amrap',
    durationSeconds: 240,
    task: '15 glute bridges (2s hold) · 10 banded kickbacks each leg',
    scoreUnit: 'rounds',
    scoreCue: 'Squeeze hard at the top of every rep. Count rounds.',
    equipment: ['mini band'],
    kneeNote: 'Zero knee load — pure glutes.',
  },
  {
    id: 'hinge-and-drive',
    name: 'Hinge & Drive',
    tagline: 'Deadlift fast, stand tall, go again.',
    format: 'intervals',
    workSeconds: 30,
    restSeconds: 20,
    rounds: 6,
    scoreUnit: 'reps',
    scoreCue: 'Crisp reps — count every lockout.',
    equipment: ['kettlebell'],
    kneeNote: 'Hips back, shins vertical. Stop if form breaks.',
  },
];

// Foundation phase gets a scaled-down finisher (fewer rounds / shorter clock)
// so the ramp stays gentle. Build onward gets the full dose.
function scaleFinisherForPhase(finisher: Finisher, phase: Phase): Finisher {
  if (phase !== 'foundation') return finisher;
  if (finisher.format === 'intervals') {
    return { ...finisher, rounds: Math.max(3, (finisher.rounds ?? 6) - 2) };
  }
  return { ...finisher, durationSeconds: Math.max(120, (finisher.durationSeconds ?? 240) - 60) };
}

export function getFinisherForDate(dayOfWeek: number, phase: Phase): Finisher {
  return scaleFinisherForPhase(FINISHERS[dayOfWeek % FINISHERS.length], phase);
}

// ═══════════════════════════════════════════════════════════════════
// WARMUP (~3 min)
// ═══════════════════════════════════════════════════════════════════

const WARMUP: WarmupExercise[] = [
  {
    id: 'cat-cow',
    name: 'Cat-Cow',
    duration: 45,
    cue: 'Breathe. Round and arch the spine slowly.',
  },
  {
    id: 'leg-swings',
    name: 'Leg Swings',
    duration: 30,
    cue: 'Front-back, 10 each leg. Hold support.',
  },
  {
    id: 'hip-circles',
    name: 'Hip Circles',
    duration: 30,
    cue: '10 circles each direction.',
  },
  {
    id: 'glute-bridge-warmup',
    name: 'Glute Bridge',
    duration: 30,
    cue: '10 reps, squeeze at top.',
  },
];

// ═══════════════════════════════════════════════════════════════════
// PHASED PROGRESSION — gradual ramp over the year
// ═══════════════════════════════════════════════════════════════════

export type Phase = 'foundation' | 'build' | 'strength' | 'sustain';

export interface PhaseInfo {
  key: Phase;
  name: string;
  weeks: string;
  description: string;
  focus: string[];
}

export const PHASES: Record<Phase, PhaseInfo> = {
  foundation: {
    key: 'foundation',
    name: 'Foundation',
    weeks: '1-4',
    description: 'Wake up the glutes and core. Light, controlled, knee-friendly.',
    focus: ['Glute activation', 'Core stability', 'Hip hinge', 'Mobility'],
  },
  build: {
    key: 'build',
    name: 'Build',
    weeks: '5-12',
    description: 'Add load and volume. Direct ab and arm work enters.',
    focus: ['Hip thrust', 'Loaded hinge', 'Abs', 'Dumbbell arms'],
  },
  strength: {
    key: 'strength',
    name: 'Strength',
    weeks: '13-26',
    description: 'Single-leg glute work and controlled power. Fuller arm volume.',
    focus: ['Single-leg glutes', 'KB swing', 'Plank progression', 'Arms'],
  },
  sustain: {
    key: 'sustain',
    name: 'Sustain',
    weeks: '27-52',
    description: 'Full balanced program. Keep showing up.',
    focus: ['Glutes', 'Core & abs', 'Arms', 'Mobility'],
  },
};

const PHASE_ORDER: Phase[] = ['foundation', 'build', 'strength', 'sustain'];

export function getPhaseForWeek(week: number): Phase {
  if (week <= 4) return 'foundation';
  if (week <= 12) return 'build';
  if (week <= 26) return 'strength';
  return 'sustain';
}

export function getPhaseInfo(week: number): PhaseInfo {
  return PHASES[getPhaseForWeek(week)];
}

// All exercises (for image map / counting reference)
export const EXERCISES: Exercise[] = [
  MCGILL_CURL_UP,
  MCGILL_SIDE_PLANK,
  MCGILL_BIRD_DOG,
  DEAD_BUG,
  FRONT_PLANK,
  HOLLOW_HOLD,
  PALLOF_PRESS,
  GLUTE_BRIDGE,
  BAND_GLUTE_BRIDGE,
  HIP_THRUST,
  SINGLE_LEG_GLUTE_BRIDGE,
  KETTLEBELL_DEADLIFT,
  DB_RDL,
  B_STANCE_RDL,
  BOX_SQUAT,
  GOBLET_SQUAT,
  FARMERS_CARRY,
  KETTLEBELL_SWING,
  BAND_LATERAL_WALK,
  BAND_MONSTER_WALK,
  BAND_CLAMSHELL,
  BAND_KICKBACK,
  DB_BICEP_CURL,
  DB_OVERHEAD_PRESS,
  DB_TRICEP_KICKBACK,
  DB_LATERAL_RAISE,
  PUSH_UP,
  BAND_PULL_APART,
  NINETY_NINETY,
  DEEP_SQUAT_HOLD,
  COUCH_STRETCH,
  PIGEON_STRETCH,
];

// ═══════════════════════════════════════════════════════════════════
// MUSCLE FOCUS — what each exercise targets, what to squeeze, where to feel it
// Drives the muscle-activation illustration and the on-card cue.
// ═══════════════════════════════════════════════════════════════════

export interface MuscleFocus {
  targets: string[]; // primary muscles worked (short labels for chips)
  squeeze: string; // the active cue — what to contract / where to feel it
}

export const EXERCISE_MUSCLES: Record<string, MuscleFocus> = {
  // Core & abs
  'mcgill-curl-up': { targets: ['Abs'], squeeze: 'Brace the abs like bracing for a punch — no movement, just tension.' },
  'mcgill-side-plank': { targets: ['Obliques', 'Side core'], squeeze: 'Feel the down-side waist fire to hold the hips up.' },
  'mcgill-bird-dog': { targets: ['Deep core', 'Glutes'], squeeze: 'Squeeze the reaching-leg glute; keep the trunk dead still.' },
  'dead-bug': { targets: ['Lower abs', 'Deep core'], squeeze: 'Feel the low abs as the back stays pinned flat.' },
  'front-plank': { targets: ['Abs', 'Glutes'], squeeze: 'Squeeze abs and glutes together — one rigid line.' },
  'hollow-hold': { targets: ['Lower abs'], squeeze: 'Feel the deep lower abs pressing the back down.' },
  'pallof-press': { targets: ['Obliques', 'Core'], squeeze: 'Brace the sides of the core to refuse the twist.' },
  // Strength (glutes / lower)
  'glute-bridge': { targets: ['Glutes'], squeeze: 'Squeeze the glutes hard at the top, ribs down.' },
  'band-glute-bridge': { targets: ['Glutes', 'Outer hip'], squeeze: 'Squeeze glutes up and push knees out against the band.' },
  'hip-thrust': { targets: ['Glutes', 'Hamstrings'], squeeze: 'Drive through heels, squeeze the glutes to lock the top.' },
  'single-leg-glute-bridge': { targets: ['Glutes', 'Hamstrings'], squeeze: 'Feel the working-side glute do all the lifting.' },
  'kb-deadlift': { targets: ['Glutes', 'Hamstrings', 'Back'], squeeze: 'Feel the hamstrings load, squeeze glutes to stand tall.' },
  'db-rdl': { targets: ['Hamstrings', 'Glutes'], squeeze: 'Feel the hamstrings stretch, then squeeze glutes up.' },
  'b-stance-rdl': { targets: ['Glutes', 'Hamstrings'], squeeze: 'Feel the front-leg glute and hamstring do all the work.' },
  'box-squat': { targets: ['Quads', 'Glutes'], squeeze: 'Drive up off the box and squeeze the glutes.' },
  'goblet-squat': { targets: ['Quads', 'Glutes'], squeeze: 'Push the floor away, squeeze glutes at the top.' },
  'farmers-carry': { targets: ['Grip', 'Traps', 'Core'], squeeze: 'Grip hard, brace the core, stay tall.' },
  'kb-swing': { targets: ['Glutes', 'Hamstrings'], squeeze: 'Snap the glutes to float the bell — power from the hips.' },
  'band-lateral-walk': { targets: ['Outer hip', 'Glutes'], squeeze: 'Feel the side glute on the leading leg with each step.' },
  'band-monster-walk': { targets: ['Glutes', 'Outer hip'], squeeze: 'Keep glutes switched on, knees out against the band.' },
  'band-clamshell': { targets: ['Outer hip'], squeeze: 'Feel the side glute open the knee — keep the hip still.' },
  'band-kickback': { targets: ['Glutes'], squeeze: 'Squeeze the glute to drive the leg back — no arching the low back.' },
  // Arms
  'db-bicep-curl': { targets: ['Biceps'], squeeze: 'Squeeze the biceps at the top; lower slow.' },
  'db-overhead-press': { targets: ['Shoulders', 'Triceps'], squeeze: 'Feel the shoulders press; lock out without arching.' },
  'db-tricep-kickback': { targets: ['Triceps'], squeeze: 'Squeeze the back of the arm straight; pause at lockout.' },
  'db-lateral-raise': { targets: ['Side shoulders'], squeeze: 'Feel the side delts lift — lead with the elbows.' },
  'push-up': { targets: ['Chest', 'Triceps', 'Shoulders'], squeeze: 'Push the floor away; squeeze the chest at the top.' },
  'band-pull-apart': { targets: ['Upper back', 'Rear shoulders'], squeeze: 'Squeeze the shoulder blades together.' },
  // Mobility (where to feel the stretch)
  '90-90': { targets: ['Hips', 'Glutes'], squeeze: 'Feel the stretch deep in the hip rotators.' },
  'deep-squat-hold': { targets: ['Hips', 'Ankles'], squeeze: 'Feel the hips and ankles open; breathe and relax.' },
  'couch-stretch': { targets: ['Hip flexors', 'Quads'], squeeze: 'Squeeze the back glute to deepen the front-hip stretch.' },
  'pigeon-stretch': { targets: ['Glutes'], squeeze: 'Feel the deep stretch in the front-leg glute.' },
};

export function getMuscleFocus(id: string): MuscleFocus | undefined {
  return EXERCISE_MUSCLES[id];
}

// Reduce volume gently early, add a touch later. Reps stay constant (some are strings).
function scaleForPhase(ex: Exercise, phase: Phase): Exercise {
  if (phase === 'foundation' && ex.sets > 2) {
    return { ...ex, sets: ex.sets - 1 };
  }
  return ex;
}

function pick<T>(arr: T[], dayOfWeek: number, offset = 0): T {
  return arr[(dayOfWeek + offset) % arr.length];
}

// Build the day's exercises + superset pairing for a given phase, rotating by day of week.
// Pairing rule: non-competing muscle groups go back-to-back, rest only after the pair.
function getDailyWorkout(
  dayOfWeek: number,
  phase: Phase
): { exercises: Exercise[]; supersets: SupersetPair[] } {
  // ── CORE & ABS ──────────────────────────────────────────────
  // McGill Big 3 is the daily foundation; a rotating 4th adds direct ab work.
  const abPool: Exercise[] =
    phase === 'foundation'
      ? [DEAD_BUG, FRONT_PLANK]
      : [DEAD_BUG, FRONT_PLANK, HOLLOW_HOLD, PALLOF_PRESS];
  const abMove = pick(abPool, dayOfWeek);
  const core: Exercise[] = [MCGILL_CURL_UP, MCGILL_SIDE_PLANK, MCGILL_BIRD_DOG, abMove];

  // ── STRENGTH (glute-focused) ────────────────────────────────
  // 1 hinge + 1 bridge/thrust + 1 banded accessory.
  const hingePool: Exercise[] =
    phase === 'foundation'
      ? [KETTLEBELL_DEADLIFT, DB_RDL, BOX_SQUAT]
      : phase === 'build'
        ? [KETTLEBELL_DEADLIFT, DB_RDL, BOX_SQUAT, GOBLET_SQUAT, B_STANCE_RDL]
        : [KETTLEBELL_DEADLIFT, DB_RDL, B_STANCE_RDL, GOBLET_SQUAT, KETTLEBELL_SWING, FARMERS_CARRY];

  const bridgePool: Exercise[] =
    phase === 'foundation'
      ? [GLUTE_BRIDGE, BAND_GLUTE_BRIDGE]
      : phase === 'build'
        ? [GLUTE_BRIDGE, BAND_GLUTE_BRIDGE, HIP_THRUST]
        : [HIP_THRUST, SINGLE_LEG_GLUTE_BRIDGE, BAND_GLUTE_BRIDGE];

  const bandPool: Exercise[] = [BAND_LATERAL_WALK, BAND_CLAMSHELL, BAND_MONSTER_WALK, BAND_KICKBACK];

  const hinge = pick(hingePool, dayOfWeek);
  const bridge = pick(bridgePool, dayOfWeek, 1);
  const band = pick(bandPool, dayOfWeek);
  const strength: Exercise[] = [hinge, bridge, band];

  // ── ARMS ────────────────────────────────────────────────────
  // Foundation: one gentle move. Later: two rotating dumbbell/bodyweight moves.
  const arms: Exercise[] = [];
  if (phase === 'foundation') {
    arms.push(pick([BAND_PULL_APART, PUSH_UP], dayOfWeek));
  } else {
    const armPool = [
      DB_BICEP_CURL,
      DB_OVERHEAD_PRESS,
      DB_TRICEP_KICKBACK,
      DB_LATERAL_RAISE,
      PUSH_UP,
      BAND_PULL_APART,
    ];
    arms.push(pick(armPool, dayOfWeek), pick(armPool, dayOfWeek, 3));
  }

  // ── MOBILITY (cooldown — one stretch, the warmup covers the rest) ──
  const mobilityPool: Exercise[] = [COUCH_STRETCH, NINETY_NINETY, PIGEON_STRETCH, DEEP_SQUAT_HOLD];
  const mobility = [pick(mobilityPool, dayOfWeek)];

  // ── SUPERSETS ───────────────────────────────────────────────
  // Core pairs rest 20s; strength/arm pairs rest 30s. Anything unpaired
  // (second arm move, mobility) runs as straight sets.
  const supersets: SupersetPair[] = [
    { exerciseIds: [MCGILL_CURL_UP.id, MCGILL_SIDE_PLANK.id], restAfterPair: 20 },
    { exerciseIds: [MCGILL_BIRD_DOG.id, abMove.id], restAfterPair: 20 },
    { exerciseIds: [hinge.id, band.id], restAfterPair: 30 },
    { exerciseIds: [bridge.id, arms[0].id], restAfterPair: 30 },
  ];

  const exercises = [...core, ...strength, ...arms, ...mobility].map((ex) =>
    scaleForPhase(ex, phase)
  );

  return { exercises, supersets };
}

export function getWorkoutForDate(date: Date, startDate: Date): WorkoutDay {
  const dayOfWeek = date.getDay();
  const week = getCurrentWeekFor(date, startDate);
  const phase = getPhaseForWeek(week);
  const { exercises, supersets } = getDailyWorkout(dayOfWeek, phase);

  return {
    type: 'workout',
    warmup: WARMUP,
    exercises,
    supersets,
    finisher: getFinisherForDate(dayOfWeek, phase),
  };
}

// Week number (1-52) for an arbitrary date relative to start.
function getCurrentWeekFor(date: Date, startDate: Date): number {
  const diffDays = Math.floor((date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const week = Math.floor(diffDays / 7) + 1;
  return Math.min(Math.max(week, 1), 52);
}

// Current week (1-52) relative to today.
export function getCurrentWeek(startDate: Date): number {
  return getCurrentWeekFor(new Date(), startDate);
}

// All exercises for a workout (for counting)
export function getAllExercises(workout: WorkoutDay): (Exercise | WarmupExercise)[] {
  return [...workout.warmup, ...workout.exercises];
}

// No prescribed weights — go by feel, add load when reps feel easy.
export function getSuggestedWeight(_week: number, _exerciseId?: string): number {
  return 0;
}

// Coaching tips — rotate per phase.
export interface CoachingTip {
  id: string;
  title: string;
  message: string;
}

export const COACHING_TIPS: CoachingTip[] = [
  {
    id: 'consistency',
    title: '20 Minutes',
    message: 'Show up daily. Twenty minutes beats an hour you skip.',
  },
  {
    id: 'glutes',
    title: 'Squeeze',
    message: 'On every bridge and thrust, squeeze the glutes hard at the top.',
  },
  {
    id: 'knees',
    title: 'Knees First',
    message: 'Hinge from the hips, cap your squat depth. Pain is a stop sign, not a challenge.',
  },
  {
    id: 'tempo',
    title: 'Slow Wins',
    message: 'Lower slower than you lift. Control builds tone.',
  },
  {
    id: 'progress',
    title: 'Add Slowly',
    message: 'When the last rep feels easy, add a little load next week.',
  },
];

// ═══════════════════════════════════════════════════════════════════
// GUIDED SESSION — flatten a workout into timed work/rest steps
// ═══════════════════════════════════════════════════════════════════

export type SessionStep =
  | { kind: 'warmup'; id: string; name: string; cue: string; duration: number }
  | {
      kind: 'work';
      id: string;
      name: string;
      cue: string;
      set: number;
      sets: number;
      reps: number | string;
      hold?: number;
      isLastSet: boolean;
      supersetLabel?: string; // e.g. "Superset A · Round 2 of 3"
    }
  | { kind: 'rest'; duration: number; nextName: string }
  | { kind: 'finisher-intro'; finisher: Finisher }
  | { kind: 'finisher-work'; finisher: Finisher; round: number; rounds: number; duration: number }
  | { kind: 'finisher-rest'; finisher: Finisher; round: number; rounds: number; duration: number }
  | { kind: 'finisher-score'; finisher: Finisher };

// Display name of a step, used for "Next: …" labels on rest screens.
function stepName(step: SessionStep): string {
  switch (step.kind) {
    case 'warmup':
    case 'work':
      return step.name;
    case 'finisher-intro':
    case 'finisher-work':
      return `Finisher: ${step.finisher.name}`;
    case 'finisher-score':
      return 'Log your score';
    default:
      return '';
  }
}

// Build the full ordered step list:
//   warm-up → supersets (A1 → A2 → rest, per round) → straight-set extras
//   → finisher (intro → timed intervals/AMRAP → score) → cooldown stretch.
export function buildSessionSteps(workout: WorkoutDay): SessionStep[] {
  const steps: SessionStep[] = [];

  // 1) Warm-up
  for (const w of workout.warmup) {
    steps.push({ kind: 'warmup', id: w.id, name: w.name, cue: w.cue, duration: w.duration });
  }

  const byId = new Map(workout.exercises.map((e) => [e.id, e]));
  const paired = new Set(workout.supersets.flatMap((p) => p.exerciseIds));

  const pushWork = (ex: Exercise, set: number, supersetLabel?: string) => {
    steps.push({
      kind: 'work',
      id: ex.id,
      name: ex.name,
      cue: ex.cue,
      set,
      sets: ex.sets,
      reps: ex.reps,
      hold: ex.hold,
      isLastSet: set === ex.sets,
      supersetLabel,
    });
  };

  // 2) Supersets — A1 then A2 back-to-back, rest only after the pair.
  const letters = ['A', 'B', 'C', 'D', 'E'];
  workout.supersets.forEach((pair, pairIdx) => {
    const a = byId.get(pair.exerciseIds[0]);
    const b = byId.get(pair.exerciseIds[1]);
    if (!a || !b) return;
    const rounds = Math.max(a.sets, b.sets);
    const letter = letters[pairIdx] ?? String(pairIdx + 1);
    for (let r = 1; r <= rounds; r++) {
      const label = `Superset ${letter} · Round ${r} of ${rounds}`;
      if (r <= a.sets) pushWork(a, r, label);
      if (r <= b.sets) pushWork(b, r, label);
      steps.push({ kind: 'rest', duration: pair.restAfterPair, nextName: '' });
    }
  });

  // 3) Unpaired exercises (extra arm move) — straight sets. Mobility waits for the cooldown.
  const extras = workout.exercises.filter((e) => !paired.has(e.id) && e.block !== 'mobility');
  for (const ex of extras) {
    for (let s = 1; s <= ex.sets; s++) {
      pushWork(ex, s);
      const rest = ex.restBetweenSets ?? 0;
      if (rest > 0) steps.push({ kind: 'rest', duration: rest, nextName: '' });
    }
  }

  // 4) Finisher — the scored sweat block.
  if (workout.finisher) {
    const f = workout.finisher;
    steps.push({ kind: 'finisher-intro', finisher: f });
    if (f.format === 'intervals') {
      const rounds = f.rounds ?? 1;
      for (let r = 1; r <= rounds; r++) {
        steps.push({ kind: 'finisher-work', finisher: f, round: r, rounds, duration: f.workSeconds ?? 30 });
        if (r < rounds) {
          steps.push({ kind: 'finisher-rest', finisher: f, round: r, rounds, duration: f.restSeconds ?? 15 });
        }
      }
    } else {
      steps.push({ kind: 'finisher-work', finisher: f, round: 1, rounds: 1, duration: f.durationSeconds ?? 240 });
    }
    steps.push({ kind: 'finisher-score', finisher: f });
  }

  // 5) Cooldown — the day's mobility stretch(es).
  const cooldown = workout.exercises.filter((e) => e.block === 'mobility');
  for (const ex of cooldown) {
    for (let s = 1; s <= ex.sets; s++) {
      pushWork(ex, s);
    }
  }

  // Fill in "Next: …" for rests, and drop a trailing rest if it ended up last.
  const filled: SessionStep[] = [];
  for (let i = 0; i < steps.length; i++) {
    const s = steps[i];
    if (s.kind === 'rest') {
      const next = steps.slice(i + 1).find((n) => n.kind !== 'rest');
      if (!next) continue; // nothing follows — drop the rest
      filled.push({ ...s, nextName: stepName(next) });
    } else {
      filled.push(s);
    }
  }

  return filled;
}

export function getCoachingTip(week: number): CoachingTip | null {
  const tipIndex = (week - 1) % COACHING_TIPS.length;
  return COACHING_TIPS[tipIndex];
}

export { WARMUP, PHASE_ORDER };
