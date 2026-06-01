import Dexie, { type Table } from 'dexie';

export interface WorkoutLog {
  id?: number;
  date: string; // YYYY-MM-DD
  exerciseId: string;
  completed: boolean;
  sets?: number;
  reps?: number;
  duration?: number; // seconds
  weight?: number; // kg or lbs
  notes?: string;
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
  totalTime?: number; // seconds
  notes?: string;
}

// One row per finisher attempt — drives the "beat your best" challenge.
export interface FinisherScore {
  id?: number;
  date: string; // YYYY-MM-DD
  finisherId: string;
  score: number;
}

export class IdarayaDB extends Dexie {
  workoutLogs!: Table<WorkoutLog>;
  dailyLogs!: Table<DailyLog>;
  weightLogs!: Table<WeightLog>;
  settings!: Table<UserSettings>;
  finisherScores!: Table<FinisherScore>;

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

// Update exercise with weight
export async function updateExerciseLog(
  date: string,
  exerciseId: string,
  updates: Partial<WorkoutLog>
): Promise<void> {
  const existing = await db.workoutLogs
    .where('[date+exerciseId]')
    .equals([date, exerciseId])
    .first();

  if (existing) {
    await db.workoutLogs.update(existing.id!, updates);
  } else {
    await db.workoutLogs.add({
      date,
      exerciseId,
      completed: false,
      ...updates,
    });
  }
}
