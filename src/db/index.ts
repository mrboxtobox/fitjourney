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

export class IdarayaDB extends Dexie {
  workoutLogs!: Table<WorkoutLog>;
  dailyLogs!: Table<DailyLog>;
  weightLogs!: Table<WeightLog>;
  settings!: Table<UserSettings>;

  constructor() {
    super('idaraya');
    this.version(1).stores({
      workoutLogs: '++id, date, exerciseId, [date+exerciseId]',
      dailyLogs: '++id, &date',
      weightLogs: '++id, date',
      settings: '++id',
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
