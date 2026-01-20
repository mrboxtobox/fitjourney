import { useState, useEffect } from 'preact/hooks';
import { getWorkoutForDate, getAllExercises, getCurrentWeek } from '../data/workouts';
import type { WorkoutDay } from '../data/workouts';
import { ExerciseItem, WarmupItem } from '../components/ExerciseCard';
import { DateNav } from '../components/Navigation';
import { useDate, formatDateString } from '../hooks/useDate';
import {
  getWorkoutLogsForDate,
  toggleExercise,
  saveDailyLog,
  type WorkoutLog,
} from '../db';

interface TodayViewProps {
  startDate: Date;
}

export function TodayView({ startDate }: TodayViewProps) {
  const { currentDate, displayDate, isToday, goToToday, goToNext, goPrev } = useDate();
  const dateString = formatDateString(currentDate);

  const [workout, setWorkout] = useState<WorkoutDay | null>(null);
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const dayWorkout = getWorkoutForDate(currentDate, startDate);
      setWorkout(dayWorkout);

      const savedLogs = await getWorkoutLogsForDate(dateString);
      setLogs(savedLogs);
      setLoading(false);
    };

    loadData();
  }, [currentDate, dateString, startDate]);

  const allExercises = workout ? getAllExercises(workout) : [];
  const completedCount = logs.filter((l) => l.completed).length;
  const totalCount = allExercises.length;
  const isComplete = completedCount === totalCount && totalCount > 0;

  const week = getCurrentWeek(startDate);

  const handleToggle = async (exerciseId: string) => {
    const existing = logs.find((l) => l.exerciseId === exerciseId);
    const newCompleted = !existing?.completed;

    await toggleExercise(dateString, exerciseId, newCompleted);

    setLogs((prev) => {
      const idx = prev.findIndex((l) => l.exerciseId === exerciseId);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], completed: newCompleted };
        return updated;
      }
      return [...prev, { date: dateString, exerciseId, completed: newCompleted }];
    });

    const newCompletedCount = newCompleted ? completedCount + 1 : completedCount - 1;
    if (newCompletedCount === totalCount && workout) {
      await saveDailyLog({
        date: dateString,
        workoutType: workout.type,
        completed: true,
      });
    }
  };

  const getExerciseLog = (exerciseId: string) => logs.find((l) => l.exerciseId === exerciseId);

  if (loading) {
    return (
      <div class="container-app py-12">
        <div class="animate-pulse space-y-4">
          <div class="h-4 rounded w-1/3" style={{ background: 'var(--border)' }} />
          <div class="h-12 rounded" style={{ background: 'var(--border)' }} />
        </div>
      </div>
    );
  }

  if (!workout) {
    return (
      <div class="container-app py-12">
        <p style={{ color: 'var(--text-dim)' }}>No workout found.</p>
      </div>
    );
  }

  return (
    <div class="container-app pb-safe-nav">
      <DateNav
        displayText={displayDate}
        onPrev={goPrev}
        onNext={goToNext}
        onToday={goToToday}
        showToday={!isToday}
      />

      {/* Progress */}
      {totalCount > 0 && (
        <div class="mb-4">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs" style={{ color: 'var(--text-dim)' }}>
              Week {week}
            </span>
            <span class="text-xs" style={{ color: isComplete ? 'var(--check)' : 'var(--text-dim)' }}>
              {completedCount}/{totalCount}
            </span>
          </div>
          <div class="progress-bar">
            <div
              class="progress-fill"
              style={{
                width: `${(completedCount / totalCount) * 100}%`,
                background: isComplete ? 'var(--check)' : 'var(--text)',
              }}
            />
          </div>
        </div>
      )}

      {/* Rest day */}
      {workout.type === 'rest' ? (
        <div class="rest-card">
          <h2 class="text-2xl font-semibold mb-2">Rest</h2>
          <p style={{ color: 'var(--text-dim)' }}>
            Recovery is part of the practice.
          </p>
        </div>
      ) : (
        <>
          {/* Warmup */}
          {workout.warmup.length > 0 && (
            <section>
              <h2 class="section-header">Warmup</h2>
              <div>
                {workout.warmup.map((exercise) => {
                  const log = getExerciseLog(exercise.id);
                  return (
                    <WarmupItem
                      key={exercise.id}
                      exercise={exercise}
                      completed={log?.completed ?? false}
                      onToggle={() => handleToggle(exercise.id)}
                    />
                  );
                })}
              </div>
            </section>
          )}

          {/* Main exercises */}
          <section>
            <h2 class="section-header">Exercises</h2>
            <div>
              {workout.exercises.map((exercise) => {
                const log = getExerciseLog(exercise.id);
                return (
                  <ExerciseItem
                    key={exercise.id}
                    exercise={exercise}
                    completed={log?.completed ?? false}
                    onToggle={() => handleToggle(exercise.id)}
                  />
                );
              })}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
