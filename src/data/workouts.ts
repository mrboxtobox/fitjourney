// Focused Legs & Core 52-Week Program
// Simple 5×5 format with progressive overload
// Includes compound movements for full-body strength

export interface Exercise {
  id: string;
  name: string;
  description: string;
  sets: number;
  reps: number | string;
  duration?: number; // seconds for warmup
  restBetweenSets?: number; // seconds
  tips: string[];
  equipment?: string[];
  primaryMuscles: string[];
  secondaryMuscles: string[];
  isCompound?: boolean; // multi-joint movement
}

export interface WarmupExercise {
  id: string;
  name: string;
  duration: number; // seconds
  description: string;
}

export interface WorkoutDay {
  type: 'workout' | 'rest';
  title: string;
  subtitle: string;
  estimatedTime: number;
  warmup: WarmupExercise[];
  exercises: Exercise[];
}

// The 6 Core Exercises - Legs, Core & Compound Movements
export const EXERCISES: Exercise[] = [
  {
    id: 'goblet-squat',
    name: 'Goblet Squat',
    description: 'Hold kettlebell at chest, squat deep with chest up. Push through heels to stand. This compound movement builds total leg strength.',
    sets: 5,
    reps: 5,
    restBetweenSets: 90,
    tips: [
      'Keep elbows inside knees at bottom',
      'Push knees out over toes',
      'Keep chest tall throughout',
    ],
    equipment: ['kettlebell'],
    primaryMuscles: ['Quads', 'Glutes'],
    secondaryMuscles: ['Core', 'Upper Back'],
    isCompound: true,
  },
  {
    id: 'kettlebell-swing',
    name: 'Kettlebell Swing',
    description: 'Hinge and swing the bell between legs, then explosively drive hips forward. The king of compound movements—works your entire posterior chain.',
    sets: 5,
    reps: 10,
    restBetweenSets: 60,
    tips: [
      'Power comes from hips, not arms',
      'Squeeze glutes hard at the top',
      'Keep arms relaxed, bell floats up',
    ],
    equipment: ['kettlebell'],
    primaryMuscles: ['Glutes', 'Hamstrings'],
    secondaryMuscles: ['Core', 'Shoulders', 'Back'],
    isCompound: true,
  },
  {
    id: 'romanian-deadlift',
    name: 'Romanian Deadlift',
    description: 'Hinge at hips with soft knees, lower weight along legs. Feel the hamstring stretch, then drive hips forward to stand.',
    sets: 5,
    reps: 5,
    restBetweenSets: 90,
    tips: [
      'Keep back flat, not rounded',
      'Weight stays close to legs',
      'Feel the stretch in hamstrings',
    ],
    equipment: ['kettlebell'],
    primaryMuscles: ['Hamstrings', 'Glutes'],
    secondaryMuscles: ['Lower Back', 'Core'],
    isCompound: true,
  },
  {
    id: 'reverse-lunge',
    name: 'Reverse Lunge',
    description: 'Hold kettlebell at chest, step back into lunge. Knee nearly touches floor, then push through front heel to stand.',
    sets: 5,
    reps: '5 each side',
    restBetweenSets: 90,
    tips: [
      'Keep torso upright',
      'Front knee tracks over toes',
      'Control the descent',
    ],
    equipment: ['kettlebell'],
    primaryMuscles: ['Quads', 'Glutes'],
    secondaryMuscles: ['Hamstrings', 'Core'],
    isCompound: true,
  },
  {
    id: 'glute-bridge',
    name: 'Weighted Glute Bridge',
    description: 'Lie on back with kettlebell on hips. Drive hips up squeezing glutes hard. Hold at top briefly.',
    sets: 5,
    reps: 8,
    restBetweenSets: 60,
    tips: [
      'Squeeze glutes hard at top',
      'Don\'t hyperextend lower back',
      'Drive through heels',
    ],
    equipment: ['kettlebell'],
    primaryMuscles: ['Glutes', 'Hamstrings'],
    secondaryMuscles: ['Core'],
    isCompound: false,
  },
  {
    id: 'dead-bug',
    name: 'Dead Bug',
    description: 'Lie on back, extend opposite arm and leg while keeping lower back pressed firmly down. Core stability is the foundation of all movement.',
    sets: 3,
    reps: '8 each side',
    restBetweenSets: 45,
    tips: [
      'Press lower back into floor',
      'Move slowly and controlled',
      'Breathe out as you extend',
    ],
    primaryMuscles: ['Core', 'Abs'],
    secondaryMuscles: ['Hip Flexors'],
    isCompound: false,
  },
];

// Warmup routine - essential for injury prevention and performance
export const WARMUP: WarmupExercise[] = [
  {
    id: 'leg-swings',
    name: 'Leg Swings',
    duration: 30,
    description: 'Front to back, 10 each leg',
  },
  {
    id: 'hip-circles',
    name: 'Hip Circles',
    duration: 30,
    description: '10 circles each direction',
  },
  {
    id: 'bodyweight-squats',
    name: 'Bodyweight Squats',
    duration: 60,
    description: '10 slow squats',
  },
  {
    id: 'glute-activation',
    name: 'Glute Activation',
    duration: 30,
    description: '10 glute bridges, no weight',
  },
];

// Phase structure for 52 weeks
export type Phase = 'foundation' | 'building' | 'strength' | 'power';

export interface PhaseInfo {
  name: string;
  weeks: string;
  description: string;
  focus: string[];
}

export const PHASES: Record<Phase, PhaseInfo> = {
  foundation: {
    name: 'Foundation',
    weeks: '1-13',
    description: 'Start bodyweight, add light kettlebell by week 5',
    focus: ['Perfect technique', 'Build consistency', 'Establish habit'],
  },
  building: {
    name: 'Building',
    weeks: '14-26',
    description: 'Progressively add kettlebell weight each week',
    focus: ['Add 2.5-5 lb weekly', 'Focus on control', 'Build strength base'],
  },
  strength: {
    name: 'Strength',
    weeks: '27-39',
    description: 'Push to heavier weights with solid form',
    focus: ['Challenge yourself', 'Proper rest', 'Nutrition matters'],
  },
  power: {
    name: 'Power',
    weeks: '40-52',
    description: 'Peak performance and maintain gains',
    focus: ['Test maxes', 'Refine form', 'Celebrate progress'],
  },
};

// Get phase for a given week
function getPhase(week: number): Phase {
  if (week <= 13) return 'foundation';
  if (week <= 26) return 'building';
  if (week <= 39) return 'strength';
  return 'power';
}

// Coaching tips for beginners
export interface CoachingTip {
  id: string;
  title: string;
  message: string;
  showOnPhase?: Phase;
}

export const COACHING_TIPS: CoachingTip[] = [
  {
    id: 'warmup-importance',
    title: 'Why Warm Up?',
    message: 'Warming up increases blood flow to muscles, improves joint mobility, and reduces injury risk. Never skip it—your body will thank you.',
    showOnPhase: 'foundation',
  },
  {
    id: 'compound-power',
    title: 'Compound Movements',
    message: 'Exercises like squats and swings work multiple muscle groups at once. They build real-world strength and burn more calories than isolation exercises.',
    showOnPhase: 'foundation',
  },
  {
    id: 'form-first',
    title: 'Form Over Weight',
    message: 'Master the movement pattern with light weight first. Good form prevents injury and builds a strong foundation for heavier lifts later.',
    showOnPhase: 'foundation',
  },
  {
    id: 'progressive-overload',
    title: 'Progressive Overload',
    message: 'Muscles grow when challenged. Each week, aim to add a small amount of weight or an extra rep. Consistency beats intensity.',
    showOnPhase: 'building',
  },
  {
    id: 'rest-matters',
    title: 'Rest is Training',
    message: 'Your muscles grow during rest, not during the workout. Get 7-8 hours of sleep and never train the same muscles two days in a row.',
    showOnPhase: 'building',
  },
  {
    id: 'nutrition-fuel',
    title: 'Fuel Your Gains',
    message: 'Protein rebuilds muscle. Aim for 0.7-1g per pound of body weight daily. Eat within 2 hours after training for optimal recovery.',
    showOnPhase: 'strength',
  },
  {
    id: 'listen-to-body',
    title: 'Listen to Your Body',
    message: 'Sharp pain is a warning sign—stop immediately. Muscle soreness is normal, joint pain is not. Know the difference.',
    showOnPhase: 'strength',
  },
  {
    id: 'celebrate-progress',
    title: 'Celebrate Progress',
    message: 'You\'ve come far! Compare yourself to where you started, not to others. Every rep is an investment in a stronger future.',
    showOnPhase: 'power',
  },
];

// Get coaching tip for the current session
export function getCoachingTip(week: number): CoachingTip | null {
  const phase = getPhase(week);
  const phaseTips = COACHING_TIPS.filter(tip => tip.showOnPhase === phase);
  if (phaseTips.length === 0) return null;

  // Rotate through tips based on week
  const tipIndex = (week - 1) % phaseTips.length;
  return phaseTips[tipIndex];
}

// Weekly schedule: Mon/Wed/Fri workout, rest days in between
export function getWorkoutForDate(date: Date, _startDate: Date): WorkoutDay {
  const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.

  // Workout days: Monday (1), Wednesday (3), Friday (5)
  const isWorkoutDay = dayOfWeek === 1 || dayOfWeek === 3 || dayOfWeek === 5;

  if (isWorkoutDay) {
    return {
      type: 'workout',
      title: 'Legs & Core',
      subtitle: '5×5 strength training',
      estimatedTime: 35,
      warmup: WARMUP,
      exercises: EXERCISES,
    };
  }

  return {
    type: 'rest',
    title: 'Rest Day',
    subtitle: dayOfWeek === 0 || dayOfWeek === 6 ? 'Full recovery' : 'Active recovery',
    estimatedTime: 0,
    warmup: [],
    exercises: [],
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

export function getPhaseInfo(week: number): PhaseInfo {
  return PHASES[getPhase(week)];
}

// Suggested starting weights by week (in lbs)
export function getSuggestedWeight(week: number, _exerciseId?: string): number {
  const phase = getPhase(week);

  if (phase === 'foundation') {
    // Weeks 1-4: bodyweight
    // Weeks 5-13: gradually introduce weight
    if (week <= 4) return 0;
    const progressWeeks = week - 4;
    return Math.min(progressWeeks * 5, 25); // Up to 25 lbs by week 13
  }

  if (phase === 'building') {
    // Weeks 14-26: 25-50 lbs, adding ~2 lbs/week
    const progressWeeks = week - 13;
    return 25 + (progressWeeks * 2);
  }

  if (phase === 'strength') {
    // Weeks 27-39: 50-75 lbs
    const progressWeeks = week - 26;
    return 50 + (progressWeeks * 2);
  }

  // Power phase: 75+ lbs
  const progressWeeks = week - 39;
  return 75 + (progressWeeks * 2);
}
