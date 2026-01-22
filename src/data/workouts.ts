// Idaraya - Minimalist Movement Practice
// 20-minute daily workout
// Focus: Core strength, legs, hip mobility
// Equipment: Bodyweight + Kettlebell only

export interface Exercise {
  id: string;
  name: string;
  cue: string; // Single line coaching cue
  sets: number;
  reps: number | string;
  hold?: number; // seconds for static holds
  restBetweenSets?: number; // seconds of rest between sets
  equipment?: string[];
}

export interface WarmupExercise {
  id: string;
  name: string;
  duration: number;
  cue: string;
}

export interface WorkoutDay {
  type: 'workout' | 'rest';
  exercises: Exercise[];
  warmup: WarmupExercise[];
}

// ═══════════════════════════════════════════════════════════════════
// McGILL BIG 3 - Spine Health Foundation (~4 min)
// ═══════════════════════════════════════════════════════════════════

const MCGILL_CURL_UP: Exercise = {
  id: 'mcgill-curl-up',
  name: 'Curl-Up',
  cue: 'Hands under low back. Lift head and shoulders slightly. Hold.',
  sets: 3,
  reps: '10s hold',
  hold: 10,
  restBetweenSets: 10,
};

const MCGILL_SIDE_PLANK: Exercise = {
  id: 'mcgill-side-plank',
  name: 'Side Plank',
  cue: 'Elbow under shoulder. Hips stacked. Hold. Both sides.',
  sets: 2,
  reps: '10s each',
  hold: 10,
  restBetweenSets: 10,
};

const MCGILL_BIRD_DOG: Exercise = {
  id: 'mcgill-bird-dog',
  name: 'Bird Dog',
  cue: 'Opposite arm and leg extend. Square hips. Slow.',
  sets: 2,
  reps: '6 each',
  restBetweenSets: 10,
};

// ═══════════════════════════════════════════════════════════════════
// STRENGTH - Goblet Squat & Farmer's Carry (~8 min)
// ═══════════════════════════════════════════════════════════════════

const GOBLET_SQUAT: Exercise = {
  id: 'goblet-squat',
  name: 'Goblet Squat',
  cue: 'Bell at chest. Elbows between knees. Sit deep.',
  sets: 3,
  reps: 8,
  restBetweenSets: 45,
  equipment: ['kettlebell'],
};

const FARMERS_CARRY: Exercise = {
  id: 'farmers-carry',
  name: "Farmer's Carry",
  cue: 'Shoulders packed. Walk tall. 40 steps.',
  sets: 2,
  reps: '40 steps',
  restBetweenSets: 30,
  equipment: ['kettlebell'],
};

const KETTLEBELL_DEADLIFT: Exercise = {
  id: 'kb-deadlift',
  name: 'Kettlebell Deadlift',
  cue: 'Hinge at hips. Flat back. Bell between feet.',
  sets: 3,
  reps: 8,
  restBetweenSets: 45,
  equipment: ['kettlebell'],
};

const KETTLEBELL_SWING: Exercise = {
  id: 'kb-swing',
  name: 'Kettlebell Swing',
  cue: 'Hinge, snap hips. Power from glutes, not arms.',
  sets: 3,
  reps: 10,
  restBetweenSets: 30,
  equipment: ['kettlebell'],
};

// ═══════════════════════════════════════════════════════════════════
// RESISTANCE BAND EXERCISES - Upper Body & Activation (~5 min)
// ═══════════════════════════════════════════════════════════════════

const BAND_PULL_APART: Exercise = {
  id: 'band-pull-apart',
  name: 'Band Pull-Apart',
  cue: 'Arms straight ahead. Pull band to chest. Squeeze shoulder blades.',
  sets: 3,
  reps: 15,
  restBetweenSets: 20,
  equipment: ['resistance band'],
};

const BAND_FACE_PULL: Exercise = {
  id: 'band-face-pull',
  name: 'Band Face Pull',
  cue: 'Anchor high. Pull to face. Elbows high, external rotate.',
  sets: 3,
  reps: 12,
  restBetweenSets: 20,
  equipment: ['resistance band'],
};

const BAND_PALLOF_PRESS: Exercise = {
  id: 'band-pallof-press',
  name: 'Pallof Press',
  cue: 'Anchor at chest. Press out. Resist rotation.',
  sets: 2,
  reps: '10 each',
  restBetweenSets: 20,
  equipment: ['resistance band'],
};

const BAND_SHOULDER_DISLOCATE: Exercise = {
  id: 'band-shoulder-dislocate',
  name: 'Shoulder Dislocate',
  cue: 'Wide grip. Arms straight. Arc over head and behind.',
  sets: 2,
  reps: 10,
  restBetweenSets: 15,
  equipment: ['resistance band'],
};

const BAND_MONSTER_WALK: Exercise = {
  id: 'band-monster-walk',
  name: 'Monster Walk',
  cue: 'Band above knees. Quarter squat. Step diagonal.',
  sets: 2,
  reps: '10 each',
  restBetweenSets: 20,
  equipment: ['resistance band'],
};

// ═══════════════════════════════════════════════════════════════════
// HIP MOBILITY - Gabby Thomas / Squat University Inspired (~5 min)
// ═══════════════════════════════════════════════════════════════════

const NINETY_NINETY: Exercise = {
  id: '90-90',
  name: '90/90 Hip Stretch',
  cue: 'Both knees at 90°. Tall spine. Rotate to each side.',
  sets: 1,
  reps: '30s each',
  hold: 30,
  restBetweenSets: 0,
};

const DEEP_SQUAT_HOLD: Exercise = {
  id: 'deep-squat-hold',
  name: 'Deep Squat Hold',
  cue: 'Heels down. Chest up. Breathe.',
  sets: 1,
  reps: '60s',
  hold: 60,
  restBetweenSets: 0,
};

const COUCH_STRETCH: Exercise = {
  id: 'couch-stretch',
  name: 'Couch Stretch',
  cue: 'Back knee to wall. Squeeze glute. Tall torso.',
  sets: 1,
  reps: '30s each',
  hold: 30,
  restBetweenSets: 0,
};

const PIGEON_STRETCH: Exercise = {
  id: 'pigeon-stretch',
  name: 'Pigeon Stretch',
  cue: 'Front shin parallel. Sink hips. Breathe deep.',
  sets: 1,
  reps: '45s each',
  hold: 45,
  restBetweenSets: 0,
};

// ═══════════════════════════════════════════════════════════════════
// WARMUP (~3 min)
// ═══════════════════════════════════════════════════════════════════

const WARMUP: WarmupExercise[] = [
  {
    id: 'cat-cow',
    name: 'Cat-Cow',
    duration: 45,
    cue: 'Breathe. Round and arch spine.',
  },
  {
    id: 'leg-swings',
    name: 'Leg Swings',
    duration: 30,
    cue: 'Front-back, 10 each leg',
  },
  {
    id: 'hip-circles',
    name: 'Hip Circles',
    duration: 30,
    cue: '10 circles each direction',
  },
  {
    id: 'glute-bridge-warmup',
    name: 'Glute Bridge',
    duration: 30,
    cue: '10 reps, squeeze at top',
  },
];

// ═══════════════════════════════════════════════════════════════════
// DAILY 20-MINUTE WORKOUT STRUCTURE
// ═══════════════════════════════════════════════════════════════════

// All exercises available
export const EXERCISES: Exercise[] = [
  MCGILL_CURL_UP,
  MCGILL_SIDE_PLANK,
  MCGILL_BIRD_DOG,
  GOBLET_SQUAT,
  FARMERS_CARRY,
  KETTLEBELL_DEADLIFT,
  KETTLEBELL_SWING,
  BAND_PULL_APART,
  BAND_FACE_PULL,
  BAND_PALLOF_PRESS,
  BAND_SHOULDER_DISLOCATE,
  BAND_MONSTER_WALK,
  NINETY_NINETY,
  DEEP_SQUAT_HOLD,
  COUCH_STRETCH,
  PIGEON_STRETCH,
];

// Daily workout - ~20 minutes total
// Warmup: 3 min
// McGill Big 3: 4 min
// Strength (2 exercises): 8 min
// Accessory (bands): 2 min
// Mobility (2 exercises): 3 min
function getDailyWorkout(dayOfWeek: number): Exercise[] {
  // McGill Big 3 every day (spine health is non-negotiable)
  const mcgillBig3 = [MCGILL_CURL_UP, MCGILL_SIDE_PLANK, MCGILL_BIRD_DOG];

  // Rotate strength exercises
  // Days 0,2,4,6 (Sun,Tue,Thu,Sat): Goblet Squat + Farmer's Carry
  // Days 1,3,5 (Mon,Wed,Fri): KB Deadlift + KB Swing
  const isDeadliftDay = dayOfWeek === 1 || dayOfWeek === 3 || dayOfWeek === 5;
  const strength = isDeadliftDay
    ? [KETTLEBELL_DEADLIFT, KETTLEBELL_SWING]
    : [GOBLET_SQUAT, FARMERS_CARRY];

  // Rotate resistance band exercises
  // Days 0,3,6: Upper back focus (Pull-Apart + Face Pull)
  // Days 1,4: Core anti-rotation (Pallof Press + Shoulder Dislocate)
  // Days 2,5: Lower body activation (Monster Walk + Pull-Apart)
  let bandWork: Exercise[];
  if (dayOfWeek === 0 || dayOfWeek === 3 || dayOfWeek === 6) {
    bandWork = [BAND_PULL_APART, BAND_FACE_PULL];
  } else if (dayOfWeek === 1 || dayOfWeek === 4) {
    bandWork = [BAND_PALLOF_PRESS, BAND_SHOULDER_DISLOCATE];
  } else {
    bandWork = [BAND_MONSTER_WALK, BAND_PULL_APART];
  }

  // Rotate mobility exercises
  // Alternate between 90/90 + Deep Squat and Couch + Pigeon
  const isPigeonDay = dayOfWeek % 2 === 0;
  const mobility = isPigeonDay
    ? [COUCH_STRETCH, PIGEON_STRETCH]
    : [NINETY_NINETY, DEEP_SQUAT_HOLD];

  return [...mcgillBig3, ...strength, ...bandWork, ...mobility];
}

// Every day is a workout day - 20 minutes daily
export function getWorkoutForDate(date: Date, _startDate: Date): WorkoutDay {
  const dayOfWeek = date.getDay();

  return {
    type: 'workout',
    warmup: WARMUP,
    exercises: getDailyWorkout(dayOfWeek),
  };
}

// Get current week (1-52)
export function getCurrentWeek(startDate: Date): number {
  const now = new Date();
  const diffTime = now.getTime() - startDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const week = Math.floor(diffDays / 7) + 1;
  return Math.min(Math.max(week, 1), 52);
}

// Get all exercises for a workout (for counting)
export function getAllExercises(workout: WorkoutDay): (Exercise | WarmupExercise)[] {
  return [...workout.warmup, ...workout.exercises];
}

// Simplified phase info
export type Phase = 'practice';

export interface PhaseInfo {
  name: string;
  weeks: string;
  description: string;
  focus: string[];
}

export const PHASES: Record<Phase, PhaseInfo> = {
  practice: {
    name: 'Practice',
    weeks: '1-52',
    description: '20 minutes daily',
    focus: ['McGill Big 3', 'Kettlebell', 'Resistance Bands', 'Hip Mobility'],
  },
};

export function getPhaseInfo(_week: number): PhaseInfo {
  return PHASES.practice;
}

// No weight suggestions for minimalist approach
export function getSuggestedWeight(_week: number, _exerciseId?: string): number {
  return 0;
}

// Coaching tips - minimal
export interface CoachingTip {
  id: string;
  title: string;
  message: string;
}

export const COACHING_TIPS: CoachingTip[] = [
  {
    id: 'consistency',
    title: '20 Minutes',
    message: 'Show up daily. 20 minutes. No excuses.',
  },
  {
    id: 'spine-first',
    title: 'Spine Health',
    message: 'McGill Big 3 protects your back. Every day.',
  },
  {
    id: 'mobility',
    title: 'Mobility',
    message: 'You cannot strengthen what you cannot access.',
  },
];

export function getCoachingTip(week: number): CoachingTip | null {
  const tipIndex = (week - 1) % COACHING_TIPS.length;
  return COACHING_TIPS[tipIndex];
}

export { WARMUP };
