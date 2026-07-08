import { useState, useEffect, useRef } from 'preact/hooks';
import { getWorkoutForDate, getAllExercises, getCurrentWeek, getPhaseInfo } from '../data/workouts';
import type { WorkoutDay, Block, PrescribedExercise, ProgressionSnapshot } from '../data/workouts';
import { EMPTY_SNAPSHOT } from '../data/workouts';
import { ExerciseItem, WarmupItem, FinisherItem } from '../components/ExerciseCard';
import { GuidedSession } from '../components/GuidedSession';
import { MorningCheck } from '../components/SymptomCheck';
import { DateNav } from '../components/Navigation';
import { Play, Flame, Moon } from 'lucide-preact';
import { initAudio } from '../lib/sound';
import { useDate, formatDateString } from '../hooks/useDate';
import {
  getWorkoutLogsForDate,
  toggleExercise,
  saveDailyLog,
  getStreak,
  loadProgressionSnapshot,
  getPendingMorningCheck,
  saveNextMorningSymptom,
  type WorkoutLog,
  type SymptomLog,
} from '../db';

interface TodayViewProps {
  startDate: Date;
  weightUnit: 'kg' | 'lbs';
}

export function TodayView({ startDate, weightUnit }: TodayViewProps) {
  const { currentDate, displayDate, isToday, goToToday, goToNext, goPrev } = useDate();
  const dateString = formatDateString(currentDate);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  // Swipe horizontally to change day (ignored while the guided session is open).
  const onTouchStart = (e: TouchEvent) => {
    const t = e.changedTouches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  };
  const onTouchEnd = (e: TouchEvent) => {
    if (!touchStart.current || sessionOpen) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.current.x;
    const dy = t.clientY - touchStart.current.y;
    touchStart.current = null;
    if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.8) {
      if (dx < 0) goToNext();
      else goPrev();
    }
  };

  const [workout, setWorkout] = useState<WorkoutDay | null>(null);
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionOpen, setSessionOpen] = useState(false);
  const [streak, setStreak] = useState(0);
  const [pendingMorning, setPendingMorning] = useState<SymptomLog[]>([]);
  const [dismissedMorning, setDismissedMorning] = useState(false);
  // Bumped when the snapshot must be recomputed from IndexedDB.
  const [historyVersion, setHistoryVersion] = useState(0);
  const loggedDuringSession = useRef(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);

      // The prescription is a function of what the user has actually done.
      const snapshot: ProgressionSnapshot = await loadProgressionSnapshot(startDate).catch(
        () => EMPTY_SNAPSHOT
      );
      setWorkout(getWorkoutForDate(currentDate, startDate, snapshot));

      const savedLogs = await getWorkoutLogsForDate(dateString);
      setLogs(savedLogs);
      setStreak(await getStreak(formatDateString(new Date())));
      setPendingMorning(await getPendingMorningCheck(formatDateString(new Date())));
      setLoading(false);
    };

    loadData();
  }, [currentDate, dateString, startDate, historyVersion]);

  const answerMorningCheck = async (log: SymptomLog, nprs: number) => {
    await saveNextMorningSymptom(log.date, log.region, nprs);
    setHistoryVersion((v) => v + 1);
  };

  const allExercises = workout ? getAllExercises(workout) : [];
  const completedCount = logs.filter((l) => l.completed).length;
  // The finisher counts toward the day's completion alongside the exercises.
  const totalCount = allExercises.length + (workout?.finisher ? 1 : 0);
  const isComplete = completedCount === totalCount && totalCount > 0;

  const week = getCurrentWeek(startDate);
  const phase = getPhaseInfo(week);

  const BLOCK_LABELS: Record<Block, string> = {
    core: 'Core & Abs',
    strength: 'Glutes & Strength',
    arms: 'Arms',
    mobility: 'Mobility',
  };
  const BLOCK_ORDER: Block[] = ['core', 'strength', 'arms', 'mobility'];

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
      setStreak(await getStreak(formatDateString(new Date())));
    }
  };

  const getExerciseLog = (exerciseId: string) => logs.find((l) => l.exerciseId === exerciseId);

  // Mark an exercise complete (idempotent) — used by the guided session.
  const markComplete = async (exerciseId: string) => {
    const existing = logs.find((l) => l.exerciseId === exerciseId);
    if (existing?.completed) return;
    await toggleExercise(dateString, exerciseId, true);
    setLogs((prev) => {
      const idx = prev.findIndex((l) => l.exerciseId === exerciseId);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], completed: true };
        return updated;
      }
      return [...prev, { date: dateString, exerciseId, completed: true }];
    });
  };

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
    <div class="container-app pb-safe-nav" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <DateNav
        displayText={displayDate}
        onPrev={goPrev}
        onNext={goToNext}
        onToday={goToToday}
        showToday={!isToday}
      />

      {/* Yesterday's pain, revisited. Pain that hasn't settled in 24h means the
          last dose was too much — this is the only path that fact reaches the engine. */}
      {!dismissedMorning && pendingMorning.length > 0 && (
        <MorningCheck
          region={pendingMorning[0].region}
          onAnswer={(nprs) => answerMorningCheck(pendingMorning[0], nprs)}
          onDismiss={() => setDismissedMorning(true)}
        />
      )}

      {/* Progress */}
      {totalCount > 0 && (
        <div class="mb-4">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs flex items-center gap-2" style={{ color: 'var(--text-dim)' }}>
              Week {week} · {phase.name}
              {workout.isDeload && <span class="deload-badge">Deload</span>}
              {streak > 0 && (
                <span class="streak-badge">
                  <Flame size={12} strokeWidth={2.5} />
                  {streak} day{streak === 1 ? '' : 's'}
                </span>
              )}
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

      {/* Start guided session */}
      {workout.type === 'workout' && totalCount > 0 && !isComplete && (
        <button
          class="start-session-btn"
          onClick={() => {
            initAudio();
            setSessionOpen(true);
          }}
        >
          <Play size={18} fill="currentColor" />
          {completedCount > 0 ? 'Resume guided session' : 'Start guided session'}
        </button>
      )}

      {sessionOpen && (
        <GuidedSession
          workout={workout}
          dateString={dateString}
          weightUnit={weightUnit}
          onClose={() => {
            setSessionOpen(false);
            // Recompute only once the session is over. Doing it per set would rebuild
            // the workout — and therefore the session's step list — mid-session.
            if (loggedDuringSession.current) {
              loggedDuringSession.current = false;
              setHistoryVersion((v) => v + 1);
            }
          }}
          onExerciseComplete={markComplete}
          onSessionLogged={() => {
            loggedDuringSession.current = true;
          }}
        />
      )}

      {/* Rest day */}
      {workout.type === 'rest' ? (
        <div class="rest-card">
          <Moon size={28} strokeWidth={1.75} style={{ color: 'var(--text-dim)' }} />
          <h2 class="text-2xl font-semibold mb-2 mt-3">Rest</h2>
          <p style={{ color: 'var(--text-dim)' }}>
            Recovery is when the work you already did turns into strength. Nothing to do today.
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

          {/* Main exercises grouped by block, with the finisher before the cooldown */}
          {BLOCK_ORDER.map((block) => {
            const items = workout.exercises.filter(
              (e: PrescribedExercise) => e.exercise.block === block
            );
            const finisherSection =
              block === 'mobility' && workout.finisher ? (
                <section key="finisher">
                  <h2 class="section-header">Finisher</h2>
                  <div>
                    <FinisherItem
                      finisher={workout.finisher}
                      completed={getExerciseLog(workout.finisher.id)?.completed ?? false}
                      onToggle={() => handleToggle(workout.finisher!.id)}
                    />
                  </div>
                </section>
              ) : null;
            if (items.length === 0) return finisherSection;
            return (
              <>
                {finisherSection}
                <section key={block}>
                  <h2 class="section-header">
                    {block === 'mobility' ? 'Cooldown' : BLOCK_LABELS[block]}
                  </h2>
                  <div>
                    {items.map((px) => {
                      const log = getExerciseLog(px.exercise.id);
                      return (
                        <ExerciseItem
                          key={px.exercise.id}
                          prescribed={px}
                          weightUnit={weightUnit}
                          completed={log?.completed ?? false}
                          onToggle={() => handleToggle(px.exercise.id)}
                        />
                      );
                    })}
                  </div>
                </section>
              </>
            );
          })}
        </>
      )}
    </div>
  );
}
