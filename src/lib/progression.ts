// Autoregulated progression engine.
//
// Pure: no DB, no clock, no I/O. Given what the user actually did (reps, load,
// reps-in-reserve) and what they actually felt (pain, 0–10), it decides what they
// get next session. Nothing else in the app is allowed to change the prescription.
//
// Two rules, in priority order:
//
//   1. The symptom gate. Loading through pain is safe only inside a band.
//   2. Double progression. Add reps inside the range first, then add difficulty.
//      Difficulty means load if the exercise can hold load, otherwise the next rung
//      of the movement's ladder, otherwise more reps still.
//
// EVERY number those rules use lives in src/clinical/parameters.ts. This module reads
// them and hardcodes none of them, so a clinician can retune the program without
// reading a line of engine code. The `params` argument threaded through the public
// functions exists so the guard tests can run the engine against modified parameters
// and prove the numbers are load-bearing rather than decorative.

import type { Exercise } from '../data/exercises';
import { getExercise, hasExercise } from '../data/exercises';
import { isTopOfLadder, levelExerciseId } from '../data/ladders';
import {
  CLINICAL_PARAMETERS,
  type ClinicalParameters,
  type MovementPattern,
  type PainRegion,
  type Prescription,
  type WeightUnit,
} from '../clinical/parameters';

export type { MovementPattern, PainRegion, WeightUnit } from '../clinical/parameters';

export interface SetPerformance {
  reps: number; // reps completed, or seconds held, or steps taken
  load: number; // external load used; 0 for bodyweight and bands
  rir: number; // reps in reserve on this set; 0 means taken to failure
}

export interface SessionPerformance {
  date: string; // YYYY-MM-DD
  exerciseId: string;
  sets: SetPerformance[];
  // How many sets were actually asked for that day. Foundation and deload weeks
  // prescribe fewer sets than the exercise's base count, so "did they complete the
  // work?" must be judged against the prescription they were given, not the default.
  prescribedSets?: number;
}

export interface SymptomReport {
  date: string; // YYYY-MM-DD — the session the symptom relates to
  region: PainRegion;
  nprsDuring: number; // 0–10 during the session
  nprsNextMorning?: number; // 0–10 the following morning, once known
}

// Per-exercise progression state. `targetReps` is the current working target
// inside the prescription's range (seconds for holds, steps for carries).
export interface ExerciseState {
  load: number;
  targetReps: number;
  qualifyingStreak: number; // consecutive sessions completed at the top of the range
}

export type ProgressionAction = 'grow' | 'advance' | 'hold' | 'regress';

// The code distinguishes holds that mean different things. Only `proving` — a
// clean session at the top of the range — banks progress toward advancing. A hold
// caused by pain or a missed target must never count toward making things harder.
export type ProgressionCode =
  | 'painStop'
  | 'painHold'
  | 'noHistory'
  | 'underperformed'
  | 'targetMissed'
  | 'grow'
  | 'proving'
  | 'advance'
  | 'layoff';

export interface ProgressionDecision {
  action: ProgressionAction;
  code: ProgressionCode;
  reason: string;
}

// ─── Symptom gate ───────────────────────────────────────────────────

// `other` is unmapped in the parameters and therefore gates everything — the safe
// default for an unlocalised complaint.
export function symptomAffectsPattern(
  region: PainRegion,
  pattern: MovementPattern,
  params: ClinicalParameters = CLINICAL_PARAMETERS
): boolean {
  if (region === 'other') return true;
  return params.patternPainRegions[pattern].includes(region);
}

export type SymptomVerdict = 'ok' | 'hold' | 'stop';

// Pain inside the acceptable band proceeds; inside the caution band it holds the dose;
// above the ceiling — or still sore the next morning, meaning it did not settle within
// 24 hours — it regresses. Thresholds: CLINICAL_PARAMETERS.painBands.
export function symptomVerdict(
  symptoms: SymptomReport[],
  params: ClinicalParameters = CLINICAL_PARAMETERS
): SymptomVerdict {
  if (symptoms.length === 0) return 'ok';
  const { acceptableMax, cautionMax, nextMorningRegressAtOrAbove } = params.painBands;
  const worstDuring = Math.max(...symptoms.map((s) => s.nprsDuring));
  const worstMorning = Math.max(...symptoms.map((s) => s.nprsNextMorning ?? 0));

  if (worstDuring > cautionMax || worstMorning >= nextMorningRegressAtOrAbove) return 'stop';
  if (worstDuring > acceptableMax) return 'hold';
  return 'ok';
}

// ─── Prescription arithmetic ────────────────────────────────────────

// How much a single progression step adds, per kind of prescription.
export function progressionStep(
  p: Prescription,
  params: ClinicalParameters = CLINICAL_PARAMETERS
): number {
  switch (p.kind) {
    case 'reps':
      return params.progressionSteps.reps;
    case 'hold':
      return params.progressionSteps.holdSeconds;
    case 'steps':
      return params.progressionSteps.steps;
  }
}

// Smallest load jump available with the equipment at hand.
export function loadIncrement(
  exercise: Exercise,
  unit: WeightUnit,
  params: ClinicalParameters = CLINICAL_PARAMETERS
): number {
  const increments = params.loadIncrements[unit];
  const kettlebell = exercise.equipment?.includes('kettlebell') ?? false;
  return kettlebell ? increments.kettlebell : increments.dumbbell;
}

export function initialState(exercise: Exercise): ExerciseState {
  return { load: 0, targetReps: exercise.prescription.min, qualifyingStreak: 0 };
}

// ─── Performance evaluation ─────────────────────────────────────────

// A session counts as "hitting the target" when every prescribed set reached the
// target and the last set still had at least one rep in reserve. Reaching the
// target only by going to failure is not a green light to add difficulty.
//
// The bar is the sets the user was *prescribed that day*. Comparing against
// `exercise.sets` instead meant that in Foundation — which trims a set — no session
// could ever qualify, and progression silently never fired for the first four weeks.
function hitTarget(
  session: SessionPerformance,
  exercise: Exercise,
  targetReps: number,
  params: ClinicalParameters
): boolean {
  const required = session.prescribedSets ?? exercise.sets;
  if (session.sets.length < required) return false;
  const everySetOnTarget = session.sets.every((s) => s.reps >= targetReps);
  const lastSet = session.sets[session.sets.length - 1];
  return everySetOnTarget && lastSet.rir >= params.autoregulation.minRirToQualify;
}

// A session counts as underperformance when the best set could not even reach the
// floor being asked for. The dose is wrong, not the effort.
//
// The floor is the lower of the range's bottom and the current target: after a
// regression the target legitimately sits below `min`, and comparing against `min`
// there would regress the user again on every session — a one-way spiral to zero.
function underperformed(
  session: SessionPerformance,
  exercise: Exercise,
  targetReps: number
): boolean {
  if (session.sets.length === 0) return true;
  const floor = Math.min(exercise.prescription.min, targetReps);
  const best = Math.max(...session.sets.map((s) => s.reps));
  return best < floor;
}

// ─── The decision ───────────────────────────────────────────────────

export interface ProgressionInput {
  exercise: Exercise;
  patternLevel: number;
  state: ExerciseState;
  lastSession?: SessionPerformance; // the most recent session for this exercise
  symptoms?: SymptomReport[]; // reports attached to that session, any region
}

export function decideProgression(
  input: ProgressionInput,
  params: ClinicalParameters = CLINICAL_PARAMETERS
): ProgressionDecision {
  const { exercise, state, lastSession } = input;
  const symptoms = (input.symptoms ?? []).filter((s) =>
    symptomAffectsPattern(s.region, exercise.pattern, params)
  );

  // 1. The symptom gate always wins.
  const verdict = symptomVerdict(symptoms, params);
  if (verdict === 'stop') {
    return {
      action: 'regress',
      code: 'painStop',
      reason: 'Pain went above the safe band, or had not settled by the next morning. Backing the dose off.',
    };
  }
  if (verdict === 'hold') {
    return {
      action: 'hold',
      code: 'painHold',
      reason: 'Pain sat in the caution band. Holding this dose until it settles.',
    };
  }

  // 2. No history yet — start at the bottom of the range.
  if (!lastSession) {
    return {
      action: 'hold',
      code: 'noHistory',
      reason: 'First session with this movement. Learn the standard first.',
    };
  }

  if (underperformed(lastSession, exercise, state.targetReps)) {
    return {
      action: 'regress',
      code: 'underperformed',
      reason: 'Could not reach the bottom of the rep range. Making the movement easier.',
    };
  }

  if (!hitTarget(lastSession, exercise, state.targetReps, params)) {
    return {
      action: 'hold',
      code: 'targetMissed',
      reason: 'Target not met on every set. Repeating this dose.',
    };
  }

  const { max } = exercise.prescription;
  const atTopOfRange = state.targetReps >= max;

  if (!atTopOfRange) {
    return { action: 'grow', code: 'grow', reason: 'Target met on every set. Adding to the target.' };
  }

  // At the top of the range. N consecutive sessions here before difficulty rises.
  if (state.qualifyingStreak + 1 < params.autoregulation.sessionsAtTopOfRangeToAdvance) {
    return {
      action: 'hold',
      code: 'proving',
      reason: 'Top of the range, once. Repeat it to prove it, then the difficulty goes up.',
    };
  }

  return {
    action: 'advance',
    code: 'advance',
    reason: 'Top of the range twice over. Time to make it harder.',
  };
}

// ─── Applying the decision ──────────────────────────────────────────

export interface ProgressionResult {
  patternLevel: number;
  state: ExerciseState;
}

export function applyDecision(
  decision: ProgressionDecision,
  input: ProgressionInput,
  unit: WeightUnit,
  params: ClinicalParameters = CLINICAL_PARAMETERS
): ProgressionResult {
  const { exercise, patternLevel, state } = input;
  const step = progressionStep(exercise.prescription, params);
  const { min, max } = exercise.prescription;

  switch (decision.action) {
    case 'hold':
      // Only a clean session at the top of the range banks progress toward the
      // two-session gate. A hold forced by pain or a missed target resets it.
      return {
        patternLevel,
        state: {
          ...state,
          qualifyingStreak: decision.code === 'proving' ? state.qualifyingStreak + 1 : 0,
        },
      };

    case 'grow':
      return {
        patternLevel,
        state: {
          ...state,
          targetReps: Math.min(state.targetReps + step, max),
          qualifyingStreak: 0,
        },
      };

    case 'advance': {
      // Load first, if the exercise can hold it.
      if (exercise.loadable) {
        return {
          patternLevel,
          state: {
            load: state.load + loadIncrement(exercise, unit, params),
            targetReps: min,
            qualifyingStreak: 0,
          },
        };
      }
      // Otherwise climb the ladder. The next rung's exercise starts fresh, so this
      // state is reset to its own floor by the caller reading the new exercise.
      if (!isTopOfLadder(exercise.pattern, patternLevel)) {
        return {
          patternLevel: patternLevel + 1,
          state: { load: 0, targetReps: min, qualifyingStreak: 0 },
        };
      }
      // Top rung of a bodyweight ladder: the range itself moves up.
      return {
        patternLevel,
        state: {
          ...state,
          targetReps: state.targetReps + step,
          qualifyingStreak: 0,
        },
      };
    }

    case 'regress': {
      // Shed load first — it is the least disruptive thing to take away.
      if (exercise.loadable && state.load > 0) {
        const next = Math.max(0, state.load - loadIncrement(exercise, unit, params));
        return { patternLevel, state: { load: next, targetReps: min, qualifyingStreak: 0 } };
      }
      // Then drop down a rung.
      if (patternLevel > 0) {
        return {
          patternLevel: patternLevel - 1,
          state: { load: 0, targetReps: min, qualifyingStreak: 0 },
        };
      }
      // Bottom rung, no load: reduce the target, but never below a single step.
      return {
        patternLevel,
        state: {
          ...state,
          targetReps: Math.max(step, state.targetReps - step),
          qualifyingStreak: 0,
        },
      };
    }
  }
}

// Convenience: decide and apply in one call.
export function progress(
  input: ProgressionInput,
  unit: WeightUnit,
  params: ClinicalParameters = CLINICAL_PARAMETERS
): ProgressionResult & { decision: ProgressionDecision } {
  const decision = decideProgression(input, params);
  return { ...applyDecision(decision, input, unit, params), decision };
}

// ─── Folding history into a snapshot ────────────────────────────────
//
// The user's current position is *derived* from what they logged, never stored
// incrementally. Recomputing from scratch on every load is cheap (a year is a few
// thousand set rows) and buys idempotence: replaying the same history always lands
// in the same place. It also means a next-morning pain score, recorded a day after
// the session it describes, retroactively feeds the gate for that session — which
// an incremental "apply once at session end" design could never do.

export interface Snapshot {
  patternLevels: Partial<Record<MovementPattern, number>>;
  exerciseStates: Record<string, ExerciseState>;
  decisions: Record<string, ProgressionDecision>;
  /** YYYY-MM-DD of the last logged session per exercise. Drives detraining. */
  lastSessionDates: Record<string, string>;
}

export interface HistoryInput {
  sessions: SessionPerformance[];
  symptoms: SymptomReport[];
  unit: WeightUnit;
  // Deload sessions prescribe fewer sets on purpose, so they can never "hit the
  // target" and must not be allowed to reset a hard-won qualifying streak.
  isDeloadDate?: (date: string) => boolean;
  params?: ClinicalParameters;
}

export function computeSnapshot(history: HistoryInput): Snapshot {
  const { unit, isDeloadDate } = history;
  const params = history.params ?? CLINICAL_PARAMETERS;
  const patternLevels: Partial<Record<MovementPattern, number>> = {};
  const exerciseStates: Record<string, ExerciseState> = {};
  const decisions: Record<string, ProgressionDecision> = {};
  const lastSessionDates: Record<string, string> = {};

  const symptomsByDate = new Map<string, SymptomReport[]>();
  for (const s of history.symptoms) {
    const list = symptomsByDate.get(s.date) ?? [];
    list.push(s);
    symptomsByDate.set(s.date, list);
  }

  // Chronological. Ties broken by exercise id so the fold is deterministic.
  const sessions = [...history.sessions].sort(
    (a, b) => a.date.localeCompare(b.date) || a.exerciseId.localeCompare(b.exerciseId)
  );

  for (const session of sessions) {
    // A deload session still counts as *attendance* — it just does not drive progression.
    // Excluding it here too would make a deload week look like the start of a layoff.
    if (hasExercise(session.exerciseId)) {
      lastSessionDates[session.exerciseId] = session.date;
    }
    if (isDeloadDate?.(session.date)) continue;
    // An exercise removed in a later release leaves logs behind. Skip, don't crash.
    if (!hasExercise(session.exerciseId)) continue;

    const exercise = getExercise(session.exerciseId);
    const state = exerciseStates[exercise.id] ?? initialState(exercise);
    const patternLevel = patternLevels[exercise.pattern] ?? 0;

    const input: ProgressionInput = {
      exercise,
      patternLevel,
      state,
      lastSession: session,
      symptoms: symptomsByDate.get(session.date) ?? [],
    };

    const decision = decideProgression(input, params);
    const result = applyDecision(decision, input, unit, params);

    decisions[exercise.id] = decision;
    patternLevels[exercise.pattern] = result.patternLevel;

    if (result.patternLevel !== patternLevel) {
      // Climbed or dropped a rung: the exercise on the new rung starts from its own
      // floor. Leave the old rung's state untouched so returning to it is not a reset.
      const nextId = levelExerciseId(exercise.pattern, result.patternLevel);
      if (nextId && hasExercise(nextId) && !exerciseStates[nextId]) {
        exerciseStates[nextId] = initialState(getExercise(nextId));
      }
    } else {
      exerciseStates[exercise.id] = result.state;
    }
  }

  return { patternLevels, exerciseStates, decisions, lastSessionDates };
}

// ─── Detraining after a layoff ──────────────────────────────────────────────
//
// The gap this closes: a user who stopped for two months resumed at exactly the dose they
// left. Nothing in the engine noticed the calendar, because progression was driven purely
// by the *sequence* of sessions, never by the time between them.
//
// Applied on read, as a function of "today", rather than folded into the history: the
// user's position genuinely depends on when you ask. Ask on the day they stopped and
// nothing has decayed; ask six weeks later and it has.

/** Whole calendar days between two YYYY-MM-DD dates. DST-safe: no millisecond arithmetic. */
export function daysBetween(fromISO: string, toISO: string): number {
  const [fy, fm, fd] = fromISO.split('-').map(Number);
  const [ty, tm, td] = toISO.split('-').map(Number);
  return Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd)) / 86_400_000);
}

// How many regression steps a given absence costs. Zero inside the grace period.
export function detrainingSteps(
  daysAway: number,
  params: ClinicalParameters = CLINICAL_PARAMETERS
): number {
  const { gracePeriodDays, daysPerRegressionStep, maxRegressionSteps } = params.detraining;
  if (daysAway <= gracePeriodDays) return 0;
  const beyondGrace = daysAway - gracePeriodDays;
  const steps = Math.ceil(beyondGrace / daysPerRegressionStep);
  return Math.min(steps, maxRegressionSteps);
}

const LAYOFF_DECISION: ProgressionDecision = {
  action: 'regress',
  code: 'layoff',
  reason: 'You have been away a while. Starting lighter and building back up.',
};

/**
 * Walk each exercise's dose back for time away. Pure, and idempotent for a given `today`:
 * it reads `lastSessionDates` from the fold, never its own output.
 *
 * An exercise with no logged history is untouched — it has not detrained, it has never
 * been trained.
 */
export function applyDetraining(
  snapshot: Snapshot,
  today: string,
  unit: WeightUnit,
  params: ClinicalParameters = CLINICAL_PARAMETERS
): Snapshot {
  const patternLevels = { ...snapshot.patternLevels };
  const exerciseStates = { ...snapshot.exerciseStates };
  const decisions = { ...snapshot.decisions };

  for (const [exerciseId, lastDate] of Object.entries(snapshot.lastSessionDates)) {
    if (!hasExercise(exerciseId)) continue;
    const steps = detrainingSteps(daysBetween(lastDate, today), params);
    if (steps === 0) continue;

    const exercise = getExercise(exerciseId);
    let level = patternLevels[exercise.pattern] ?? 0;
    let state = exerciseStates[exerciseId] ?? initialState(exercise);

    for (let i = 0; i < steps; i++) {
      const result = applyDecision(
        LAYOFF_DECISION,
        { exercise, patternLevel: level, state },
        unit,
        params
      );
      level = result.patternLevel;
      state = result.state;
    }

    patternLevels[exercise.pattern] = level;
    exerciseStates[exerciseId] = state;
    decisions[exerciseId] = LAYOFF_DECISION;
  }

  return { patternLevels, exerciseStates, decisions, lastSessionDates: snapshot.lastSessionDates };
}
