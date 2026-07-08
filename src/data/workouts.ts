// Idaraya — programming.
//
// This module answers one question: given a date and what the user has earned so
// far, what is today's session? It never invents difficulty. Which *pattern* you
// train is a function of the day; which *rung* of that pattern, and at what load,
// is entirely the progression engine's call (../lib/progression.ts).
//
// Goals (in priority): glutes, core & abs, toned arms, real sweat.
// Constraints: knee-friendly (low-impact, hinge-dominant, controlled range).
// Equipment: bodyweight, kettlebell, dumbbells, mini loop bands.

import {
  getExercise,
  formatTarget,
  formatTargetCompact,
  holdSeconds,
  WARMUP,
  type Exercise,
  type WarmupExercise,
  type Tempo,
} from './exercises';
import { levelExerciseId, type MovementPattern } from './ladders';
import { initialState, type ExerciseState, type ProgressionDecision } from '../lib/progression';
import { SCHEDULE, PHASE_LAST_WEEK, PAIN_BANDS, AUTOREGULATION } from '../clinical/parameters';

export type { Block, Exercise, WarmupExercise, Prescription, Tempo, MuscleFocus } from './exercises';
export { getMuscleFocus, EXERCISES, EXERCISE_MUSCLES, getExercise, formatTempo, formatRange } from './exercises';
export type { MovementPattern } from './ladders';

// ═══════════════════════════════════════════════════════════════════
// THE DAY'S PRESCRIPTION
// ═══════════════════════════════════════════════════════════════════

// An exercise plus the exact dose the engine has arrived at for today.
export interface PrescribedExercise {
  exercise: Exercise;
  sets: number; // after phase and deload scaling
  target: number; // reps, seconds, or steps — whatever the prescription measures
  targetLabel: string; // the same, as prose
  targetLabelShort: string; // the same, compressed for a one-line row
  load: number; // 0 for bodyweight and bands
  holdFor?: number; // seconds, when this is a timed hold
  tempo?: Tempo;
  decision?: ProgressionDecision; // why today's dose is what it is
}

// The engine's persisted view of the user. Levels are per movement pattern; loads
// and rep targets are per exercise.
export interface ProgressionSnapshot {
  patternLevels: Partial<Record<MovementPattern, number>>;
  exerciseStates: Record<string, ExerciseState>;
  decisions?: Record<string, ProgressionDecision>;
}

export const EMPTY_SNAPSHOT: ProgressionSnapshot = { patternLevels: {}, exerciseStates: {} };

// A superset pairs two non-competing exercises done back-to-back;
// rest comes only after the pair. This is what keeps the heart rate up.
export interface SupersetPair {
  exerciseIds: [string, string];
  restAfterPair: number;
}

export interface WorkoutDay {
  type: 'workout' | 'rest';
  week: number;
  phase: Phase;
  isDeload: boolean;
  exercises: PrescribedExercise[];
  supersets: SupersetPair[];
  finisher: Finisher | null;
  warmup: WarmupExercise[];
}

// ═══════════════════════════════════════════════════════════════════
// FINISHERS — 4-6 minute scored metabolic blocks. The sweat lives here.
// All knee-friendly: hinges, bridges, carries, band work. No jumping.
// ═══════════════════════════════════════════════════════════════════

export interface Finisher {
  id: string;
  name: string;
  tagline: string;
  format: 'intervals' | 'amrap';
  workSeconds?: number;
  restSeconds?: number;
  rounds?: number;
  durationSeconds?: number;
  task?: string;
  scoreUnit: string;
  scoreCue: string;
  equipment?: string[];
  kneeNote?: string;
}

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

// Foundation and deload each take one step off the finisher, and they stack: a
// deload week inside Foundation must still be easier than the Foundation week
// before it, or the deload is decorative. Magnitudes: CLINICAL_PARAMETERS.
function scaleFinisher(finisher: Finisher, phase: Phase, isDeload: boolean): Finisher {
  const steps = (phase === 'foundation' ? 1 : 0) + (isDeload ? 1 : 0);
  if (steps === 0) return finisher;
  if (finisher.format === 'intervals') {
    return {
      ...finisher,
      rounds: Math.max(
        SCHEDULE.finisherMinRounds,
        (finisher.rounds ?? 6) - SCHEDULE.finisherRoundReductionPerStep * steps
      ),
    };
  }
  return {
    ...finisher,
    durationSeconds: Math.max(
      SCHEDULE.finisherMinSeconds,
      (finisher.durationSeconds ?? 240) - SCHEDULE.finisherSecondsReductionPerStep * steps
    ),
  };
}

export function getFinisherForDate(dayOfWeek: number, phase: Phase, isDeload: boolean): Finisher {
  return scaleFinisher(FINISHERS[dayOfWeek % FINISHERS.length], phase, isDeload);
}

// ═══════════════════════════════════════════════════════════════════
// PHASED PROGRESSION — the ramp the calendar is still allowed to control.
// Difficulty belongs to the engine; phases only govern volume.
// ═══════════════════════════════════════════════════════════════════

export type Phase = 'foundation' | 'build' | 'strength' | 'sustain';

export interface PhaseInfo {
  key: Phase;
  name: string;
  weeks: string;
  description: string;
  focus: string[];
}

// The displayed week range is derived, never written by hand: a reviewer who moves a
// phase boundary in src/clinical/parameters.ts must not leave the label contradicting it.
const { foundation: F, build: B, strength: S } = PHASE_LAST_WEEK;

export const PHASES: Record<Phase, PhaseInfo> = {
  foundation: {
    key: 'foundation',
    name: 'Foundation',
    weeks: `1-${F}`,
    description: 'Wake up the glutes and core. Light, controlled, knee-friendly.',
    focus: ['Glute activation', 'Core stability', 'Hip hinge', 'Mobility'],
  },
  build: {
    key: 'build',
    name: 'Build',
    weeks: `${F + 1}-${B}`,
    description: 'Add volume. Direct ab and arm work enters.',
    focus: ['Hip thrust', 'Loaded hinge', 'Abs', 'Dumbbell arms'],
  },
  strength: {
    key: 'strength',
    name: 'Strength',
    weeks: `${B + 1}-${S}`,
    description: 'Fuller volume across every pattern. The ladders start to bite.',
    focus: ['Single-leg glutes', 'KB swing', 'Plank progression', 'Arms'],
  },
  sustain: {
    key: 'sustain',
    name: 'Sustain',
    weeks: `${S + 1}+`,
    description: 'Full balanced program. Keep showing up.',
    focus: ['Glutes', 'Core & abs', 'Arms', 'Mobility'],
  },
};

const PHASE_ORDER: Phase[] = ['foundation', 'build', 'strength', 'sustain'];

export function getPhaseForWeek(week: number): Phase {
  if (week <= PHASE_LAST_WEEK.foundation) return 'foundation';
  if (week <= PHASE_LAST_WEEK.build) return 'build';
  if (week <= PHASE_LAST_WEEK.strength) return 'strength';
  return 'sustain';
}

export function getPhaseInfo(week: number): PhaseInfo {
  return PHASES[getPhaseForWeek(week)];
}

// Every Nth week is a deload: one fewer set of everything, a shorter finisher.
// Training without planned recovery is how a year-long program ends in month two.
export function isDeloadWeek(week: number): boolean {
  return week > 0 && week % SCHEDULE.deloadEveryNWeeks === 0;
}

// One rest day a week. The original program ran seven days a week forever.
export function isRestDay(dayOfWeek: number): boolean {
  return dayOfWeek === SCHEDULE.restDayOfWeek;
}

// ═══════════════════════════════════════════════════════════════════
// THE WEEKLY TEMPLATE — which patterns are trained on which day
// ═══════════════════════════════════════════════════════════════════

// Core is trained daily: the McGill anti-movement trio plus one anti-extension move.
const CORE_PATTERNS: MovementPattern[] = [
  'trunkFlexion',
  'antiLateralFlexion',
  'antiRotation',
  'antiExtension',
];

// Indexed by day of week, Monday (1) through Saturday (6). Sunday rests.
const STRENGTH_BY_DAY: Record<number, MovementPattern[]> = {
  1: ['hinge', 'bridge', 'abduction'],
  2: ['squat', 'hipExtension', 'bridge'],
  3: ['hinge', 'abduction', 'bridge'],
  4: ['carry', 'bridge', 'hipExtension'],
  5: ['hinge', 'bridge', 'abduction'],
  6: ['squat', 'hipExtension', 'bridge'],
};

const ARMS_BY_DAY: Record<number, MovementPattern[]> = {
  1: ['horizontalPush', 'horizontalPull'],
  2: ['verticalPush', 'scapularRetraction'],
  3: ['horizontalPull', 'elbowFlexion'],
  4: ['horizontalPush', 'elbowExtension'],
  5: ['verticalPush', 'horizontalPull'],
  6: ['lateralRaise', 'scapularRetraction'],
};

// Cooldown stretches don't progress, so they aren't ladders — just a rotation.
const MOBILITY_POOL = ['couch-stretch', '90-90', 'pigeon-stretch', 'deep-squat-hold'];

// ═══════════════════════════════════════════════════════════════════
// RESOLVING A PATTERN INTO TODAY'S DOSE
// ═══════════════════════════════════════════════════════════════════

// Volume scaling. Foundation trims a set; a deload week trims another. Never below one.
// Foundation only trims exercises that carry more than two sets, so the low-volume
// stability work is not thinned out further.
function scaledSets(base: number, phase: Phase, isDeload: boolean): number {
  let sets = base;
  if (phase === 'foundation' && sets > 2) sets -= SCHEDULE.foundationSetReduction;
  if (isDeload) sets -= SCHEDULE.deloadSetReduction;
  return Math.max(1, sets);
}

function prescribe(
  exercise: Exercise,
  snapshot: ProgressionSnapshot,
  phase: Phase,
  isDeload: boolean
): PrescribedExercise {
  const state = snapshot.exerciseStates[exercise.id] ?? initialState(exercise);
  const target = state.targetReps;
  return {
    exercise,
    sets: scaledSets(exercise.sets, phase, isDeload),
    target,
    targetLabel: formatTarget(exercise.prescription, target),
    targetLabelShort: formatTargetCompact(exercise.prescription, target),
    load: state.load,
    holdFor: holdSeconds(exercise.prescription, target),
    tempo: exercise.tempo,
    decision: snapshot.decisions?.[exercise.id],
  };
}

// The rung the user has earned for this pattern. Throws on an unknown id rather
// than silently substituting a default — a stranded ladder entry is a bug.
function exerciseForPattern(pattern: MovementPattern, snapshot: ProgressionSnapshot): Exercise {
  const level = snapshot.patternLevels[pattern] ?? 0;
  const id = levelExerciseId(pattern, level);
  if (!id) throw new Error(`No ladder for pattern: ${pattern}`);
  return getExercise(id);
}

function pick<T>(arr: T[], dayOfWeek: number, offset = 0): T {
  return arr[(dayOfWeek + offset) % arr.length];
}

// ═══════════════════════════════════════════════════════════════════
// BUILDING THE DAY
// ═══════════════════════════════════════════════════════════════════

export function getWorkoutForDate(
  date: Date,
  startDate: Date,
  snapshot: ProgressionSnapshot = EMPTY_SNAPSHOT
): WorkoutDay {
  const dayOfWeek = date.getDay();
  const week = weekForDate(date, startDate);
  const phase = getPhaseForWeek(week);
  const isDeload = isDeloadWeek(week);

  if (isRestDay(dayOfWeek)) {
    return {
      type: 'rest',
      week,
      phase,
      isDeload,
      warmup: [],
      exercises: [],
      supersets: [],
      finisher: null,
    };
  }

  // Core: the anti-movement trio plus anti-extension, every training day in every
  // phase. Dropping one in Foundation would leave a whole anti-movement class
  // untrained for four weeks; volume is reduced by set count instead.
  const core = CORE_PATTERNS.map((p) => exerciseForPattern(p, snapshot));

  // Strength: three glute-dominant patterns, rotating by day.
  const strengthPatterns = STRENGTH_BY_DAY[dayOfWeek] ?? STRENGTH_BY_DAY[1];
  const strength = strengthPatterns.map((p) => exerciseForPattern(p, snapshot));

  // Arms: two patterns, one in foundation.
  const armPatterns = ARMS_BY_DAY[dayOfWeek] ?? ARMS_BY_DAY[1];
  const arms = (phase === 'foundation' ? armPatterns.slice(0, 1) : armPatterns).map((p) =>
    exerciseForPattern(p, snapshot)
  );

  // Mobility: one cooldown stretch, rotating.
  const mobility = [getExercise(pick(MOBILITY_POOL, dayOfWeek))];

  const all = [...core, ...strength, ...arms, ...mobility];
  const exercises = all.map((ex) => prescribe(ex, snapshot, phase, isDeload));

  // Supersets: non-competing muscle groups back-to-back, rest only after the pair.
  // Core pairs rest 20s, strength/arm pairs 30s. Anything unpaired runs straight.
  const supersets: SupersetPair[] = [];
  const addPair = (a: Exercise | undefined, b: Exercise | undefined, rest: number) => {
    if (a && b && a.id !== b.id) supersets.push({ exerciseIds: [a.id, b.id], restAfterPair: rest });
  };
  addPair(core[0], core[1], 20);
  addPair(core[2], core[3], 20);
  addPair(strength[0], strength[2], 30);
  addPair(strength[1], arms[0], 30);

  return {
    type: 'workout',
    week,
    phase,
    isDeload,
    warmup: WARMUP,
    exercises,
    supersets,
    finisher: getFinisherForDate(dayOfWeek, phase, isDeload),
  };
}

// Week number for an arbitrary date relative to start. Counts on past 52.
//
// This used to clamp at 52. Combined with `isDeloadWeek` — which is true whenever the
// week divides by four — that meant every single day from week 52 onward reported as a
// deload. Deload sessions are excluded from progression, so a year in, the user's
// prescription would have frozen forever and never risen again.
export function weekForDate(date: Date, startDate: Date): number {
  const diffDays = calendarDaysBetween(startDate, date);
  return Math.max(Math.floor(diffDays / 7) + 1, 1);
}

// Whole calendar days between two local dates. Subtracting raw timestamps and dividing
// by 86_400_000 loses (or gains) an hour across a daylight-saving boundary, which drags
// the result just under a whole day and shifts every week boundary by one.
function calendarDaysBetween(from: Date, to: Date): number {
  const a = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const b = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

export function getCurrentWeek(startDate: Date): number {
  return weekForDate(new Date(), startDate);
}

export function getAllExercises(workout: WorkoutDay): (PrescribedExercise | WarmupExercise)[] {
  return [...workout.warmup, ...workout.exercises];
}

// ═══════════════════════════════════════════════════════════════════
// COACHING TIPS
// ═══════════════════════════════════════════════════════════════════

export interface CoachingTip {
  id: string;
  title: string;
  message: string;
}

export const COACHING_TIPS: CoachingTip[] = [
  {
    id: 'consistency',
    title: 'Show Up',
    message: 'Thirty minutes daily beats an hour you skip.',
  },
  {
    id: 'glutes',
    title: 'Squeeze',
    message: 'On every bridge and thrust, squeeze the glutes hard at the top.',
  },
  {
    id: 'pain',
    title: 'The Pain Rule',
    message: `Up to ${PAIN_BANDS.acceptableMax} out of 10 is fine. Above ${PAIN_BANDS.cautionMax}, or still sore tomorrow, means back off.`,
  },
  {
    id: 'tempo',
    title: 'Slow Wins',
    message: 'Lower slower than you lift. Control builds tone.',
  },
  {
    id: 'rir',
    title: 'Leave Some In',
    message: `Stop each set with about ${AUTOREGULATION.defaultTargetRIR} reps left. Grinding to failure buys nothing here.`,
  },
];

export function getCoachingTip(week: number): CoachingTip | null {
  const tipIndex = (week - 1) % COACHING_TIPS.length;
  return COACHING_TIPS[tipIndex];
}

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
      targetLabel: string;
      targetLabelShort: string;
      target: number;
      load: number;
      holdFor?: number;
      tempo?: Tempo;
      isLastSet: boolean;
      supersetLabel?: string;
    }
  | { kind: 'rest'; duration: number; nextName: string }
  | { kind: 'log'; exerciseId: string; name: string; sets: number; target: number; load: number }
  | { kind: 'finisher-intro'; finisher: Finisher }
  | { kind: 'finisher-work'; finisher: Finisher; round: number; rounds: number; duration: number }
  | { kind: 'finisher-rest'; finisher: Finisher; round: number; rounds: number; duration: number }
  | { kind: 'finisher-score'; finisher: Finisher }
  | { kind: 'symptom-check' };

function stepName(step: SessionStep): string {
  switch (step.kind) {
    case 'warmup':
    case 'work':
      return step.name;
    case 'log':
      return `Log ${step.name}`;
    case 'finisher-intro':
    case 'finisher-work':
      return `Finisher: ${step.finisher.name}`;
    case 'finisher-score':
      return 'Log your score';
    case 'symptom-check':
      return 'How did that feel?';
    default:
      return '';
  }
}

// Build the full ordered step list:
//   warm-up → supersets (A1 → A2 → rest, per round) → straight-set extras
//   → finisher (intro → timed intervals/AMRAP → score) → cooldown → symptom check.
//
// A `log` step follows the last set of every loadable or laddered exercise: without
// the reps-and-RIR it captures, the progression engine has nothing to reason about.
export function buildSessionSteps(workout: WorkoutDay): SessionStep[] {
  const steps: SessionStep[] = [];

  for (const w of workout.warmup) {
    steps.push({ kind: 'warmup', id: w.id, name: w.name, cue: w.cue, duration: w.duration });
  }

  const byId = new Map(workout.exercises.map((e) => [e.exercise.id, e]));
  const paired = new Set(workout.supersets.flatMap((p) => p.exerciseIds));

  const pushWork = (px: PrescribedExercise, set: number, supersetLabel?: string) => {
    const ex = px.exercise;
    steps.push({
      kind: 'work',
      id: ex.id,
      name: ex.name,
      cue: ex.cue,
      set,
      sets: px.sets,
      targetLabel: px.targetLabel,
      targetLabelShort: px.targetLabelShort,
      target: px.target,
      load: px.load,
      holdFor: px.holdFor,
      tempo: px.tempo,
      isLastSet: set === px.sets,
      supersetLabel,
    });
  };

  // Stretches carry no dose to record.
  const pushLog = (px: PrescribedExercise) => {
    if (px.exercise.block === 'mobility') return;
    steps.push({
      kind: 'log',
      exerciseId: px.exercise.id,
      name: px.exercise.name,
      sets: px.sets,
      target: px.target,
      load: px.load,
    });
  };

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
    pushLog(a);
    pushLog(b);
  });

  // Unpaired exercises — straight sets. Mobility waits for the cooldown.
  const extras = workout.exercises.filter(
    (e) => !paired.has(e.exercise.id) && e.exercise.block !== 'mobility'
  );
  for (const px of extras) {
    for (let s = 1; s <= px.sets; s++) {
      pushWork(px, s);
      const rest = px.exercise.restBetweenSets;
      if (rest > 0) steps.push({ kind: 'rest', duration: rest, nextName: '' });
    }
    pushLog(px);
  }

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

  const cooldown = workout.exercises.filter((e) => e.exercise.block === 'mobility');
  for (const px of cooldown) {
    for (let s = 1; s <= px.sets; s++) pushWork(px, s);
  }

  // The session ends by asking what hurt. Nothing else feeds the symptom gate.
  steps.push({ kind: 'symptom-check' });

  // Fill in "Next: …" for rests, and drop a trailing rest if it ended up last.
  const filled: SessionStep[] = [];
  for (let i = 0; i < steps.length; i++) {
    const s = steps[i];
    if (s.kind === 'rest') {
      const next = steps.slice(i + 1).find((n) => n.kind !== 'rest');
      if (!next) continue;
      filled.push({ ...s, nextName: stepName(next) });
    } else {
      filled.push(s);
    }
  }

  return filled;
}

export { WARMUP, PHASE_ORDER };
