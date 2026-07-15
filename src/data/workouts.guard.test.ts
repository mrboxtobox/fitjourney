// Guard suite — consequence, not presence.
//
// Every test here fails if a feature exists in the code but never actually happens
// in a real playthrough. Rendering without errors is not evidence of anything.

import { describe, it, expect } from 'vitest';
import {
  getWorkoutForDate,
  buildSessionSteps,
  isDeloadWeek,
  isRestDay,
  weekForDate,
  getPhaseInfo,
  EMPTY_SNAPSHOT,
  type ProgressionSnapshot,
  type WorkoutDay,
} from './workouts';
import { EXERCISES, getExercise, hasExercise, formatTarget, formatTargetCompact } from './exercises';
import { LADDERS, type MovementPattern } from './ladders';
import { computeSnapshot, type SessionPerformance, type SymptomReport } from '../lib/progression';

const START = new Date('2026-01-05T00:00:00'); // a Monday

function dayOffset(n: number): Date {
  const d = new Date(START);
  d.setDate(d.getDate() + n);
  return d;
}

function toSnapshot(s: ReturnType<typeof computeSnapshot>): ProgressionSnapshot {
  return { patternLevels: s.patternLevels, exerciseStates: s.exerciseStates, decisions: s.decisions };
}

// Play a session perfectly: every PRESCRIBED set hits its target with two reps in
// reserve. It logs exactly `px.sets` — the phase- and deload-scaled count the user is
// actually shown — not the exercise's base set count. Simulating the base count is what
// let the "Foundation never progresses" bug hide behind a green suite.
function perfectSessions(workout: WorkoutDay, date: string): SessionPerformance[] {
  return workout.exercises
    .filter((px) => px.exercise.block !== 'mobility')
    .map((px) => ({
      date,
      exerciseId: px.exercise.id,
      prescribedSets: px.sets,
      sets: Array.from({ length: px.sets }, () => ({
        reps: px.target,
        load: px.load,
        rir: 2,
      })),
    }));
}

function dateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// ═══════════════════════════════════════════════════════════════════
// No dead ladder entries
// ═══════════════════════════════════════════════════════════════════

describe('ladders resolve to real exercises', () => {
  it('every rung of every ladder names an exercise that exists', () => {
    for (const ladder of Object.values(LADDERS)) {
      for (const level of ladder.levels) {
        expect(hasExercise(level.exerciseId), `${ladder.pattern} → ${level.exerciseId}`).toBe(true);
      }
    }
  });

  it('every rung sits on the pattern its ladder claims', () => {
    for (const ladder of Object.values(LADDERS)) {
      for (const level of ladder.levels) {
        expect(getExercise(level.exerciseId).pattern).toBe(ladder.pattern);
      }
    }
  });

  it('every non-mobility exercise is reachable from some ladder', () => {
    const reachable = new Set(
      Object.values(LADDERS).flatMap((l) => l.levels.map((lv) => lv.exerciseId))
    );
    const orphans = EXERCISES.filter((e) => e.pattern !== 'mobility' && !reachable.has(e.id));
    expect(orphans.map((e) => e.id)).toEqual([]);
  });

  it('getExercise throws on an unknown id rather than returning a fallback', () => {
    expect(() => getExercise('does-not-exist')).toThrow();
  });
});

// ═══════════════════════════════════════════════════════════════════
// Rest days and deloads actually occur
// ═══════════════════════════════════════════════════════════════════

describe('rest days and deloads happen', () => {
  it('produces a rest day every week — the type was previously never emitted', () => {
    const kinds = Array.from({ length: 14 }, (_, i) => getWorkoutForDate(dayOffset(i), START).type);
    expect(kinds).toContain('rest');
    expect(kinds.filter((k) => k === 'rest')).toHaveLength(2); // one per week
  });

  it('rest lands on Sunday and nowhere else', () => {
    for (let i = 0; i < 28; i++) {
      const d = dayOffset(i);
      const w = getWorkoutForDate(d, START);
      expect(w.type === 'rest').toBe(isRestDay(d.getDay()));
    }
  });

  it('a rest day prescribes nothing at all', () => {
    const sunday = Array.from({ length: 7 }, (_, i) => dayOffset(i)).find((d) => d.getDay() === 0)!;
    const w = getWorkoutForDate(sunday, START);
    expect(w.exercises).toEqual([]);
    expect(w.finisher).toBeNull();
    expect(w.warmup).toEqual([]);
  });

  it('the phase a week falls in matches the label that week is shown', () => {
    // A reviewer moving a phase boundary must not leave "Weeks 1-4" on a phase that now
    // ends at week 6.
    for (const week of [1, 4, 5, 12, 13, 26, 27, 60]) {
      const phase = getPhaseInfo(week);
      const [from, to] = phase.weeks.replace('+', '-999').split('-').map(Number);
      expect(week, `week ${week} labelled "${phase.weeks}"`).toBeGreaterThanOrEqual(from);
      expect(week, `week ${week} labelled "${phase.weeks}"`).toBeLessThanOrEqual(to);
    }
  });

  it('every fourth week is a deload', () => {
    expect(isDeloadWeek(4)).toBe(true);
    expect(isDeloadWeek(8)).toBe(true);
    expect(isDeloadWeek(1)).toBe(false);
    expect(isDeloadWeek(0)).toBe(false);
  });

  it('the week counter keeps counting past 52', () => {
    // It used to clamp at 52. Since isDeloadWeek(52) is true and deload sessions are
    // excluded from progression, every day after the first year read as a deload and
    // the user's prescription froze forever.
    expect(weekForDate(dayOffset(7 * 52), START)).toBeGreaterThan(52);
    expect(weekForDate(dayOffset(7 * 80), START)).toBe(81);
  });

  it('does not turn every day after a year into a deload', () => {
    const secondYear = Array.from({ length: 8 }, (_, i) => 7 * (52 + i)).map((d) =>
      isDeloadWeek(weekForDate(dayOffset(d), START))
    );
    expect(secondYear.some((d) => d)).toBe(true); // deloads still happen
    expect(secondYear.every((d) => d)).toBe(false); // but not every week
  });

  it('still progresses in the second year', () => {
    // The consequence of the clamp bug: a session logged in year two was skipped by the
    // fold, so nothing the user did could ever raise the dose again.
    const yearTwo = dateStr(dayOffset(7 * 60 + 1));
    const snapshot = computeSnapshot({
      sessions: [
        { date: yearTwo, exerciseId: 'glute-bridge', sets: Array.from({ length: 3 }, () => ({ reps: 12, load: 0, rir: 2 })) },
      ],
      symptoms: [],
      unit: 'kg',
      isDeloadDate: (d) => isDeloadWeek(weekForDate(new Date(`${d}T00:00:00`), START)),
    });
    expect(snapshot.exerciseStates['glute-bridge']).toBeDefined();
  });

  it('a deload week really carries less volume than the week before it', () => {
    // Week 3 (day 14) and week 4 (day 21) are both Mondays, same phase, same patterns.
    const normal = getWorkoutForDate(dayOffset(14), START);
    const deload = getWorkoutForDate(dayOffset(21), START);

    expect(normal.isDeload).toBe(false);
    expect(deload.isDeload).toBe(true);

    const totalSets = (w: WorkoutDay) => w.exercises.reduce((n, px) => n + px.sets, 0);
    expect(totalSets(deload)).toBeLessThan(totalSets(normal));
  });

  it('a deload week shortens the finisher', () => {
    const normal = getWorkoutForDate(dayOffset(14), START).finisher!;
    const deload = getWorkoutForDate(dayOffset(21), START).finisher!;
    const dose = (f: typeof normal) => f.rounds ?? f.durationSeconds ?? 0;
    expect(dose(deload)).toBeLessThan(dose(normal));
  });
});

// ═══════════════════════════════════════════════════════════════════
// The prescription responds to history — the headline bug
// ═══════════════════════════════════════════════════════════════════

describe('progression actually happens over a playthrough', () => {
  it('the same date with an empty history is identical every time (baseline)', () => {
    const a = getWorkoutForDate(dayOffset(0), START, EMPTY_SNAPSHOT);
    const b = getWorkoutForDate(dayOffset(0), START, EMPTY_SNAPSHOT);
    expect(a.exercises.map((e) => e.exercise.id)).toEqual(b.exercises.map((e) => e.exercise.id));
  });

  it('twelve weeks of good training changes what is prescribed', () => {
    // The original program returned an identical workout for a given weekday for
    // eight straight weeks. Simulate a real playthrough and assert it diverges.
    const sessions: SessionPerformance[] = [];
    let snapshot: ProgressionSnapshot = EMPTY_SNAPSHOT;

    const firstMonday = getWorkoutForDate(dayOffset(0), START, EMPTY_SNAPSHOT);
    const before = firstMonday.exercises.map((px) => `${px.exercise.id}@${px.target}+${px.load}`);

    for (let day = 0; day < 84; day++) {
      const date = dayOffset(day);
      const workout = getWorkoutForDate(date, START, snapshot);
      if (workout.type === 'rest') continue;
      sessions.push(...perfectSessions(workout, dateStr(date)));
      snapshot = toSnapshot(
        computeSnapshot({
          sessions,
          symptoms: [],
          unit: 'kg',
          isDeloadDate: () => false,
        })
      );
    }

    const laterMonday = getWorkoutForDate(dayOffset(84), START, snapshot);
    const after = laterMonday.exercises.map((px) => `${px.exercise.id}@${px.target}+${px.load}`);

    expect(after).not.toEqual(before);
  });

  it('sustained good training climbs at least one ladder', () => {
    const sessions: SessionPerformance[] = [];
    let snapshot: ProgressionSnapshot = EMPTY_SNAPSHOT;

    for (let day = 0; day < 84; day++) {
      const date = dayOffset(day);
      const workout = getWorkoutForDate(date, START, snapshot);
      if (workout.type === 'rest') continue;
      sessions.push(...perfectSessions(workout, dateStr(date)));
      snapshot = toSnapshot(
        computeSnapshot({ sessions, symptoms: [], unit: 'kg', isDeloadDate: () => false })
      );
    }

    const climbed = Object.entries(snapshot.patternLevels).filter(([, level]) => (level ?? 0) > 0);
    expect(climbed.length).toBeGreaterThan(0);
  });

  it('sustained good training adds load to at least one loadable movement', () => {
    const sessions: SessionPerformance[] = [];
    let snapshot: ProgressionSnapshot = EMPTY_SNAPSHOT;

    for (let day = 0; day < 84; day++) {
      const date = dayOffset(day);
      const workout = getWorkoutForDate(date, START, snapshot);
      if (workout.type === 'rest') continue;
      sessions.push(...perfectSessions(workout, dateStr(date)));
      snapshot = toSnapshot(
        computeSnapshot({ sessions, symptoms: [], unit: 'kg', isDeloadDate: () => false })
      );
    }

    const loaded = Object.values(snapshot.exerciseStates).filter((s) => s.load > 0);
    expect(loaded.length).toBeGreaterThan(0);
  });

  // Input-effect: two playthroughs differing ONLY in reported pain must diverge.
  // If they don't, the pain input is decorative.
  it('pain is wired: an identical playthrough with knee pain prescribes differently', () => {
    const run = (symptomFor: (date: string) => SymptomReport[]) => {
      const sessions: SessionPerformance[] = [];
      const symptoms: SymptomReport[] = [];
      let snapshot: ProgressionSnapshot = EMPTY_SNAPSHOT;

      for (let day = 0; day < 42; day++) {
        const date = dayOffset(day);
        const workout = getWorkoutForDate(date, START, snapshot);
        if (workout.type === 'rest') continue;
        const ds = dateStr(date);
        sessions.push(...perfectSessions(workout, ds));
        symptoms.push(...symptomFor(ds));
        snapshot = toSnapshot(
          computeSnapshot({ sessions, symptoms, unit: 'kg', isDeloadDate: () => false })
        );
      }
      return snapshot;
    };

    const healthy = run(() => []);
    const soreKnee = run((date) => [{ date, region: 'knee', nprsDuring: 7 }]);

    // The squat pattern is knee-loaded; it must not have climbed under pain.
    expect(healthy.patternLevels.squat ?? 0).toBeGreaterThanOrEqual(
      soreKnee.patternLevels.squat ?? 0
    );
    expect(JSON.stringify(healthy)).not.toEqual(JSON.stringify(soreKnee));
  });

  it('knee pain does not hold back movements that do not load the knee', () => {
    const sessions: SessionPerformance[] = [];
    const symptoms: SymptomReport[] = [];
    let snapshot: ProgressionSnapshot = EMPTY_SNAPSHOT;

    for (let day = 0; day < 42; day++) {
      const date = dayOffset(day);
      const workout = getWorkoutForDate(date, START, snapshot);
      if (workout.type === 'rest') continue;
      const ds = dateStr(date);
      sessions.push(...perfectSessions(workout, ds));
      symptoms.push({ date: ds, region: 'knee', nprsDuring: 8 });
      snapshot = toSnapshot(
        computeSnapshot({ sessions, symptoms, unit: 'kg', isDeloadDate: () => false })
      );
    }

    // scapularRetraction is shoulder-only; severe knee pain must not touch it.
    const pullApart = snapshot.exerciseStates['band-pull-apart'];
    expect(pullApart).toBeDefined();
    expect(pullApart.targetReps).toBeGreaterThan(getExercise('band-pull-apart').prescription.min);
  });

  it('deload sessions never reset a hard-won qualifying streak', () => {
    // A deload prescribes fewer sets, so it can never "hit the target". Folding it
    // into progression would silently punish the user for recovering on schedule.
    //
    // glute-bridge runs 10–15 reps over 3 sets. Six full sessions walk the target
    // from 10 up to 15 and bank one qualifying session at the top.
    const full = (date: string) => ({
      date,
      exerciseId: 'glute-bridge',
      sets: Array.from({ length: 3 }, () => ({ reps: 15, load: 0, rir: 2 })),
    });
    const deloadSession = {
      date: '2026-01-26',
      exerciseId: 'glute-bridge',
      sets: [{ reps: 15, load: 0, rir: 2 }], // one set, not three
    };
    const sessions = [
      full('2026-01-05'),
      full('2026-01-06'),
      full('2026-01-07'),
      full('2026-01-08'),
      full('2026-01-09'),
      full('2026-01-10'), // target now at the top of the range → streak 1
      deloadSession,
    ];

    const skipped = computeSnapshot({
      sessions,
      symptoms: [],
      unit: 'kg',
      isDeloadDate: (d) => d === '2026-01-26',
    });
    expect(skipped.exerciseStates['glute-bridge'].targetReps).toBe(15);
    expect(skipped.exerciseStates['glute-bridge'].qualifyingStreak).toBe(1);

    // And prove the guard is load-bearing: folding the deload in DOES reset it.
    const folded = computeSnapshot({ sessions, symptoms: [], unit: 'kg' });
    expect(folded.exerciseStates['glute-bridge'].qualifyingStreak).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════
// The session actually asks for the data the engine needs
// ═══════════════════════════════════════════════════════════════════

describe('the guided session captures what the engine consumes', () => {
  const workout = getWorkoutForDate(dayOffset(0), START);
  const steps = buildSessionSteps(workout);

  it('ends by asking about symptoms — nothing else feeds the safety gate', () => {
    expect(steps.filter((s) => s.kind === 'symptom-check')).toHaveLength(1);
    expect(steps[steps.length - 1].kind).toBe('symptom-check');
  });

  it('offers a log step for every non-mobility exercise', () => {
    const logged = new Set(steps.filter((s) => s.kind === 'log').map((s) => s.exerciseId));
    const expected = workout.exercises
      .filter((px) => px.exercise.block !== 'mobility')
      .map((px) => px.exercise.id);
    for (const id of expected) expect(logged.has(id), `no log step for ${id}`).toBe(true);
  });

  it('never leaves a rest step dangling at the end', () => {
    expect(steps[steps.length - 1].kind).not.toBe('rest');
  });

  it('gives every rest step a name for what comes next', () => {
    for (const s of steps) {
      if (s.kind === 'rest') expect(s.nextName).not.toBe('');
    }
  });

  it('every work step names a real exercise', () => {
    for (const s of steps) {
      if (s.kind === 'work') expect(hasExercise(s.id)).toBe(true);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════
// Programming balance
// ═══════════════════════════════════════════════════════════════════

describe('programming balance', () => {
  it('trains a horizontal pull during the week — the program previously had none', () => {
    const patterns = new Set<MovementPattern>();
    for (let i = 0; i < 7; i++) {
      const w = getWorkoutForDate(dayOffset(i), START);
      w.exercises.forEach((px) => patterns.add(px.exercise.pattern));
    }
    expect(patterns.has('horizontalPull')).toBe(true);
    expect(patterns.has('horizontalPush')).toBe(true);
  });

  it('trains every core anti-movement pattern during the week', () => {
    const patterns = new Set<MovementPattern>();
    for (let i = 0; i < 7; i++) {
      const w = getWorkoutForDate(dayOffset(i), START);
      w.exercises.forEach((px) => patterns.add(px.exercise.pattern));
    }
    expect(patterns.has('antiExtension')).toBe(true);
    expect(patterns.has('antiRotation')).toBe(true);
    expect(patterns.has('antiLateralFlexion')).toBe(true);
  });

  it('keeps the day lean: at most six exercises, cooldown included', () => {
    // The program went deep instead of wide: two core patterns, a main lift, one
    // glute accessory, one arm move, one stretch. Ten-exercise days were the bug.
    for (let i = 0; i < 14; i++) {
      const w = getWorkoutForDate(dayOffset(i), START);
      if (w.type === 'rest') continue;
      expect(w.exercises.length, dateStr(dayOffset(i))).toBeLessThanOrEqual(6);
    }
  });

  it('still trains every laddered pattern within two weeks', () => {
    // A lean day must not strand a pattern. Anything with a ladder has to appear
    // somewhere in the rotation, or its rungs are dead code.
    const patterns = new Set<MovementPattern>();
    for (let i = 0; i < 14; i++) {
      const w = getWorkoutForDate(dayOffset(i), START);
      w.exercises.forEach((px) => patterns.add(px.exercise.pattern));
    }
    for (const pattern of Object.keys(LADDERS) as MovementPattern[]) {
      expect(patterns.has(pattern), `pattern never trained: ${pattern}`).toBe(true);
    }
  });

  it('rotates the shared Saturday arm slot week by week', () => {
    // One arm slot, two Saturday patterns: with no rotation, one of them would
    // exist in the library and never occur in a playthrough.
    const saturdays = [5, 12].map((i) => getWorkoutForDate(dayOffset(i), START));
    const armPatterns = saturdays.map(
      (w) => w.exercises.find((px) => px.exercise.block === 'arms')!.exercise.pattern
    );
    expect(new Set(armPatterns).size).toBe(2);
  });

  it('runs the main lift as straight sets between the two supersets', () => {
    // The session must read: core pair → main lift → accessory pair. The main
    // lift is the deep work; burying it after the band work would be a bug.
    const w = getWorkoutForDate(dayOffset(0), START); // Monday: hinge is the main
    const paired = new Set(w.supersets.flatMap((p) => p.exerciseIds));
    const main = w.exercises.find(
      (px) => px.exercise.block === 'strength' && !paired.has(px.exercise.id)
    );
    expect(main, 'an unpaired main strength lift must exist').toBeDefined();

    const steps = buildSessionSteps(w);
    const firstWorkIdx = (id: string) => steps.findIndex((s) => s.kind === 'work' && s.id === id);
    const coreFirst = firstWorkIdx(w.supersets[0].exerciseIds[0]);
    const mainFirst = firstWorkIdx(main!.exercise.id);
    const accessoryFirst = firstWorkIdx(w.supersets[1].exerciseIds[0]);
    expect(coreFirst).toBeLessThan(mainFirst);
    expect(mainFirst).toBeLessThan(accessoryFirst);
  });

  it('the ladder path is wired to the snapshot, not decorative', () => {
    // The sheet shows "you are here" + what unlocks next. If a raised pattern level
    // doesn't move it, the path is a drawing of the engine, not a window into it.
    const fresh = getWorkoutForDate(dayOffset(0), START, EMPTY_SNAPSHOT);
    const bridgeFresh = fresh.exercises.find((px) => px.exercise.pattern === 'bridge')!;
    expect(bridgeFresh.progress).toBeDefined();
    expect(bridgeFresh.progress!.level).toBe(0);
    expect(bridgeFresh.progress!.next?.name).toBe(bridgeFresh.progress!.rungs[1].name);

    const climbed = getWorkoutForDate(dayOffset(0), START, {
      ...EMPTY_SNAPSHOT,
      patternLevels: { bridge: 2 },
    });
    const bridgeClimbed = climbed.exercises.find((px) => px.exercise.pattern === 'bridge')!;
    expect(bridgeClimbed.progress!.level).toBe(2);
    expect(bridgeClimbed.progress!.next?.name).toBe(bridgeClimbed.progress!.rungs[3].name);

    // Mobility has no ladder and must not pretend to.
    const stretch = fresh.exercises.find((px) => px.exercise.block === 'mobility')!;
    expect(stretch.progress).toBeUndefined();
  });

  it('never supersets an exercise with itself', () => {
    for (let i = 0; i < 14; i++) {
      const w = getWorkoutForDate(dayOffset(i), START);
      for (const pair of w.supersets) {
        expect(pair.exerciseIds[0]).not.toBe(pair.exerciseIds[1]);
      }
    }
  });

  it('every superset names exercises that are actually in the day', () => {
    for (let i = 0; i < 14; i++) {
      const w = getWorkoutForDate(dayOffset(i), START);
      const present = new Set(w.exercises.map((px) => px.exercise.id));
      for (const pair of w.supersets) {
        expect(present.has(pair.exerciseIds[0])).toBe(true);
        expect(present.has(pair.exerciseIds[1])).toBe(true);
      }
    }
  });
});

// ═══════════════════════════════════════════════════════════════════
// Clinical content completeness
// ═══════════════════════════════════════════════════════════════════

describe('clinical content is present on every exercise', () => {
  it('every exercise states what a good rep looks like', () => {
    for (const ex of EXERCISES) {
      expect(ex.standard.length, ex.id).toBeGreaterThan(20);
    }
  });

  it('every exercise lists at least two common faults', () => {
    for (const ex of EXERCISES) {
      expect(ex.faults.length, ex.id).toBeGreaterThanOrEqual(2);
    }
  });

  it('every prescription has a range the engine can progress through', () => {
    for (const ex of EXERCISES) {
      expect(ex.prescription.max, ex.id).toBeGreaterThanOrEqual(ex.prescription.min);
    }
  });

  it('every non-mobility exercise leaves reps in reserve rather than going to failure', () => {
    for (const ex of EXERCISES) {
      if (ex.block === 'mobility') continue;
      expect(ex.targetRIR, ex.id).toBeGreaterThan(0);
    }
  });

  // The row states the dose on one line beside the exercise name. A prose target
  // ("10s each side") overflowed that line and was clipped at the screen edge.
  it('compresses every target so a one-line dose cannot overflow the row', () => {
    for (const e of EXERCISES) {
      const target = e.prescription.min;
      const prose = formatTarget(e.prescription, target);
      const compact = formatTargetCompact(e.prescription, target);

      expect(compact.length, `${e.id}: compact must not be longer than prose`).toBeLessThanOrEqual(
        prose.length
      );
      // "each side" is what blew the row. Steps keep their unit; nothing else needs one.
      expect(compact, e.id).not.toContain('each side');
      if (e.prescription.kind !== 'steps') {
        expect(compact, e.id).not.toMatch(/reps|hold/);
      }
    }
  });

  it('keeps the prose target for the sheet and the guided session', () => {
    // The compact form is for the row only. Losing the prose would make the session
    // read "3 × 10" aloud where it must say "10 each side".
    // `steps` has no perSide, so narrow on kind before reading it.
    const perSideReps = EXERCISES.find((e) => e.prescription.kind === 'reps' && e.prescription.perSide);
    const perSideHold = EXERCISES.find((e) => e.prescription.kind === 'hold' && e.prescription.perSide);
    expect(perSideReps ?? perSideHold, 'a per-side exercise must exist').toBeDefined();

    if (perSideReps) {
      expect(formatTarget(perSideReps.prescription, 10)).toBe('10 each side');
      expect(formatTargetCompact(perSideReps.prescription, 10)).toBe('10/side');
    }
    if (perSideHold) {
      // A hold keeps its unit — "10/side" would read as ten repetitions, not ten seconds.
      expect(formatTarget(perSideHold.prescription, 10)).toBe('10s each side');
      expect(formatTargetCompact(perSideHold.prescription, 10)).toBe('10s/side');
    }
  });
});
