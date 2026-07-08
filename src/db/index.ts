import Dexie, { type Table } from 'dexie';
import {
  applyDetraining,
  computeSnapshot,
  type PainRegion,
  type SessionPerformance,
  type Snapshot,
  type SymptomReport,
  type WeightUnit,
} from '../lib/progression';
import { isDeloadWeek, weekForDate } from '../data/workouts';

export type { PainRegion } from '../lib/progression';

// Completion tracking only. Per-set performance (load, reps, RIR) lives in SetLog.
export interface WorkoutLog {
  id?: number;
  date: string; // YYYY-MM-DD
  exerciseId: string;
  completed: boolean;
}

export interface WeightLog {
  id?: number;
  date: string; // YYYY-MM-DD
  weight: number; // kg or lbs
  unit: 'kg' | 'lbs';
  notes?: string;
}

export interface UserSettings {
  id?: number;
  startDate: string; // YYYY-MM-DD - when they started the program
  weightUnit: 'kg' | 'lbs';
  reminderTime?: string; // HH:MM
  theme: 'light' | 'dark' | 'system';
}

export interface DailyLog {
  id?: number;
  date: string; // YYYY-MM-DD
  workoutType: 'workout' | 'rest';
  completed: boolean;
}

// One row per finisher attempt — drives the "beat your best" challenge.
export interface FinisherScore {
  id?: number;
  date: string; // YYYY-MM-DD
  finisherId: string;
  score: number;
}

// One row per set actually performed. This is the only input the progression
// engine has: without it, the prescription can never respond to the user.
export interface SetLog {
  id?: number;
  date: string; // YYYY-MM-DD
  exerciseId: string;
  setIndex: number; // 1-based
  reps: number; // reps completed, or seconds held, or steps taken
  load: number; // external load; 0 for bodyweight and bands
  rir: number; // reps in reserve; 0 means taken to failure
  prescribedSets: number; // how many sets were asked for that day (phase/deload scaled)
}

// One row per body region the user flagged after a session, on the 0–10 numeric
// pain rating scale. `nprsNextMorning` is filled in the following day.
export interface SymptomLog {
  id?: number;
  date: string; // YYYY-MM-DD — the session this refers to
  region: PainRegion;
  nprsDuring: number;
  nprsNextMorning?: number;
}

// Answers to the pre-start readiness screen. Stored so it is asked once, and so a
// later "yes" can re-surface the advice to see a clinician.
export interface ReadinessRecord {
  id?: number;
  date: string;
  flaggedQuestionIds: string[];
  acknowledgedDisclaimer: boolean;
}

export class IdarayaDB extends Dexie {
  workoutLogs!: Table<WorkoutLog>;
  dailyLogs!: Table<DailyLog>;
  weightLogs!: Table<WeightLog>;
  settings!: Table<UserSettings>;
  finisherScores!: Table<FinisherScore>;
  setLogs!: Table<SetLog>;
  symptomLogs!: Table<SymptomLog>;
  readiness!: Table<ReadinessRecord>;

  constructor() {
    super('idaraya');
    this.version(1).stores({
      workoutLogs: '++id, date, exerciseId, [date+exerciseId]',
      dailyLogs: '++id, &date',
      weightLogs: '++id, date',
      settings: '++id',
    });
    // v2: finisher scores (PR tracking)
    this.version(2).stores({
      workoutLogs: '++id, date, exerciseId, [date+exerciseId]',
      dailyLogs: '++id, &date',
      weightLogs: '++id, date',
      settings: '++id',
      finisherScores: '++id, date, finisherId, [date+finisherId]',
    });
    // v3: per-set performance, symptom reports, readiness screen.
    // Additive — no data migration needed.
    this.version(3).stores({
      workoutLogs: '++id, date, exerciseId, [date+exerciseId]',
      dailyLogs: '++id, &date',
      weightLogs: '++id, date',
      settings: '++id',
      finisherScores: '++id, date, finisherId, [date+finisherId]',
      setLogs: '++id, date, exerciseId, [date+exerciseId]',
      symptomLogs: '++id, date, region, [date+region]',
      readiness: '++id',
    });
  }
}

export const db = new IdarayaDB();

// Helper functions
export async function getWorkoutLogsForDate(date: string): Promise<WorkoutLog[]> {
  return db.workoutLogs.where('date').equals(date).toArray();
}

export async function getDailyLog(date: string): Promise<DailyLog | undefined> {
  return db.dailyLogs.where('date').equals(date).first();
}

export async function toggleExercise(
  date: string,
  exerciseId: string,
  completed: boolean
): Promise<void> {
  const existing = await db.workoutLogs
    .where('[date+exerciseId]')
    .equals([date, exerciseId])
    .first();

  if (existing) {
    await db.workoutLogs.update(existing.id!, { completed });
  } else {
    await db.workoutLogs.add({ date, exerciseId, completed });
  }
}

export async function saveDailyLog(log: Omit<DailyLog, 'id'>): Promise<void> {
  const existing = await db.dailyLogs.where('date').equals(log.date).first();
  if (existing) {
    await db.dailyLogs.update(existing.id!, log);
  } else {
    await db.dailyLogs.add(log);
  }
}

export async function getWeekLogs(startDate: string, endDate: string): Promise<DailyLog[]> {
  return db.dailyLogs
    .where('date')
    .between(startDate, endDate, true, true)
    .toArray();
}

export async function getMonthLogs(year: number, month: number): Promise<DailyLog[]> {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;
  return getWeekLogs(startDate, endDate);
}

// Weight tracking
export async function addWeightLog(log: Omit<WeightLog, 'id'>): Promise<void> {
  await db.weightLogs.add(log);
}

export async function getWeightLogs(limit = 30): Promise<WeightLog[]> {
  return db.weightLogs.orderBy('date').reverse().limit(limit).toArray();
}

export async function getLatestWeight(): Promise<WeightLog | undefined> {
  return db.weightLogs.orderBy('date').reverse().first();
}

// Settings
export async function getSettings(): Promise<UserSettings | undefined> {
  return db.settings.toCollection().first();
}

export async function saveSettings(settings: Omit<UserSettings, 'id'>): Promise<void> {
  const existing = await db.settings.toCollection().first();
  if (existing) {
    await db.settings.update(existing.id!, settings);
  } else {
    await db.settings.add(settings);
  }
}

// ─── Set logs — the engine's raw input ──────────────────────────────

// Replaces any previously logged sets for this exercise on this date, so a user
// who re-enters their numbers corrects the record rather than duplicating it.
export async function saveSetLogs(
  date: string,
  exerciseId: string,
  prescribedSets: number,
  sets: Array<{ reps: number; load: number; rir: number }>
): Promise<void> {
  await db.transaction('rw', db.setLogs, async () => {
    const existing = await db.setLogs.where('[date+exerciseId]').equals([date, exerciseId]).toArray();
    await db.setLogs.bulkDelete(existing.map((s) => s.id!));
    await db.setLogs.bulkAdd(
      sets.map((s, i) => ({
        date,
        exerciseId,
        setIndex: i + 1,
        reps: s.reps,
        load: s.load,
        rir: s.rir,
        prescribedSets,
      }))
    );
  });
}

export async function getSetLogsForDate(date: string): Promise<SetLog[]> {
  return db.setLogs.where('date').equals(date).toArray();
}

// ─── Symptom logs — the engine's safety input ───────────────────────

export async function saveSymptom(
  date: string,
  region: PainRegion,
  nprsDuring: number
): Promise<void> {
  const existing = await db.symptomLogs.where('[date+region]').equals([date, region]).first();
  if (existing) {
    await db.symptomLogs.update(existing.id!, { nprsDuring });
  } else {
    await db.symptomLogs.add({ date, region, nprsDuring });
  }
}

// The morning-after score. Pain that has not settled within 24 hours means the
// previous dose was too much, whatever it felt like at the time.
export async function saveNextMorningSymptom(
  sessionDate: string,
  region: PainRegion,
  nprsNextMorning: number
): Promise<void> {
  const existing = await db.symptomLogs.where('[date+region]').equals([sessionDate, region]).first();
  if (existing) {
    await db.symptomLogs.update(existing.id!, { nprsNextMorning });
  } else {
    await db.symptomLogs.add({ date: sessionDate, region, nprsDuring: 0, nprsNextMorning });
  }
}

export async function getSymptomsForDate(date: string): Promise<SymptomLog[]> {
  return db.symptomLogs.where('date').equals(date).toArray();
}

// Sessions that have been logged but not yet followed by a morning check.
export async function getPendingMorningCheck(beforeDate: string): Promise<SymptomLog[]> {
  const all = await db.symptomLogs.toArray();
  return all.filter((s) => s.date < beforeDate && s.nprsNextMorning === undefined && s.nprsDuring > 0);
}

// ─── The snapshot: progression derived from history ─────────────────

// Folds every logged set and symptom into the user's current position. Derived,
// never stored — replaying the same history always lands in the same place, and a
// morning-after pain score retroactively gates the session it describes.
// `asOf` (YYYY-MM-DD) exists so tests and the guard suite can ask "what would this user's
// prescription be on such-and-such a day" without mocking the clock. Production omits it.
export async function loadProgressionSnapshot(startDate: Date, asOf?: string): Promise<Snapshot> {
  const [setRows, symptomRows, settings] = await Promise.all([
    db.setLogs.toArray(),
    db.symptomLogs.toArray(),
    getSettings(),
  ]);

  const unit: WeightUnit = settings?.weightUnit ?? 'lbs';

  // Group set rows into one SessionPerformance per (date, exercise).
  const byKey = new Map<string, SessionPerformance>();
  for (const row of setRows.sort((a, b) => a.setIndex - b.setIndex)) {
    const key = `${row.date}|${row.exerciseId}`;
    const session = byKey.get(key) ?? {
      date: row.date,
      exerciseId: row.exerciseId,
      sets: [],
      prescribedSets: row.prescribedSets,
    };
    session.sets.push({ reps: row.reps, load: row.load, rir: row.rir });
    byKey.set(key, session);
  }

  const symptoms: SymptomReport[] = symptomRows.map((s) => ({
    date: s.date,
    region: s.region,
    nprsDuring: s.nprsDuring,
    nprsNextMorning: s.nprsNextMorning,
  }));

  const folded = computeSnapshot({
    sessions: [...byKey.values()],
    symptoms,
    unit,
    isDeloadDate: (date) => isDeloadWeek(weekOf(date, startDate)),
  });

  // Time away decays the dose. Applied on read, against today's date, because the answer
  // genuinely depends on when you ask: nothing has decayed on the day they stopped.
  return applyDetraining(folded, asOf ?? dateToString(new Date()), unit);
}

// Shares the program's own week arithmetic — a second, subtly different copy here is
// how the deload calendar and the progression fold would silently drift apart.
function weekOf(date: string, startDate: Date): number {
  return weekForDate(new Date(`${date}T00:00:00`), startDate);
}

// ─── Readiness screen ───────────────────────────────────────────────

export async function getReadiness(): Promise<ReadinessRecord | undefined> {
  return db.readiness.toCollection().first();
}

export async function saveReadiness(record: Omit<ReadinessRecord, 'id'>): Promise<void> {
  const existing = await db.readiness.toCollection().first();
  if (existing) {
    await db.readiness.update(existing.id!, record);
  } else {
    await db.readiness.add(record);
  }
}

// ─── Finisher scores & PRs ──────────────────────────────────────────

export async function getBestFinisherScore(finisherId: string): Promise<number | null> {
  const all = await db.finisherScores.where('finisherId').equals(finisherId).toArray();
  if (all.length === 0) return null;
  return Math.max(...all.map((s) => s.score));
}

// Save (upsert) today's score for a finisher. Returns whether this beat the
// previous best — the first ever score sets the baseline, not a PR.
export async function saveFinisherScore(
  date: string,
  finisherId: string,
  score: number
): Promise<{ isPR: boolean; previousBest: number | null }> {
  const existingToday = await db.finisherScores
    .where('[date+finisherId]')
    .equals([date, finisherId])
    .first();

  // Best score from attempts on OTHER days (today's earlier attempt doesn't guard the PR).
  const others = (await db.finisherScores.where('finisherId').equals(finisherId).toArray()).filter(
    (s) => s.date !== date
  );
  const previousBest = others.length > 0 ? Math.max(...others.map((s) => s.score)) : null;

  if (existingToday) {
    await db.finisherScores.update(existingToday.id!, { score });
  } else {
    await db.finisherScores.add({ date, finisherId, score });
  }

  return { isPR: previousBest !== null && score > previousBest, previousBest };
}

// ─── Streak ─────────────────────────────────────────────────────────

function dateToString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Consecutive completed days ending today (or yesterday, if today isn't done yet).
export async function getStreak(today: string): Promise<number> {
  const all = await db.dailyLogs.toArray();
  const completed = new Set(all.filter((l) => l.completed).map((l) => l.date));

  const cursor = new Date(`${today}T00:00:00`);
  // If today isn't complete yet, the streak counts up to yesterday.
  if (!completed.has(dateToString(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }

  let streak = 0;
  while (completed.has(dateToString(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
