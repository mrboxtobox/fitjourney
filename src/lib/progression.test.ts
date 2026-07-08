import { describe, it, expect } from 'vitest';
import {
  decideProgression,
  applyDecision,
  applyDetraining,
  computeSnapshot,
  daysBetween,
  detrainingSteps,
  progress,
  initialState,
  symptomVerdict,
  symptomAffectsPattern,
  loadIncrement,
  progressionStep,
  type ExerciseState,
  type SessionPerformance,
  type SymptomReport,
  type ProgressionInput,
} from './progression';
import { CLINICAL_PARAMETERS, type ClinicalParameters } from '../clinical/parameters';
import { getExercise } from '../data/exercises';

const GLUTE_BRIDGE = getExercise('glute-bridge'); // bodyweight, reps 10–15, 3 sets
const HIP_THRUST = getExercise('hip-thrust'); // loadable, reps 8–12, 3 sets
const FRONT_PLANK = getExercise('front-plank'); // bodyweight hold, 20–45s, 2 sets

// A clean session: every set hits `reps`, with reps left in the tank.
function cleanSession(exerciseId: string, sets: number, reps: number, rir = 2): SessionPerformance {
  return {
    date: '2026-07-01',
    exerciseId,
    sets: Array.from({ length: sets }, () => ({ reps, load: 0, rir })),
  };
}

function input(over: Partial<ProgressionInput> & Pick<ProgressionInput, 'exercise'>): ProgressionInput {
  return {
    patternLevel: 0,
    state: initialState(over.exercise),
    ...over,
  };
}

describe('symptomVerdict — the clinical traffic light', () => {
  it('treats pain up to 3/10 as acceptable', () => {
    expect(symptomVerdict([{ date: 'd', region: 'knee', nprsDuring: 3 }])).toBe('ok');
  });

  it('holds the dose at 4–5/10', () => {
    expect(symptomVerdict([{ date: 'd', region: 'knee', nprsDuring: 4 }])).toBe('hold');
    expect(symptomVerdict([{ date: 'd', region: 'knee', nprsDuring: 5 }])).toBe('hold');
  });

  it('stops above 5/10', () => {
    expect(symptomVerdict([{ date: 'd', region: 'knee', nprsDuring: 6 }])).toBe('stop');
  });

  it('stops when pain has not settled by the next morning', () => {
    const unsettled: SymptomReport = {
      date: 'd',
      region: 'knee',
      nprsDuring: 2, // was fine during the session…
      nprsNextMorning: 4, // …but still sore the next day
    };
    expect(symptomVerdict([unsettled])).toBe('stop');
  });

  it('takes the worst report when several are present', () => {
    expect(
      symptomVerdict([
        { date: 'd', region: 'knee', nprsDuring: 1 },
        { date: 'd', region: 'hip', nprsDuring: 7 },
      ])
    ).toBe('stop');
  });

  it('is quiet with no reports', () => {
    expect(symptomVerdict([])).toBe('ok');
  });
});

describe('symptomAffectsPattern — pain gates only what it should', () => {
  it('lets a sore shoulder through to a bridge', () => {
    expect(symptomAffectsPattern('shoulder', 'bridge')).toBe(false);
  });

  it('gates a squat on knee pain', () => {
    expect(symptomAffectsPattern('knee', 'squat')).toBe(true);
  });

  it('does not gate a band pull-apart on knee pain', () => {
    expect(symptomAffectsPattern('knee', 'scapularRetraction')).toBe(false);
  });

  it('gates everything on unlocalised pain', () => {
    expect(symptomAffectsPattern('other', 'bridge')).toBe(true);
    expect(symptomAffectsPattern('other', 'lateralRaise')).toBe(true);
  });
});

describe('decideProgression', () => {
  it('holds on the very first session', () => {
    const d = decideProgression(input({ exercise: GLUTE_BRIDGE }));
    expect(d.action).toBe('hold');
    expect(d.code).toBe('noHistory');
  });

  it('grows the target after a clean session below the top of the range', () => {
    const d = decideProgression(
      input({
        exercise: GLUTE_BRIDGE,
        lastSession: cleanSession('glute-bridge', 3, 10),
      })
    );
    expect(d.action).toBe('grow');
  });

  it('holds when the target was not met on every set', () => {
    const missed: SessionPerformance = {
      date: '2026-07-01',
      exerciseId: 'glute-bridge',
      sets: [
        { reps: 10, load: 0, rir: 2 },
        { reps: 10, load: 0, rir: 2 },
        { reps: 8, load: 0, rir: 0 }, // fell short on the last set
      ],
    };
    const d = decideProgression(input({ exercise: GLUTE_BRIDGE, lastSession: missed }));
    expect(d.action).toBe('hold');
    expect(d.code).toBe('targetMissed');
  });

  it('does not advance off a session taken to failure', () => {
    // Top of the range, but zero reps in reserve — reaching the target by grinding
    // is not a green light.
    const state: ExerciseState = { load: 0, targetReps: 15, qualifyingStreak: 1 };
    const d = decideProgression(
      input({
        exercise: GLUTE_BRIDGE,
        state,
        lastSession: cleanSession('glute-bridge', 3, 15, /* rir */ 0),
      })
    );
    expect(d.action).toBe('hold');
    expect(d.code).toBe('targetMissed');
  });

  it('requires two sessions at the top of the range before advancing', () => {
    const atTop: ExerciseState = { load: 0, targetReps: 15, qualifyingStreak: 0 };
    const first = decideProgression(
      input({ exercise: GLUTE_BRIDGE, state: atTop, lastSession: cleanSession('glute-bridge', 3, 15) })
    );
    expect(first.action).toBe('hold');
    expect(first.code).toBe('proving');

    const proven: ExerciseState = { ...atTop, qualifyingStreak: 1 };
    const second = decideProgression(
      input({ exercise: GLUTE_BRIDGE, state: proven, lastSession: cleanSession('glute-bridge', 3, 15) })
    );
    expect(second.action).toBe('advance');
  });

  it('regresses when the bottom of the range was out of reach', () => {
    const flopped: SessionPerformance = {
      date: '2026-07-01',
      exerciseId: 'glute-bridge',
      sets: [{ reps: 4, load: 0, rir: 0 }],
    };
    const d = decideProgression(input({ exercise: GLUTE_BRIDGE, lastSession: flopped }));
    expect(d.action).toBe('regress');
    expect(d.code).toBe('underperformed');
  });

  describe('the symptom gate outranks performance', () => {
    it('regresses on high pain even after a perfect session', () => {
      const state: ExerciseState = { load: 0, targetReps: 15, qualifyingStreak: 1 };
      const d = decideProgression(
        input({
          exercise: GLUTE_BRIDGE,
          state,
          lastSession: cleanSession('glute-bridge', 3, 15), // would otherwise advance
          symptoms: [{ date: '2026-07-01', region: 'lowBack', nprsDuring: 7 }],
        })
      );
      expect(d.action).toBe('regress');
      expect(d.code).toBe('painStop');
    });

    it('holds on caution-band pain even after a perfect session', () => {
      const state: ExerciseState = { load: 0, targetReps: 15, qualifyingStreak: 1 };
      const d = decideProgression(
        input({
          exercise: GLUTE_BRIDGE,
          state,
          lastSession: cleanSession('glute-bridge', 3, 15),
          symptoms: [{ date: '2026-07-01', region: 'lowBack', nprsDuring: 4 }],
        })
      );
      expect(d.action).toBe('hold');
      expect(d.code).toBe('painHold');
    });

    it('ignores pain in a region the movement does not load', () => {
      const state: ExerciseState = { load: 0, targetReps: 15, qualifyingStreak: 1 };
      const d = decideProgression(
        input({
          exercise: GLUTE_BRIDGE, // pattern: bridge → lowBack, hip
          state,
          lastSession: cleanSession('glute-bridge', 3, 15),
          symptoms: [{ date: '2026-07-01', region: 'shoulder', nprsDuring: 9 }],
        })
      );
      expect(d.action).toBe('advance');
    });
  });
});

describe('applyDecision', () => {
  it('grows the target by one rep, capped at the top of the range', () => {
    const inp = input({ exercise: GLUTE_BRIDGE, state: { load: 0, targetReps: 14, qualifyingStreak: 0 } });
    const grown = applyDecision({ action: 'grow', code: 'grow', reason: '' }, inp, 'kg');
    expect(grown.state.targetReps).toBe(15);

    const capped = applyDecision(
      { action: 'grow', code: 'grow', reason: '' },
      input({ exercise: GLUTE_BRIDGE, state: { load: 0, targetReps: 15, qualifyingStreak: 0 } }),
      'kg'
    );
    expect(capped.state.targetReps).toBe(15);
  });

  it('grows a hold by five seconds, not one', () => {
    expect(progressionStep(FRONT_PLANK.prescription)).toBe(5);
    const grown = applyDecision(
      { action: 'grow', code: 'grow', reason: '' },
      input({ exercise: FRONT_PLANK, state: { load: 0, targetReps: 20, qualifyingStreak: 0 } }),
      'kg'
    );
    expect(grown.state.targetReps).toBe(25);
  });

  it('advances a loadable exercise by adding load and resetting to the bottom of the range', () => {
    const inp = input({ exercise: HIP_THRUST, state: { load: 10, targetReps: 12, qualifyingStreak: 1 } });
    const out = applyDecision({ action: 'advance', code: 'advance', reason: '' }, inp, 'kg');
    expect(out.state.load).toBe(10 + loadIncrement(HIP_THRUST, 'kg'));
    expect(out.state.targetReps).toBe(HIP_THRUST.prescription.min);
    expect(out.patternLevel).toBe(0); // load, not ladder
  });

  it('advances a bodyweight exercise up the ladder instead of adding load', () => {
    // glute-bridge is rung 0 of the bridge ladder
    const inp = input({ exercise: GLUTE_BRIDGE, state: { load: 0, targetReps: 15, qualifyingStreak: 1 } });
    const out = applyDecision({ action: 'advance', code: 'advance', reason: '' }, inp, 'kg');
    expect(out.patternLevel).toBe(1);
    expect(out.state.load).toBe(0);
  });

  it('grows the range once a bodyweight ladder has no rungs left', () => {
    // scapularRetraction has exactly one rung, so band-pull-apart is already on top
    const pullApart = getExercise('band-pull-apart');
    const inp = input({ exercise: pullApart, state: { load: 0, targetReps: 20, qualifyingStreak: 1 } });
    const out = applyDecision({ action: 'advance', code: 'advance', reason: '' }, inp, 'kg');
    expect(out.patternLevel).toBe(0);
    expect(out.state.targetReps).toBe(21); // past the nominal max
  });

  it('regresses a loaded exercise by shedding load before dropping a rung', () => {
    const inp = input({
      exercise: HIP_THRUST,
      patternLevel: 2,
      state: { load: 10, targetReps: 10, qualifyingStreak: 0 },
    });
    const out = applyDecision({ action: 'regress', code: 'painStop', reason: '' }, inp, 'kg');
    expect(out.state.load).toBe(10 - loadIncrement(HIP_THRUST, 'kg'));
    expect(out.patternLevel).toBe(2); // rung untouched while there is still load to shed
  });

  it('regresses down a rung once there is no load left to shed', () => {
    const inp = input({
      exercise: GLUTE_BRIDGE,
      patternLevel: 2,
      state: { load: 0, targetReps: 10, qualifyingStreak: 0 },
    });
    const out = applyDecision({ action: 'regress', code: 'painStop', reason: '' }, inp, 'kg');
    expect(out.patternLevel).toBe(1);
  });

  it('never regresses the target below one step', () => {
    const inp = input({
      exercise: GLUTE_BRIDGE,
      patternLevel: 0,
      state: { load: 0, targetReps: 1, qualifyingStreak: 0 },
    });
    const out = applyDecision({ action: 'regress', code: 'painStop', reason: '' }, inp, 'kg');
    expect(out.state.targetReps).toBe(1);
  });

  describe('regression guards for bugs found while writing this engine', () => {
    it('a pain-forced hold does not bank progress toward advancing', () => {
      // Bug: `hold` used to increment the streak whenever the target sat at the top
      // of the range — so repeated pain-holds would silently arm an advance.
      const state: ExerciseState = { load: 0, targetReps: 15, qualifyingStreak: 1 };
      const inp = input({
        exercise: GLUTE_BRIDGE,
        state,
        lastSession: cleanSession('glute-bridge', 3, 15),
        symptoms: [{ date: '2026-07-01', region: 'lowBack', nprsDuring: 4 }],
      });
      const d = decideProgression(inp);
      expect(d.code).toBe('painHold');
      const out = applyDecision(d, inp, 'kg');
      expect(out.state.qualifyingStreak).toBe(0);
    });

    it('a missed-target hold does not bank progress toward advancing', () => {
      const state: ExerciseState = { load: 0, targetReps: 15, qualifyingStreak: 1 };
      const missed: SessionPerformance = {
        date: '2026-07-01',
        exerciseId: 'glute-bridge',
        sets: [
          { reps: 15, load: 0, rir: 2 },
          { reps: 15, load: 0, rir: 2 },
          { reps: 12, load: 0, rir: 1 },
        ],
      };
      const inp = input({ exercise: GLUTE_BRIDGE, state, lastSession: missed });
      const d = decideProgression(inp);
      expect(d.code).toBe('targetMissed');
      expect(applyDecision(d, inp, 'kg').state.qualifyingStreak).toBe(0);
    });

    it('a phase-scaled session can still qualify on fewer sets than the base prescription', () => {
      // Bug: `hitTarget` required session.sets.length >= exercise.sets — the BASE set
      // count. Foundation weeks trim a set, so no Foundation session could ever qualify
      // and progression silently never fired for the program's first four weeks.
      const foundationSession: SessionPerformance = {
        date: '2026-07-01',
        exerciseId: 'glute-bridge',
        prescribedSets: 2, // base is 3; Foundation trims one
        sets: [
          { reps: 15, load: 0, rir: 2 },
          { reps: 15, load: 0, rir: 2 },
        ],
      };
      const d = decideProgression(
        input({
          exercise: GLUTE_BRIDGE,
          state: { load: 0, targetReps: 15, qualifyingStreak: 1 },
          lastSession: foundationSession,
        })
      );
      expect(d.action).toBe('advance');
    });

    it('still demands every prescribed set — logging one of three does not qualify', () => {
      const partial: SessionPerformance = {
        date: '2026-07-01',
        exerciseId: 'glute-bridge',
        prescribedSets: 3,
        sets: [{ reps: 15, load: 0, rir: 2 }],
      };
      const d = decideProgression(
        input({
          exercise: GLUTE_BRIDGE,
          state: { load: 0, targetReps: 15, qualifyingStreak: 1 },
          lastSession: partial,
        })
      );
      expect(d.action).toBe('hold');
      expect(d.code).toBe('targetMissed');
    });

    it('a regressed target does not trigger an endless regress spiral', () => {
      // Bug: underperformance was measured against prescription.min. After a
      // regression the target legitimately sits below min, so every subsequent
      // session — however well executed — read as underperformance and regressed
      // again, walking the user down to zero.
      const belowMin: ExerciseState = { load: 0, targetReps: 5, qualifyingStreak: 0 }; // min is 10
      const d = decideProgression(
        input({
          exercise: GLUTE_BRIDGE,
          state: belowMin,
          lastSession: cleanSession('glute-bridge', 3, 5), // exactly on the reduced target
        })
      );
      expect(d.action).not.toBe('regress');
      expect(d.action).toBe('grow');
    });
  });
});

describe('progress() over time — the consequence, not the presence', () => {
  // The bug this guards: a progression system that exists but never fires.
  it('a bodyweight movement climbs its ladder under sustained good performance', () => {
    let patternLevel = 0;
    let exercise = GLUTE_BRIDGE;
    let state = initialState(exercise);

    // Twenty sessions of textbook execution at whatever is currently prescribed.
    for (let i = 0; i < 20; i++) {
      const session = cleanSession(exercise.id, exercise.sets, state.targetReps, 2);
      const out = progress({ exercise, patternLevel, state, lastSession: session }, 'kg');
      if (out.patternLevel !== patternLevel) {
        // Climbed a rung — the new exercise starts from its own floor.
        patternLevel = out.patternLevel;
        exercise = getExercise(
          ['glute-bridge', 'band-glute-bridge', 'hip-thrust', 'single-leg-glute-bridge'][patternLevel]
        );
        state = initialState(exercise);
      } else {
        state = out.state;
      }
    }

    expect(patternLevel).toBeGreaterThan(0);
  });

  it('a loadable movement accumulates load under sustained good performance', () => {
    const exercise = HIP_THRUST;
    let state = initialState(exercise);
    const patternLevel = 2;

    for (let i = 0; i < 20; i++) {
      const session = cleanSession(exercise.id, exercise.sets, state.targetReps, 2);
      state = progress({ exercise, patternLevel, state, lastSession: session }, 'kg').state;
    }

    expect(state.load).toBeGreaterThan(0);
  });

  it('sustained high pain walks the dose back down instead of up', () => {
    const exercise = HIP_THRUST;
    let state: ExerciseState = { load: 20, targetReps: 12, qualifyingStreak: 1 };
    const patternLevel = 2;

    for (let i = 0; i < 3; i++) {
      const session = cleanSession(exercise.id, exercise.sets, state.targetReps, 2);
      state = progress(
        {
          exercise,
          patternLevel,
          state,
          lastSession: session,
          symptoms: [{ date: '2026-07-01', region: 'lowBack', nprsDuring: 8 }],
        },
        'kg'
      ).state;
    }

    expect(state.load).toBeLessThan(20);
  });

  // Two runs differing ONLY in the reported RIR must diverge. If they do not,
  // the RIR input is decorative.
  it('RIR is wired: two histories differing only in reps-in-reserve diverge', () => {
    const exercise = GLUTE_BRIDGE;
    const atTop: ExerciseState = { load: 0, targetReps: 15, qualifyingStreak: 1 };

    const withReserve = progress(
      { exercise, patternLevel: 0, state: atTop, lastSession: cleanSession('glute-bridge', 3, 15, 2) },
      'kg'
    );
    const toFailure = progress(
      { exercise, patternLevel: 0, state: atTop, lastSession: cleanSession('glute-bridge', 3, 15, 0) },
      'kg'
    );

    expect(withReserve.decision.action).toBe('advance');
    expect(toFailure.decision.action).toBe('hold');
    expect(withReserve.patternLevel).not.toBe(toFailure.patternLevel);
  });

  it('load increments differ by equipment and unit', () => {
    expect(loadIncrement(getExercise('goblet-squat'), 'kg')).toBe(4); // kettlebell
    expect(loadIncrement(getExercise('hip-thrust'), 'kg')).toBe(2.5); // dumbbell
    expect(loadIncrement(getExercise('hip-thrust'), 'lbs')).toBe(5);
  });
});

// ═══════════════════════════════════════════════════════════════════
// Detraining — CLINICAL.md §12 limitation #1
//
// The bug these guard: a user who stopped for two months resumed at exactly the dose they
// left. Progression was driven purely by the SEQUENCE of sessions and never looked at the
// time between them, so the calendar could pass without the engine noticing.
// ═══════════════════════════════════════════════════════════════════

describe('detraining after a layoff', () => {
  it('counts whole calendar days, DST-safe', () => {
    expect(daysBetween('2026-03-01', '2026-03-15')).toBe(14);
    // Spans a daylight-saving transition in most northern-hemisphere zones.
    expect(daysBetween('2026-03-01', '2026-04-01')).toBe(31);
    expect(daysBetween('2026-01-05', '2026-01-05')).toBe(0);
  });

  it('costs nothing inside the grace period', () => {
    expect(detrainingSteps(0)).toBe(0);
    expect(detrainingSteps(13)).toBe(0);
    expect(detrainingSteps(14)).toBe(0); // exactly the grace period is still free
  });

  it('costs a step per block of days beyond the grace period', () => {
    expect(detrainingSteps(15)).toBe(1);
    expect(detrainingSteps(28)).toBe(1);
    expect(detrainingSteps(29)).toBe(2);
    expect(detrainingSteps(42)).toBe(2);
  });

  it('caps however long the layoff runs — it never walks the dose to nothing', () => {
    expect(detrainingSteps(365)).toBe(4);
    expect(detrainingSteps(10_000)).toBe(4);
  });

  function snapshotOf(exerciseId: string, state: ExerciseState, lastDate: string, level = 0) {
    const exercise = getExercise(exerciseId);
    return {
      patternLevels: { [exercise.pattern]: level },
      exerciseStates: { [exerciseId]: state },
      decisions: {},
      lastSessionDates: { [exerciseId]: lastDate },
    };
  }

  it('CONSEQUENCE: six weeks away lowers the dose of a loaded movement', () => {
    const before = snapshotOf('hip-thrust', { load: 20, targetReps: 12, qualifyingStreak: 1 }, '2026-01-01');
    const after = applyDetraining(before, '2026-02-12', 'kg'); // 42 days away → 2 steps
    expect(after.exerciseStates['hip-thrust'].load).toBeLessThan(20);
    expect(after.decisions['hip-thrust'].code).toBe('layoff');
  });

  it('CONSEQUENCE: a long layoff drops a bodyweight movement down its ladder', () => {
    const before = snapshotOf('hip-thrust', { load: 0, targetReps: 12, qualifyingStreak: 0 }, '2026-01-01', 2);
    const after = applyDetraining(before, '2026-03-01', 'kg'); // 59 days → 4 steps (capped)
    expect(after.patternLevels.bridge!).toBeLessThan(2);
  });

  it('ten days away changes nothing at all', () => {
    const before = snapshotOf('hip-thrust', { load: 20, targetReps: 12, qualifyingStreak: 1 }, '2026-01-01');
    const after = applyDetraining(before, '2026-01-11', 'kg');
    expect(after.exerciseStates['hip-thrust']).toEqual(before.exerciseStates['hip-thrust']);
    expect(after.decisions['hip-thrust']).toBeUndefined();
  });

  it('never regresses below the floor, however long the absence', () => {
    const before = snapshotOf('glute-bridge', { load: 0, targetReps: 10, qualifyingStreak: 0 }, '2020-01-01');
    const after = applyDetraining(before, '2026-01-01', 'kg');
    expect(after.patternLevels.bridge).toBe(0);
    expect(after.exerciseStates['glute-bridge'].targetReps).toBeGreaterThan(0);
  });

  it('leaves an exercise that was never trained alone', () => {
    const empty = { patternLevels: {}, exerciseStates: {}, decisions: {}, lastSessionDates: {} };
    expect(applyDetraining(empty, '2026-06-01', 'kg')).toEqual(empty);
  });

  it('is idempotent for a given day — it reads the fold, never its own output', () => {
    const before = snapshotOf('hip-thrust', { load: 20, targetReps: 12, qualifyingStreak: 1 }, '2026-01-01');
    const once = applyDetraining(before, '2026-02-12', 'kg');
    const twice = applyDetraining(before, '2026-02-12', 'kg');
    expect(twice).toEqual(once);
  });

  it('a deload week is attendance, not the start of a layoff', () => {
    // Deload sessions are excluded from progression. If they were also excluded from
    // `lastSessionDates`, taking a planned deload would look like time away and quietly
    // detrain the user for recovering on schedule.
    const snap = computeSnapshot({
      sessions: [
        { date: '2026-01-05', exerciseId: 'glute-bridge', prescribedSets: 3, sets: Array.from({ length: 3 }, () => ({ reps: 12, load: 0, rir: 2 })) },
        { date: '2026-01-26', exerciseId: 'glute-bridge', prescribedSets: 1, sets: [{ reps: 12, load: 0, rir: 2 }] }, // deload
      ],
      symptoms: [],
      unit: 'kg',
      isDeloadDate: (d) => d === '2026-01-26',
    });
    expect(snap.lastSessionDates['glute-bridge']).toBe('2026-01-26');
  });

  it('CONSEQUENCE OVER TIME: the dose climbs back after the user returns', () => {
    const exercise = getExercise('hip-thrust');
    const detrained = applyDetraining(
      snapshotOf('hip-thrust', { load: 20, targetReps: 12, qualifyingStreak: 1 }, '2026-01-01'),
      '2026-02-12',
      'kg'
    );
    let state = detrained.exerciseStates['hip-thrust'];
    const loadOnReturn = state.load;

    for (let i = 0; i < 20; i++) {
      const session = cleanSession(exercise.id, exercise.sets, state.targetReps, 2);
      state = progress({ exercise, patternLevel: 2, state, lastSession: session }, 'kg').state;
    }
    expect(state.load).toBeGreaterThan(loadOnReturn);
  });

  it('DETRAINING PARAMETERS ARE WIRED: a shorter grace period bites sooner', () => {
    const before = snapshotOf('hip-thrust', { load: 20, targetReps: 12, qualifyingStreak: 1 }, '2026-01-01');
    const tenDaysLater = '2026-01-11';

    // Default grace is 14 days: ten days away costs nothing.
    expect(applyDetraining(before, tenDaysLater, 'kg').exerciseStates['hip-thrust'].load).toBe(20);

    const strict: ClinicalParameters = {
      ...CLINICAL_PARAMETERS,
      detraining: { gracePeriodDays: 3, daysPerRegressionStep: 3, maxRegressionSteps: 4 },
    };
    expect(
      applyDetraining(before, tenDaysLater, 'kg', strict).exerciseStates['hip-thrust'].load
    ).toBeLessThan(20);
  });
});

describe('legacy increments', () => {
  it('load increments differ by equipment and unit', () => {
    expect(loadIncrement(getExercise('goblet-squat'), 'kg')).toBe(4); // kettlebell
    expect(loadIncrement(getExercise('hip-thrust'), 'kg')).toBe(2.5); // dumbbell
    expect(loadIncrement(getExercise('hip-thrust'), 'lbs')).toBe(5);
  });
});
