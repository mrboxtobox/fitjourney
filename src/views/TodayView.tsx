import { useState, useEffect } from 'preact/hooks';
import { Lightbulb } from 'lucide-preact';
import { getWorkoutForDate, getAllExercises, getPhaseInfo, getCurrentWeek, getSuggestedWeight, getCoachingTip } from '../data/workouts';
import type { WorkoutDay } from '../data/workouts';
import { ExerciseCard, WarmupItem } from '../components/ExerciseCard';
import { DateNav } from '../components/Navigation';
import { useDate, formatDateString } from '../hooks/useDate';
import {
  getWorkoutLogsForDate,
  toggleExercise,
  updateExerciseLog,
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

  // Load workout and logs when date changes
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
  const phaseInfo = getPhaseInfo(week);
  const coachingTip = getCoachingTip(week);

  const handleToggle = async (exerciseId: string) => {
    const existing = logs.find((l) => l.exerciseId === exerciseId);
    const newCompleted = !existing?.completed;

    await toggleExercise(dateString, exerciseId, newCompleted);

    // Update local state
    setLogs((prev) => {
      const idx = prev.findIndex((l) => l.exerciseId === exerciseId);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], completed: newCompleted };
        return updated;
      }
      return [...prev, { date: dateString, exerciseId, completed: newCompleted }];
    });

    // Check if workout is complete
    const newCompletedCount = newCompleted ? completedCount + 1 : completedCount - 1;
    if (newCompletedCount === totalCount && workout) {
      await saveDailyLog({
        date: dateString,
        workoutType: workout.type,
        completed: true,
      });
    }
  };

  const handleWeightChange = async (exerciseId: string, weight: number) => {
    await updateExerciseLog(dateString, exerciseId, { weight });
    setLogs((prev) => {
      const idx = prev.findIndex((l) => l.exerciseId === exerciseId);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], weight };
        return updated;
      }
      return [...prev, { date: dateString, exerciseId, completed: false, weight }];
    });
  };

  const getExerciseLog = (exerciseId: string) => logs.find((l) => l.exerciseId === exerciseId);

  if (loading) {
    return (
      <div class="container-poster py-12">
        <div class="animate-pulse space-y-6">
          <div class="h-8 rounded w-1/2" style={{ background: 'var(--gray)' }} />
          <div class="h-24 rounded" style={{ background: 'var(--gray)' }} />
          <div class="h-16 rounded" style={{ background: 'var(--gray)' }} />
        </div>
      </div>
    );
  }

  if (!workout) {
    return (
      <div class="container-poster py-12">
        <p style={{ color: 'var(--white-dim)' }}>No workout found for this date.</p>
      </div>
    );
  }

  return (
    <div class="container-poster pb-safe-nav">
      {/* Date navigation */}
      <DateNav
        displayText={displayDate}
        onPrev={goPrev}
        onNext={goToNext}
        onToday={goToToday}
        showToday={!isToday}
      />

      {/* Workout header */}
      <div class="py-6">
        <div class="flex items-center gap-3 mb-2">
          <span class="badge-format">5×5</span>
          <p class="text-xs uppercase tracking-wider" style={{ color: 'var(--white-dim)' }}>
            Week {week} · {phaseInfo.name}
          </p>
        </div>
        <h2 class="font-display text-4xl" style={{ color: 'var(--white)' }}>
          {workout.title.toUpperCase()}
        </h2>
        <p class="mt-1" style={{ color: 'var(--white-muted)' }}>
          {workout.subtitle}
        </p>

        {/* Progress */}
        {totalCount > 0 && (
          <div class="mt-6">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm" style={{ color: 'var(--white-dim)' }}>
                {completedCount} of {totalCount}
              </span>
              {isComplete && (
                <span class="text-sm font-medium" style={{ color: 'var(--mint)' }}>
                  Complete
                </span>
              )}
            </div>
            <div class="progress-bar">
              <div
                class="progress-bar-fill"
                style={{
                  width: `${(completedCount / totalCount) * 100}%`,
                  background: isComplete ? 'var(--mint)' : 'var(--coral)',
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Coaching tip */}
      {coachingTip && workout.type !== 'rest' && (
        <div
          class="mt-6 p-4 rounded-lg flex gap-3"
          style={{ background: 'rgba(255, 230, 109, 0.1)', border: '1px solid rgba(255, 230, 109, 0.2)' }}
        >
          <Lightbulb size={20} style={{ color: 'var(--gold)', flexShrink: 0, marginTop: 2 }} />
          <div>
            <p class="font-semibold text-sm" style={{ color: 'var(--gold)' }}>
              {coachingTip.title}
            </p>
            <p class="text-sm mt-1" style={{ color: 'var(--white-muted)' }}>
              {coachingTip.message}
            </p>
          </div>
        </div>
      )}

      {/* Rest day message */}
      {workout.type === 'rest' ? (
        <div class="card-rest py-16 text-center mt-8">
          <h3 class="text-3xl font-extrabold mb-3" style={{ color: 'var(--white)', fontFamily: "'Outfit', sans-serif" }}>
            REST DAY
          </h3>
          <p class="max-w-xs mx-auto" style={{ color: 'var(--white-dim)' }}>
            Your muscles grow stronger during rest. Enjoy a gentle stretch or walk if you feel like it.
          </p>
        </div>
      ) : (
        <div class="stagger-children">
          {/* Warmup */}
          {workout.warmup && workout.warmup.length > 0 && (
            <section class="pt-6">
              <h3 class="section-title mb-4">WARM-UP</h3>
              <div class="card-dark p-4">
                {workout.warmup.map((warmupExercise) => {
                  const log = getExerciseLog(warmupExercise.id);
                  return (
                    <WarmupItem
                      key={warmupExercise.id}
                      name={warmupExercise.name}
                      description={warmupExercise.description}
                      duration={warmupExercise.duration}
                      completed={log?.completed ?? false}
                      onToggle={() => handleToggle(warmupExercise.id)}
                    />
                  );
                })}
              </div>
            </section>
          )}

          {/* Main workout */}
          <section class="pt-8">
            <h3 class="section-title mb-4">EXERCISES</h3>
            {workout.exercises.map((exercise, index) => {
              const log = getExerciseLog(exercise.id);
              const suggested = getSuggestedWeight(week, exercise.id);
              return (
                <ExerciseCard
                  key={exercise.id}
                  exercise={exercise}
                  completed={log?.completed ?? false}
                  weight={log?.weight}
                  suggestedWeight={suggested}
                  onToggle={() => handleToggle(exercise.id)}
                  onWeightChange={(w) => handleWeightChange(exercise.id, w)}
                  colorIndex={index}
                />
              );
            })}
          </section>
        </div>
      )}
    </div>
  );
}
