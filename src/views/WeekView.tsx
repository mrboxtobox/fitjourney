import { useState, useEffect } from 'preact/hooks';
import { format, isSameDay } from 'date-fns';
import { Dumbbell, Moon, Check, ChevronRight } from 'lucide-preact';
import { getWorkoutForDate, getPhaseInfo, getCurrentWeek } from '../data/workouts';
import { DateNav } from '../components/Navigation';
import { useWeek, formatDateString } from '../hooks/useDate';
import { getWeekLogs, type DailyLog } from '../db';

interface WeekViewProps {
  startDate: Date;
  onDayClick: (date: Date) => void;
}

export function WeekView({ startDate, onDayClick }: WeekViewProps) {
  const { weekDays, displayWeek, goToThisWeek, goToNextWeek, goPrevWeek, isThisWeek, weekStartString, weekEndString } = useWeek();
  const [logs, setLogs] = useState<DailyLog[]>([]);

  const week = getCurrentWeek(startDate);
  const phaseInfo = getPhaseInfo(week);

  // Load week logs
  useEffect(() => {
    const loadLogs = async () => {
      const weekLogs = await getWeekLogs(weekStartString, weekEndString);
      setLogs(weekLogs);
    };
    loadLogs();
  }, [weekStartString, weekEndString]);

  const getDayLog = (date: Date) => {
    const dateStr = formatDateString(date);
    return logs.find((l) => l.date === dateStr);
  };

  const completedDays = logs.filter((l) => l.completed).length;
  const totalWorkoutDays = 3; // Mon/Wed/Fri
  const weekProgress = Math.min((completedDays / totalWorkoutDays) * 100, 100);

  return (
    <div class="container-poster pb-safe-nav">
      {/* Date navigation */}
      <DateNav
        displayText={displayWeek}
        onPrev={goPrevWeek}
        onNext={goToNextWeek}
        onToday={goToThisWeek}
        showToday={!isThisWeek}
      />

      {/* Phase info */}
      <div class="text-center mb-6">
        <div
          class="inline-flex items-center gap-2 px-4 py-2 rounded-full"
          style={{ background: 'var(--gray)', border: '1px solid var(--gray-light)' }}
        >
          <span class="text-sm font-medium" style={{ color: 'var(--white)' }}>Week {week}</span>
          <span class="w-1 h-1 rounded-full" style={{ background: 'var(--coral)' }} />
          <span class="text-sm" style={{ color: 'var(--white-muted)' }}>{phaseInfo.name}</span>
        </div>
      </div>

      {/* Week progress */}
      <div class="card-dark p-5 mb-6">
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-semibold" style={{ color: 'var(--white)' }}>Week Progress</h3>
          <span class="text-sm" style={{ color: 'var(--white-dim)' }}>{completedDays} of {totalWorkoutDays} workouts</span>
        </div>
        <div class="progress-bar h-2.5">
          <div
            class="progress-bar-fill"
            style={{
              width: `${weekProgress}%`,
              background: completedDays >= totalWorkoutDays ? 'var(--mint)' : 'var(--coral)',
            }}
          />
        </div>
        {completedDays >= totalWorkoutDays && (
          <p class="text-sm mt-3 font-medium" style={{ color: 'var(--mint)' }}>
            Great week! All workouts completed.
          </p>
        )}
      </div>

      {/* Phase description */}
      <div class="card-dark p-5 mb-6" style={{ borderLeftColor: 'var(--coral)', borderLeftWidth: 3 }}>
        <h3 class="font-semibold mb-1" style={{ color: 'var(--white)' }}>{phaseInfo.name} Phase</h3>
        <p class="text-sm mb-3" style={{ color: 'var(--white-muted)' }}>{phaseInfo.description}</p>
        <div class="flex flex-wrap gap-2">
          {phaseInfo.focus.map((item) => (
            <span
              key={item}
              class="px-3 py-1 text-xs rounded-full"
              style={{ background: 'var(--gray)', color: 'var(--white-muted)' }}
            >
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* Days grid */}
      <div class="space-y-2">
        {weekDays.map((day) => {
          const workout = getWorkoutForDate(day, startDate);
          const dayLog = getDayLog(day);
          const isToday = isSameDay(day, new Date());
          const isPast = day < new Date() && !isToday;
          const isWorkoutDay = workout.type === 'workout';

          return (
            <button
              key={day.toISOString()}
              onClick={() => onDayClick(day)}
              class={`day-row w-full ${workout.type === 'rest' ? 'rest' : ''}`}
              style={{
                borderLeftColor: isWorkoutDay ? 'var(--coral)' : 'var(--gray)',
                ...(isToday ? { boxShadow: '0 0 0 2px var(--coral)' } : {}),
              }}
            >
              {/* Day info */}
              <div class="w-14 text-center">
                <div class="text-xs uppercase" style={{ color: 'var(--white-dim)' }}>{format(day, 'EEE')}</div>
                <div class="text-xl font-bold" style={{ color: 'var(--white)' }}>{format(day, 'd')}</div>
              </div>

              {/* Workout type icon */}
              <div
                class="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{
                  background: isWorkoutDay ? 'rgba(255, 107, 91, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                }}
              >
                {isWorkoutDay ? (
                  <Dumbbell size={20} style={{ color: 'var(--coral)' }} />
                ) : (
                  <Moon size={20} style={{ color: 'var(--white-dim)' }} />
                )}
              </div>

              {/* Workout info */}
              <div class="flex-1 text-left">
                <div class="font-medium" style={{ color: 'var(--white)' }}>{workout.title}</div>
                <div class="text-sm" style={{ color: 'var(--white-dim)' }}>
                  {workout.estimatedTime > 0 ? `${workout.estimatedTime} min · 5×5 format` : 'Rest & recover'}
                </div>
              </div>

              {/* Status */}
              <div class="flex items-center gap-2">
                {dayLog?.completed ? (
                  <div
                    class="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: 'var(--mint)' }}
                  >
                    <Check size={18} color="var(--black)" strokeWidth={3} />
                  </div>
                ) : isPast && isWorkoutDay ? (
                  <div
                    class="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: 'var(--gray-light)' }}
                  >
                    <span class="text-xs" style={{ color: 'var(--white-dim)' }}>—</span>
                  </div>
                ) : (
                  <ChevronRight size={20} style={{ color: 'var(--white-dim)' }} />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
