// Guards for src/clinical/parameters.ts.
//
// Two jobs:
//
//   1. INTERNAL CONSISTENCY. A reviewing clinician edits this file without reading the
//      engine. A typo — a rung naming an exercise that does not exist, a rep range with
//      max below min, a pattern with no dose — must fail here, loudly, not surface as a
//      blank screen or a movement that silently never appears.
//
//   2. LOAD-BEARING. Every parameter is exercised by running the engine against a
//      MODIFIED copy and asserting the behaviour moves. A number nothing reads is a
//      number that lies to the reviewer. These are the tests that would have caught the
//      original `getSuggestedWeight` — a knob wired to nothing.

import { describe, it, expect } from 'vitest';
import {
  CLINICAL_PARAMETERS,
  EXERCISE_DOSE,
  LADDER_RUNGS,
  LOAD_INCREMENTS,
  PAIN_BANDS,
  PATTERN_PAIN_REGIONS,
  READINESS_QUESTIONS,
  SCHEDULE,
  PHASE_LAST_WEEK,
  AUTOREGULATION,
  DETRAINING,
  type ClinicalParameters,
  type MovementPattern,
} from './parameters';
import {
  decideProgression,
  applyDecision,
  symptomVerdict,
  symptomAffectsPattern,
  loadIncrement,
  progressionStep,
  detrainingSteps,
  initialState,
  type ExerciseState,
  type ProgressionInput,
  type SessionPerformance,
} from '../lib/progression';
import { EXERCISES, getExercise, hasExercise } from '../data/exercises';

const GLUTE_BRIDGE = getExercise('glute-bridge'); // bodyweight, reps 10–15, 3 sets
const HIP_THRUST = getExercise('hip-thrust'); // loadable, reps 8–12, 3 sets

function cleanSession(exerciseId: string, sets: number, reps: number, rir = 2): SessionPerformance {
  return {
    date: '2026-07-01',
    exerciseId,
    prescribedSets: sets,
    sets: Array.from({ length: sets }, () => ({ reps, load: 0, rir })),
  };
}

function input(over: Partial<ProgressionInput> & Pick<ProgressionInput, 'exercise'>): ProgressionInput {
  return { patternLevel: 0, state: initialState(over.exercise), ...over };
}

// A deep-ish clone with one branch overridden, so a test can ask "if a clinician
// changed THIS number, would anything actually happen?"
function withParams(patch: Partial<ClinicalParameters>): ClinicalParameters {
  return { ...CLINICAL_PARAMETERS, ...patch };
}

// ═══════════════════════════════════════════════════════════════════
// 1. Internal consistency
// ═══════════════════════════════════════════════════════════════════

describe('the parameter file is internally consistent', () => {
  it('defines a dose for every exercise in the library', () => {
    const missing = EXERCISES.filter((e) => !(e.id in EXERCISE_DOSE)).map((e) => e.id);
    expect(missing).toEqual([]);
  });

  it('defines no dose for an exercise that does not exist', () => {
    const orphans = Object.keys(EXERCISE_DOSE).filter((id) => !hasExercise(id));
    expect(orphans).toEqual([]);
  });

  it('gives every prescription a range the engine can climb', () => {
    for (const [id, dose] of Object.entries(EXERCISE_DOSE)) {
      expect(dose.prescription.max, id).toBeGreaterThanOrEqual(dose.prescription.min);
      expect(dose.prescription.min, id).toBeGreaterThan(0);
      expect(dose.sets, id).toBeGreaterThan(0);
      expect(dose.restBetweenSets, id).toBeGreaterThanOrEqual(0);
    }
  });

  it('gives every working exercise a target that leaves reps in reserve', () => {
    for (const e of EXERCISES) {
      if (e.block === 'mobility') continue;
      expect(e.targetRIR, e.id).toBeGreaterThanOrEqual(AUTOREGULATION.minRirToQualify);
    }
  });

  it('names a real exercise on every ladder rung', () => {
    for (const [pattern, rungs] of Object.entries(LADDER_RUNGS)) {
      for (const rung of rungs) {
        expect(hasExercise(rung.exerciseId), `${pattern} → ${rung.exerciseId}`).toBe(true);
      }
    }
  });

  it('puts every rung on the pattern its ladder claims', () => {
    for (const [pattern, rungs] of Object.entries(LADDER_RUNGS)) {
      for (const rung of rungs) {
        expect(getExercise(rung.exerciseId).pattern).toBe(pattern);
      }
    }
  });

  it('gives every rung a criteria sentence a human can act on', () => {
    for (const rungs of Object.values(LADDER_RUNGS)) {
      for (const rung of rungs) {
        expect(rung.criteria.length, rung.exerciseId).toBeGreaterThan(20);
      }
    }
  });

  it('never lists the same exercise twice on one ladder', () => {
    for (const [pattern, rungs] of Object.entries(LADDER_RUNGS)) {
      const ids = rungs.map((r) => r.exerciseId);
      expect(new Set(ids).size, pattern).toBe(ids.length);
    }
  });

  it('orders the pain bands so the traffic light cannot invert', () => {
    expect(PAIN_BANDS.acceptableMax).toBeLessThan(PAIN_BANDS.cautionMax);
    expect(PAIN_BANDS.acceptableMax).toBeGreaterThanOrEqual(0);
    expect(PAIN_BANDS.cautionMax).toBeLessThan(10);
    expect(PAIN_BANDS.nextMorningRegressAtOrAbove).toBeGreaterThan(0);
  });

  it('maps every movement pattern to the regions that gate it', () => {
    const patterns = new Set(EXERCISES.map((e) => e.pattern));
    for (const p of patterns) {
      expect(PATTERN_PAIN_REGIONS[p], p).toBeDefined();
    }
  });

  it('gates knee-loading patterns on knee pain', () => {
    // A rule the program's whole "knee-friendly" premise rests on.
    expect(PATTERN_PAIN_REGIONS.squat).toContain('knee');
    expect(PATTERN_PAIN_REGIONS.abduction).toContain('knee');
  });

  it('never gates a stretch on anything — mobility is not progressed', () => {
    expect(PATTERN_PAIN_REGIONS.mobility).toEqual([]);
  });

  it('orders the phase boundaries', () => {
    expect(PHASE_LAST_WEEK.foundation).toBeLessThan(PHASE_LAST_WEEK.build);
    expect(PHASE_LAST_WEEK.build).toBeLessThan(PHASE_LAST_WEEK.strength);
  });

  it('keeps the deload cycle short enough to land inside every phase', () => {
    expect(SCHEDULE.deloadEveryNWeeks).toBeGreaterThan(1);
    expect(SCHEDULE.deloadEveryNWeeks).toBeLessThanOrEqual(PHASE_LAST_WEEK.foundation);
  });

  it('gives the detraining rule a grace period, a cadence, and a cap', () => {
    expect(DETRAINING.gracePeriodDays).toBeGreaterThan(0);
    expect(DETRAINING.daysPerRegressionStep).toBeGreaterThan(0);
    expect(DETRAINING.maxRegressionSteps).toBeGreaterThan(0);
  });

  it('forgives at least a normal deload cycle before detraining bites', () => {
    // A user who takes their scheduled deload, or misses a week, must not be detrained
    // for it. The grace period has to outlast an ordinary gap in training.
    expect(DETRAINING.gracePeriodDays).toBeGreaterThanOrEqual(7);
  });

  it('keeps a rest day inside the week', () => {
    expect(SCHEDULE.restDayOfWeek).toBeGreaterThanOrEqual(0);
    expect(SCHEDULE.restDayOfWeek).toBeLessThanOrEqual(6);
  });

  it('makes every load increment a positive jump', () => {
    for (const [unit, inc] of Object.entries(LOAD_INCREMENTS)) {
      expect(inc.dumbbell, unit).toBeGreaterThan(0);
      expect(inc.kettlebell, unit).toBeGreaterThan(0);
    }
  });

  it('gives every readiness question a unique id and real text', () => {
    const ids = READINESS_QUESTIONS.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const q of READINESS_QUESTIONS) expect(q.text.length).toBeGreaterThan(20);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 2. Load-bearing: change the number, the behaviour must move
// ═══════════════════════════════════════════════════════════════════

describe('every parameter is wired to the engine, not decorative', () => {
  it('painBands.cautionMax decides where "stop" begins', () => {
    const sore = [{ date: 'd', region: 'knee' as const, nprsDuring: 6 }];
    expect(symptomVerdict(sore)).toBe('stop');

    const lenient = withParams({ painBands: { ...PAIN_BANDS, cautionMax: 7 } });
    expect(symptomVerdict(sore, lenient)).toBe('hold');
  });

  it('painBands.acceptableMax decides where "hold" begins', () => {
    const mild = [{ date: 'd', region: 'knee' as const, nprsDuring: 4 }];
    expect(symptomVerdict(mild)).toBe('hold');

    const lenient = withParams({ painBands: { ...PAIN_BANDS, acceptableMax: 5 } });
    expect(symptomVerdict(mild, lenient)).toBe('ok');
  });

  it('painBands.nextMorningRegressAtOrAbove decides what "did not settle" means', () => {
    const lingering = [{ date: 'd', region: 'knee' as const, nprsDuring: 1, nprsNextMorning: 4 }];
    expect(symptomVerdict(lingering)).toBe('stop');

    const lenient = withParams({
      painBands: { ...PAIN_BANDS, nextMorningRegressAtOrAbove: 6 },
    });
    expect(symptomVerdict(lingering, lenient)).toBe('ok');
  });

  it('patternPainRegions decides which complaints gate which movements', () => {
    expect(symptomAffectsPattern('shoulder', 'bridge')).toBe(false);

    const cautious = withParams({
      patternPainRegions: { ...PATTERN_PAIN_REGIONS, bridge: ['lowBack', 'hip', 'shoulder'] },
    });
    expect(symptomAffectsPattern('shoulder', 'bridge', cautious)).toBe(true);
  });

  it('the pattern gating actually reaches decideProgression', () => {
    const atTop: ExerciseState = { load: 0, targetReps: 15, qualifyingStreak: 1 };
    const shoulderPain = {
      exercise: GLUTE_BRIDGE,
      state: atTop,
      lastSession: cleanSession('glute-bridge', 3, 15),
      symptoms: [{ date: '2026-07-01', region: 'shoulder' as const, nprsDuring: 9 }],
    };

    // Default: a shoulder does not gate a bridge, so it advances.
    expect(decideProgression(input(shoulderPain)).action).toBe('advance');

    // Gate the bridge on shoulder pain and the same history regresses.
    const cautious = withParams({
      patternPainRegions: { ...PATTERN_PAIN_REGIONS, bridge: ['lowBack', 'hip', 'shoulder'] },
    });
    expect(decideProgression(input(shoulderPain), cautious).action).toBe('regress');
  });

  it('autoregulation.minRirToQualify decides whether a grinding set counts', () => {
    const groundOut = {
      exercise: GLUTE_BRIDGE,
      state: { load: 0, targetReps: 15, qualifyingStreak: 1 } as ExerciseState,
      lastSession: cleanSession('glute-bridge', 3, 15, /* rir */ 0),
    };
    // Default: RIR 0 is failure, so it does not qualify.
    expect(decideProgression(input(groundOut)).action).toBe('hold');

    const permissive = withParams({
      autoregulation: { ...AUTOREGULATION, minRirToQualify: 0 },
    });
    expect(decideProgression(input(groundOut), permissive).action).toBe('advance');
  });

  it('autoregulation.sessionsAtTopOfRangeToAdvance decides how long "prove it" takes', () => {
    const firstTimeAtTop = {
      exercise: GLUTE_BRIDGE,
      state: { load: 0, targetReps: 15, qualifyingStreak: 0 } as ExerciseState,
      lastSession: cleanSession('glute-bridge', 3, 15),
    };
    // Default gate is two sessions, so the first one only "proves" it.
    expect(decideProgression(input(firstTimeAtTop)).code).toBe('proving');

    const eager = withParams({
      autoregulation: { ...AUTOREGULATION, sessionsAtTopOfRangeToAdvance: 1 },
    });
    expect(decideProgression(input(firstTimeAtTop), eager).action).toBe('advance');

    const patient = withParams({
      autoregulation: { ...AUTOREGULATION, sessionsAtTopOfRangeToAdvance: 4 },
    });
    const nearlyThere = {
      exercise: GLUTE_BRIDGE,
      state: { load: 0, targetReps: 15, qualifyingStreak: 2 } as ExerciseState,
      lastSession: cleanSession('glute-bridge', 3, 15),
    };
    expect(decideProgression(input(nearlyThere), patient).code).toBe('proving');
  });

  it('progressionSteps decides how much a single step of progress adds', () => {
    expect(progressionStep({ kind: 'reps', min: 1, max: 2 })).toBe(1);
    expect(progressionStep({ kind: 'hold', min: 1, max: 2 })).toBe(5);

    const bigger = withParams({ progressionSteps: { reps: 3, holdSeconds: 10, steps: 10 } });
    expect(progressionStep({ kind: 'reps', min: 1, max: 2 }, bigger)).toBe(3);
    expect(progressionStep({ kind: 'hold', min: 1, max: 2 }, bigger)).toBe(10);
  });

  it('progressionSteps reaches applyDecision, not just the helper', () => {
    const inp = input({
      exercise: GLUTE_BRIDGE,
      state: { load: 0, targetReps: 10, qualifyingStreak: 0 },
    });
    const grow = { action: 'grow' as const, code: 'grow' as const, reason: '' };

    expect(applyDecision(grow, inp, 'kg').state.targetReps).toBe(11);

    const bigger = withParams({ progressionSteps: { reps: 3, holdSeconds: 10, steps: 10 } });
    expect(applyDecision(grow, inp, 'kg', bigger).state.targetReps).toBe(13);
  });

  it('loadIncrements decides the size of a load jump, by equipment and unit', () => {
    expect(loadIncrement(HIP_THRUST, 'kg')).toBe(LOAD_INCREMENTS.kg.dumbbell);
    expect(loadIncrement(getExercise('goblet-squat'), 'kg')).toBe(LOAD_INCREMENTS.kg.kettlebell);

    const heavy = withParams({
      loadIncrements: { kg: { dumbbell: 10, kettlebell: 12 }, lbs: { dumbbell: 20, kettlebell: 24 } },
    });
    expect(loadIncrement(HIP_THRUST, 'kg', heavy)).toBe(10);
  });

  it('detraining.gracePeriodDays decides when time away starts to cost', () => {
    expect(detrainingSteps(10)).toBe(0); // default grace is 14 days

    const strict = withParams({
      detraining: { gracePeriodDays: 3, daysPerRegressionStep: 3, maxRegressionSteps: 4 },
    });
    expect(detrainingSteps(10, strict)).toBeGreaterThan(0);
  });

  it('detraining.maxRegressionSteps caps however long the absence', () => {
    expect(detrainingSteps(10_000)).toBe(DETRAINING.maxRegressionSteps);

    const gentler = withParams({
      detraining: { ...DETRAINING, maxRegressionSteps: 1 },
    });
    expect(detrainingSteps(10_000, gentler)).toBe(1);
  });

  it('loadIncrements reaches applyDecision, not just the helper', () => {
    const inp = input({
      exercise: HIP_THRUST,
      state: { load: 10, targetReps: 12, qualifyingStreak: 1 },
    });
    const advance = { action: 'advance' as const, code: 'advance' as const, reason: '' };

    expect(applyDecision(advance, inp, 'kg').state.load).toBe(10 + LOAD_INCREMENTS.kg.dumbbell);

    const heavy = withParams({
      loadIncrements: { kg: { dumbbell: 10, kettlebell: 12 }, lbs: { dumbbell: 20, kettlebell: 24 } },
    });
    expect(applyDecision(advance, inp, 'kg', heavy).state.load).toBe(20);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 3. The dose table is what the app actually prescribes
// ═══════════════════════════════════════════════════════════════════

describe('the dose table reaches the composed exercise', () => {
  it('composes each exercise from its identity and its clinical dose', () => {
    for (const e of EXERCISES) {
      const dose = EXERCISE_DOSE[e.id];
      expect(e.sets, e.id).toBe(dose.sets);
      expect(e.prescription, e.id).toEqual(dose.prescription);
      expect(e.targetRIR, e.id).toBe(dose.targetRIR);
      expect(e.restBetweenSets, e.id).toBe(dose.restBetweenSets);
      expect(e.tempo, e.id).toEqual(dose.tempo);
    }
  });

  it('starts every exercise at the bottom of its prescribed range', () => {
    for (const e of EXERCISES) {
      expect(initialState(e).targetReps, e.id).toBe(EXERCISE_DOSE[e.id].prescription.min);
    }
  });

  it('holds the ballistic swing further from failure than the controlled lifts', () => {
    // A safety judgement worth pinning: a fatigued hinge under a moving bell is how
    // a swing becomes a rounded-back lift.
    expect(EXERCISE_DOSE['kb-swing'].targetRIR).toBeGreaterThan(
      EXERCISE_DOSE['kb-deadlift'].targetRIR
    );
  });

  it('prescribes no effort target for the stretches', () => {
    for (const e of EXERCISES) {
      if (e.block !== 'mobility') continue;
      expect(e.targetRIR, e.id).toBe(0);
      expect(e.prescription.min, e.id).toBe(e.prescription.max); // nothing to climb
    }
  });
});

// A pattern with a ladder but no exercise, or vice versa, means a whole movement
// silently vanishes from the program.
describe('ladders and the weekly template agree', () => {
  it('gives every non-mobility pattern used by an exercise a ladder', () => {
    const patterns = new Set<MovementPattern>(EXERCISES.map((e) => e.pattern));
    patterns.delete('mobility');
    for (const p of patterns) {
      expect(LADDER_RUNGS[p as Exclude<MovementPattern, 'mobility'>], p).toBeDefined();
    }
  });

  it('reaches every non-mobility exercise from some ladder', () => {
    const reachable = new Set(Object.values(LADDER_RUNGS).flatMap((r) => r.map((x) => x.exerciseId)));
    const orphans = EXERCISES.filter((e) => e.pattern !== 'mobility' && !reachable.has(e.id));
    expect(orphans.map((e) => e.id)).toEqual([]);
  });
});
