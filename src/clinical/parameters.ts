// ═══════════════════════════════════════════════════════════════════════════
// CLINICAL PARAMETERS — the single file a reviewing clinician edits.
// ═══════════════════════════════════════════════════════════════════════════
//
// Everything here is a *judgement call* about dose or safety. Nothing here is
// implementation detail. If a physiotherapist disagrees with how this program loads
// someone, the disagreement is expressible as a diff to this file alone.
//
// The rationale for each block is recorded in CLINICAL.md at the repo root. Please
// keep the two in step: a changed number with an unchanged rationale is worse than
// either alone.
//
// What is NOT here, and why:
//   - Coaching prose (movement standards, common faults) lives in src/data/exercises.ts.
//     It is clinical content, but it is long-form text, not dose.
//   - Which movement pattern an exercise belongs to is declared with the exercise, since
//     it is a property of the movement rather than of the program.
//   - The engine that *applies* these numbers is src/lib/progression.ts. It reads them;
//     it never hardcodes them. Guard tests in progression.test.ts prove that by running
//     the engine against modified parameters and asserting the behaviour moves.

// ─── Movement taxonomy ──────────────────────────────────────────────────────
//
// Patterns, not muscles. The program trains a pattern each day; the progression engine
// decides which variant of that pattern (which "rung") the user has earned.

export type MovementPattern =
  // core — anti-movement stability
  | 'trunkFlexion'
  | 'antiExtension'
  | 'antiRotation'
  | 'antiLateralFlexion'
  // lower body
  | 'hinge'
  | 'bridge'
  | 'squat'
  | 'abduction'
  | 'hipExtension'
  | 'carry'
  // upper body
  | 'horizontalPush'
  | 'horizontalPull'
  | 'verticalPush'
  | 'elbowFlexion'
  | 'elbowExtension'
  | 'lateralRaise'
  | 'scapularRetraction'
  // stretches — held, never progressed
  | 'mobility';

export type PainRegion = 'knee' | 'lowBack' | 'hip' | 'shoulder' | 'other';

export type WeightUnit = 'kg' | 'lbs';

// ─── 1. The symptom gate ────────────────────────────────────────────────────
//
// Pain scored on the 0–10 Numeric Pain Rating Scale, reported by the user after the
// session, and again the following morning.
//
// The bands below encode the "acceptable pain" convention used to supervise loaded
// rehabilitation: symptoms up to a low threshold during loading are tolerable and do
// not indicate harm; symptoms must settle back to baseline within 24 hours. Anything
// above the ceiling, or anything that has not settled by the next morning, means the
// last dose exceeded what the tissue could tolerate.
//
// This gate OUTRANKS every performance rule. A textbook session that hurt too much
// still regresses.

export interface PainBands {
  /** Pain at or below this during the session is acceptable. Training proceeds. */
  acceptableMax: number;
  /** Pain above `acceptableMax` and at or below this holds the current dose. */
  cautionMax: number;
  /**
   * Pain at or above this the FOLLOWING MORNING means it did not settle within 24
   * hours, and the exercise regresses regardless of how it felt at the time.
   */
  nextMorningRegressAtOrAbove: number;
}

export const PAIN_BANDS: PainBands = {
  acceptableMax: 3,
  cautionMax: 5,
  nextMorningRegressAtOrAbove: 4,
};

// Which complaints gate which patterns.
//
// A sore shoulder must not hold back a glute bridge, and a sore knee must not hold
// back a band pull-apart — otherwise one irritable joint freezes the whole program and
// the user learns to stop reporting pain. `other` is deliberately unmapped, so an
// unlocalised complaint gates everything. That is the safe default.
export const PATTERN_PAIN_REGIONS: Record<MovementPattern, PainRegion[]> = {
  trunkFlexion: ['lowBack'],
  antiExtension: ['lowBack', 'shoulder'],
  antiRotation: ['lowBack', 'shoulder'],
  antiLateralFlexion: ['lowBack', 'shoulder'],
  hinge: ['lowBack', 'hip'],
  bridge: ['lowBack', 'hip'],
  squat: ['knee', 'hip', 'lowBack'],
  abduction: ['knee', 'hip'],
  hipExtension: ['lowBack', 'hip'],
  carry: ['knee', 'lowBack', 'shoulder'],
  horizontalPush: ['shoulder'],
  horizontalPull: ['shoulder', 'lowBack'],
  verticalPush: ['shoulder', 'lowBack'],
  elbowFlexion: ['shoulder'],
  elbowExtension: ['shoulder'],
  lateralRaise: ['shoulder'],
  scapularRetraction: ['shoulder'],
  mobility: [],
};

// ─── 2. Autoregulation ──────────────────────────────────────────────────────
//
// RIR ("reps in reserve") is how the user reports effort: how many more repetitions
// they could have completed with good form. It is the same construct as an RPE scale
// inverted (RPE 8 ≈ 2 RIR), phrased in the way untrained people answer most reliably.

export interface AutoregulationParameters {
  /**
   * Reps left in the tank the program aims for on the last set of a working exercise.
   * Two is the default: enough proximity to failure to drive adaptation, enough margin
   * that form does not degrade in an unsupervised setting.
   */
  defaultTargetRIR: number;
  /**
   * The minimum RIR on the final set for a session to count as "hit the target".
   * Reaching the top of the rep range only by grinding to failure (RIR 0) is not a
   * green light to add difficulty.
   */
  minRirToQualify: number;
  /**
   * Consecutive qualifying sessions at the top of the rep range before difficulty rises.
   * One good day is luck; two is adaptation.
   */
  sessionsAtTopOfRangeToAdvance: number;
}

export const AUTOREGULATION: AutoregulationParameters = {
  defaultTargetRIR: 2,
  minRirToQualify: 1,
  sessionsAtTopOfRangeToAdvance: 2,
};

// ─── 3. Detraining after a layoff ───────────────────────────────────────────
//
// A user who stops for two months must not resume at the dose they left. Strength is
// largely retained across a short break; it is not retained across a long one, and the
// tissue tolerance that made the dose safe decays faster than the strength does.
//
// The rule is deliberately blunt: after a grace period, each further block of days away
// costs one regression step, up to a cap. A regression step is the same operation the
// symptom gate uses — shed load, else drop a ladder rung, else reduce the target.
//
// These numbers are the crudest thing in this file. They are a conservative guess, not a
// derived result, and are the second thing a reviewer should challenge (after the pain
// bands). The direction is not in question; the magnitude is.

export interface DetrainingParameters {
  /** Days away before any dose reduction happens at all. */
  gracePeriodDays: number;
  /** After the grace period, one regression step per this many further days away. */
  daysPerRegressionStep: number;
  /** Never regress more than this many steps, however long the layoff. */
  maxRegressionSteps: number;
}

export const DETRAINING: DetrainingParameters = {
  gracePeriodDays: 14,
  daysPerRegressionStep: 14,
  maxRegressionSteps: 4,
};

// ─── 4. Progression increments ──────────────────────────────────────────────
//
// How much a single step of progress adds, per kind of prescription. A five-second
// jump on a hold is roughly proportional to one repetition on a rep-based lift.

export interface ProgressionSteps {
  reps: number;
  holdSeconds: number;
  steps: number;
}

export const PROGRESSION_STEPS: ProgressionSteps = {
  reps: 1,
  holdSeconds: 5,
  steps: 5,
};

// Smallest load jump available with the equipment this program assumes. Adjusting a
// bodyweight or banded exercise happens by variant or repetitions, never by load.
export const LOAD_INCREMENTS: Record<WeightUnit, { dumbbell: number; kettlebell: number }> = {
  kg: { dumbbell: 2.5, kettlebell: 4 },
  lbs: { dumbbell: 5, kettlebell: 8 },
};

// ─── 5. The training calendar ───────────────────────────────────────────────
//
// Volume — not difficulty — is what the calendar is allowed to control. Difficulty is
// entirely the engine's business.

export interface ScheduleParameters {
  /** Day of week (0 = Sunday) with no prescribed training. */
  restDayOfWeek: number;
  /** Every Nth week is a planned deload. */
  deloadEveryNWeeks: number;
  /** Sets removed per exercise during a deload week. Never below one set. */
  deloadSetReduction: number;
  /** Sets removed per exercise throughout the Foundation phase. */
  foundationSetReduction: number;
  /** Rounds removed from an interval finisher, per easing step (Foundation, deload). */
  finisherRoundReductionPerStep: number;
  /** Seconds removed from an AMRAP finisher, per easing step. */
  finisherSecondsReductionPerStep: number;
  /** An interval finisher never drops below this many rounds. */
  finisherMinRounds: number;
  /** An AMRAP finisher never drops below this many seconds. */
  finisherMinSeconds: number;
}

export const SCHEDULE: ScheduleParameters = {
  restDayOfWeek: 0,
  deloadEveryNWeeks: 4,
  deloadSetReduction: 1,
  foundationSetReduction: 1,
  finisherRoundReductionPerStep: 2,
  finisherSecondsReductionPerStep: 60,
  finisherMinRounds: 3,
  finisherMinSeconds: 120,
};

// Last week of each phase. Phases govern volume and the finisher dose only.
export const PHASE_LAST_WEEK = {
  foundation: 4,
  build: 12,
  strength: 26,
} as const;

// ─── 6. Per-exercise dose ───────────────────────────────────────────────────
//
// The prescription for every movement in the library. `min`/`max` bound the working
// range the engine progresses through before it adds difficulty.
//
// `tempo` is in the conventional four-figure order, in seconds:
//   eccentric (lowering) – pause at the bottom – concentric (lifting) – pause at the top.
// Ballistic lifts, carries, and stretches carry no tempo.
//
// `perSide` means the target applies to each side independently.

export type Prescription =
  | { kind: 'reps'; min: number; max: number; perSide?: true }
  | { kind: 'hold'; min: number; max: number; perSide?: true } // seconds
  | { kind: 'steps'; min: number; max: number };

export interface Tempo {
  eccentric: number;
  pauseBottom: number;
  concentric: number;
  pauseTop: number;
}

export interface ExerciseDose {
  sets: number;
  prescription: Prescription;
  tempo?: Tempo;
  targetRIR: number;
  restBetweenSets: number; // seconds
}

const t = (eccentric: number, pauseBottom: number, concentric: number, pauseTop: number): Tempo => ({
  eccentric,
  pauseBottom,
  concentric,
  pauseTop,
});

const RIR = AUTOREGULATION.defaultTargetRIR;

export const EXERCISE_DOSE: Record<string, ExerciseDose> = {
  // ── Core & abs ────────────────────────────────────────────────────────────
  // The McGill anti-movement trio is prescribed as short, repeated holds rather than
  // long ones: endurance without accumulating spinal compression.
  'mcgill-curl-up': {
    sets: 3,
    prescription: { kind: 'hold', min: 8, max: 15 },
    targetRIR: RIR,
    restBetweenSets: 10,
  },
  'mcgill-side-plank': {
    sets: 3,
    prescription: { kind: 'hold', min: 10, max: 30, perSide: true },
    targetRIR: RIR,
    restBetweenSets: 10,
  },
  'mcgill-bird-dog': {
    sets: 3,
    prescription: { kind: 'reps', min: 6, max: 10, perSide: true },
    tempo: t(2, 0, 2, 2),
    targetRIR: RIR,
    restBetweenSets: 10,
  },
  'dead-bug': {
    sets: 3,
    prescription: { kind: 'reps', min: 8, max: 12, perSide: true },
    tempo: t(3, 1, 2, 0),
    targetRIR: RIR,
    restBetweenSets: 15,
  },
  'front-plank': {
    sets: 3,
    prescription: { kind: 'hold', min: 20, max: 45 },
    targetRIR: RIR,
    restBetweenSets: 20,
  },
  'hollow-hold': {
    sets: 3,
    prescription: { kind: 'hold', min: 15, max: 40 },
    targetRIR: RIR,
    restBetweenSets: 20,
  },
  'pallof-press': {
    sets: 3,
    prescription: { kind: 'reps', min: 10, max: 15, perSide: true },
    tempo: t(2, 0, 1, 2),
    targetRIR: RIR,
    restBetweenSets: 15,
  },

  // ── Lower body — glute-dominant, knee-sparing ─────────────────────────────
  'glute-bridge': {
    sets: 3,
    prescription: { kind: 'reps', min: 10, max: 15 },
    tempo: t(2, 0, 1, 2),
    targetRIR: RIR,
    restBetweenSets: 20,
  },
  'band-glute-bridge': {
    sets: 3,
    prescription: { kind: 'reps', min: 10, max: 15 },
    tempo: t(2, 0, 1, 2),
    targetRIR: RIR,
    restBetweenSets: 20,
  },
  'hip-thrust': {
    sets: 4,
    prescription: { kind: 'reps', min: 8, max: 12 },
    tempo: t(2, 0, 1, 2),
    targetRIR: RIR,
    restBetweenSets: 30,
  },
  'single-leg-glute-bridge': {
    sets: 3,
    prescription: { kind: 'reps', min: 8, max: 12, perSide: true },
    tempo: t(2, 0, 1, 2),
    targetRIR: RIR,
    restBetweenSets: 20,
  },
  'kb-deadlift': {
    sets: 4,
    prescription: { kind: 'reps', min: 6, max: 10 },
    tempo: t(3, 0, 1, 1),
    targetRIR: RIR,
    restBetweenSets: 30,
  },
  'db-rdl': {
    sets: 4,
    prescription: { kind: 'reps', min: 8, max: 12 },
    tempo: t(3, 0, 1, 0),
    targetRIR: RIR,
    restBetweenSets: 30,
  },
  'b-stance-rdl': {
    sets: 4,
    prescription: { kind: 'reps', min: 8, max: 12, perSide: true },
    tempo: t(3, 0, 1, 0),
    targetRIR: RIR,
    restBetweenSets: 30,
  },
  // Ballistic. A higher RIR target keeps the user well clear of the point where a
  // fatigued hinge turns into a rounded-back lift.
  'kb-swing': {
    sets: 4,
    prescription: { kind: 'reps', min: 10, max: 15 },
    targetRIR: 3,
    restBetweenSets: 20,
  },
  'box-squat': {
    sets: 4,
    prescription: { kind: 'reps', min: 8, max: 12 },
    tempo: t(3, 1, 1, 0),
    targetRIR: RIR,
    restBetweenSets: 30,
  },
  'goblet-squat': {
    sets: 4,
    prescription: { kind: 'reps', min: 6, max: 10 },
    tempo: t(3, 1, 1, 0),
    targetRIR: RIR,
    restBetweenSets: 30,
  },
  'farmers-carry': {
    sets: 3,
    prescription: { kind: 'steps', min: 30, max: 50 },
    targetRIR: RIR,
    restBetweenSets: 20,
  },
  'band-lateral-walk': {
    sets: 3,
    prescription: { kind: 'reps', min: 10, max: 16, perSide: true },
    targetRIR: RIR,
    restBetweenSets: 15,
  },
  'band-monster-walk': {
    sets: 3,
    prescription: { kind: 'reps', min: 10, max: 16, perSide: true },
    targetRIR: RIR,
    restBetweenSets: 15,
  },
  'band-clamshell': {
    sets: 3,
    prescription: { kind: 'reps', min: 12, max: 20, perSide: true },
    tempo: t(2, 0, 1, 1),
    targetRIR: RIR,
    restBetweenSets: 15,
  },
  'band-kickback': {
    sets: 3,
    prescription: { kind: 'reps', min: 12, max: 18, perSide: true },
    tempo: t(2, 0, 1, 1),
    targetRIR: RIR,
    restBetweenSets: 15,
  },

  // ── Upper body ────────────────────────────────────────────────────────────
  'incline-push-up': {
    sets: 3,
    prescription: { kind: 'reps', min: 8, max: 15 },
    tempo: t(3, 1, 1, 0),
    targetRIR: RIR,
    restBetweenSets: 25,
  },
  'push-up': {
    sets: 3,
    prescription: { kind: 'reps', min: 6, max: 12 },
    tempo: t(3, 1, 1, 0),
    targetRIR: RIR,
    restBetweenSets: 25,
  },
  'band-row': {
    sets: 3,
    prescription: { kind: 'reps', min: 10, max: 15 },
    tempo: t(3, 0, 1, 1),
    targetRIR: RIR,
    restBetweenSets: 25,
  },
  'db-row': {
    sets: 3,
    prescription: { kind: 'reps', min: 8, max: 12, perSide: true },
    tempo: t(3, 0, 1, 1),
    targetRIR: RIR,
    restBetweenSets: 25,
  },
  'db-overhead-press': {
    sets: 3,
    prescription: { kind: 'reps', min: 8, max: 12 },
    tempo: t(3, 0, 1, 0),
    targetRIR: RIR,
    restBetweenSets: 25,
  },
  'db-bicep-curl': {
    sets: 3,
    prescription: { kind: 'reps', min: 10, max: 15 },
    tempo: t(3, 0, 1, 1),
    targetRIR: RIR,
    restBetweenSets: 20,
  },
  'db-tricep-kickback': {
    sets: 3,
    prescription: { kind: 'reps', min: 10, max: 15 },
    tempo: t(3, 0, 1, 1),
    targetRIR: RIR,
    restBetweenSets: 20,
  },
  'db-lateral-raise': {
    sets: 3,
    prescription: { kind: 'reps', min: 10, max: 15 },
    tempo: t(3, 0, 1, 0),
    targetRIR: RIR,
    restBetweenSets: 20,
  },
  'band-pull-apart': {
    sets: 3,
    prescription: { kind: 'reps', min: 12, max: 20 },
    tempo: t(2, 0, 1, 1),
    targetRIR: RIR,
    restBetweenSets: 20,
  },

  // ── Mobility ──────────────────────────────────────────────────────────────
  // Held, not progressed. `min === max` means the engine has no range to climb, and
  // targetRIR is zero because effort is not the point.
  '90-90': {
    sets: 1,
    prescription: { kind: 'hold', min: 30, max: 30, perSide: true },
    targetRIR: 0,
    restBetweenSets: 0,
  },
  'deep-squat-hold': {
    sets: 1,
    prescription: { kind: 'hold', min: 45, max: 45 },
    targetRIR: 0,
    restBetweenSets: 0,
  },
  'couch-stretch': {
    sets: 1,
    prescription: { kind: 'hold', min: 30, max: 30, perSide: true },
    targetRIR: 0,
    restBetweenSets: 0,
  },
  'pigeon-stretch': {
    sets: 1,
    prescription: { kind: 'hold', min: 45, max: 45, perSide: true },
    targetRIR: 0,
    restBetweenSets: 0,
  },
};

// ─── 7. Movement ladders ────────────────────────────────────────────────────
//
// An ordered chain of variants for one pattern, easiest rung first. The engine holds a
// level per pattern; a user's bridge climbs from a two-leg glute bridge to a loaded hip
// thrust over weeks while the weekly template keeps varying which patterns they see.
//
// `criteria` is the plain-English gate shown to the user. The engine's own gate is the
// double-progression rule; the two are meant to say the same thing in different
// registers. If you change one, change the other.
//
// Ordering principle: bilateral before unilateral, bodyweight before loaded, controlled
// before ballistic, and load a bilateral movement before asking for a single-leg one —
// a novice stabilises a loaded bilateral pattern more safely than an unloaded
// single-leg pattern.

export interface LadderRung {
  exerciseId: string;
  criteria: string;
}

export const LADDER_RUNGS: Record<Exclude<MovementPattern, 'mobility'>, LadderRung[]> = {
  trunkFlexion: [
    { exerciseId: 'mcgill-curl-up', criteria: 'Hold 15s on every set with the low back arch preserved.' },
  ],

  antiExtension: [
    { exerciseId: 'dead-bug', criteria: '12 reps each side with the low back pinned flat throughout.' },
    { exerciseId: 'front-plank', criteria: 'Hold 45s with no hip sag and breathing unbroken.' },
    { exerciseId: 'hollow-hold', criteria: 'Hold 40s with the low back glued to the floor.' },
  ],

  antiRotation: [
    { exerciseId: 'mcgill-bird-dog', criteria: '10 controlled reps each side with the trunk dead still.' },
    { exerciseId: 'pallof-press', criteria: '15 reps each side with no rotation toward the anchor.' },
  ],

  antiLateralFlexion: [
    { exerciseId: 'mcgill-side-plank', criteria: 'Hold 30s each side with hips stacked and lifted.' },
  ],

  hinge: [
    { exerciseId: 'kb-deadlift', criteria: '10 reps with a flat back and the hips clearly driving the lift.' },
    { exerciseId: 'db-rdl', criteria: '12 reps to mid-shin with no low-back rounding.' },
    { exerciseId: 'b-stance-rdl', criteria: '12 reps each side with the front leg taking the load and level hips.' },
    { exerciseId: 'kb-swing', criteria: 'The hinge is automatic under fatigue. This is the power expression of the pattern.' },
  ],

  bridge: [
    { exerciseId: 'glute-bridge', criteria: '15 reps with a full glute lockout and no low-back arch.' },
    { exerciseId: 'band-glute-bridge', criteria: '15 reps with the knees never caving in against the band.' },
    { exerciseId: 'hip-thrust', criteria: '12 reps with a horizontal torso, vertical shins, and ribs down.' },
    { exerciseId: 'single-leg-glute-bridge', criteria: '12 reps each side with the pelvis staying level.' },
  ],

  squat: [
    { exerciseId: 'box-squat', criteria: '12 controlled reps, touching the box without collapsing onto it.' },
    { exerciseId: 'goblet-squat', criteria: '10 reps at a pain-free depth with a tall chest and knees tracking out.' },
  ],

  abduction: [
    { exerciseId: 'band-clamshell', criteria: '20 reps each side with the pelvis perfectly still.' },
    { exerciseId: 'band-lateral-walk', criteria: '16 steps each way with band tension never going slack.' },
    { exerciseId: 'band-monster-walk', criteria: '16 steps each side while staying low in the quarter squat.' },
  ],

  hipExtension: [
    { exerciseId: 'band-kickback', criteria: '18 reps each side driven by the glute, with a still low back.' },
  ],

  carry: [
    { exerciseId: 'farmers-carry', criteria: '50 steps standing tall and square. Progress by adding load.' },
  ],

  horizontalPush: [
    { exerciseId: 'incline-push-up', criteria: '15 reps on the incline with a rigid line from heels to head.' },
    { exerciseId: 'push-up', criteria: '12 full-range reps from the floor with no hip sag.' },
  ],

  horizontalPull: [
    { exerciseId: 'band-row', criteria: '15 reps with an upright torso and the shoulder blades leading.' },
    { exerciseId: 'db-row', criteria: '12 reps each side with a flat, square back. Progress by adding load.' },
  ],

  verticalPush: [
    { exerciseId: 'db-overhead-press', criteria: '12 reps with ribs down and no low-back arch. Progress by adding load.' },
  ],

  elbowFlexion: [
    { exerciseId: 'db-bicep-curl', criteria: '15 strict reps with elbows pinned. Progress by adding load.' },
  ],

  elbowExtension: [
    { exerciseId: 'db-tricep-kickback', criteria: '15 reps with a motionless upper arm. Progress by adding load.' },
  ],

  lateralRaise: [
    { exerciseId: 'db-lateral-raise', criteria: '15 reps to shoulder height with no swing. Progress by adding load.' },
  ],

  scapularRetraction: [
    { exerciseId: 'band-pull-apart', criteria: '20 reps with straight arms and no shrugging.' },
  ],
};

// ─── 8. The standing stop rule ──────────────────────────────────────────────
//
// The PAR-Q+ style questionnaire that used to live here was removed at the owner's
// request (2026-07-15): it never blocked anyone — a "yes" only surfaced advice — so
// the first-run disclaimer now carries that advice in prose instead. The red-flag
// stop rule below is still shown to everyone.

export const RED_FLAG_STOP_RULE =
  'Stop and seek help if you feel chest pain, faintness, or sudden severe pain.';

// ─── The bundle the engine reads ────────────────────────────────────────────
//
// Passing this as a value (rather than importing constants directly) is what lets the
// guard tests run the engine against modified parameters and prove the numbers are
// load-bearing rather than decorative.

export interface ClinicalParameters {
  painBands: PainBands;
  patternPainRegions: Record<MovementPattern, PainRegion[]>;
  autoregulation: AutoregulationParameters;
  detraining: DetrainingParameters;
  progressionSteps: ProgressionSteps;
  loadIncrements: typeof LOAD_INCREMENTS;
}

export const CLINICAL_PARAMETERS: ClinicalParameters = {
  painBands: PAIN_BANDS,
  patternPainRegions: PATTERN_PAIN_REGIONS,
  autoregulation: AUTOREGULATION,
  detraining: DETRAINING,
  progressionSteps: PROGRESSION_STEPS,
  loadIncrements: LOAD_INCREMENTS,
};
