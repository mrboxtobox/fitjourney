import { useState, useEffect } from 'preact/hooks';
import { format, isSameDay } from 'date-fns';
import { Check } from 'lucide-preact';
import { getWorkoutForDate, getCurrentWeek } from '../data/workouts';
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

  return (
    <div class="container-app pb-safe-nav">
      <DateNav
        displayText={displayWeek}
        onPrev={goPrevWeek}
        onNext={goToNextWeek}
        onToday={goToThisWeek}
        showToday={!isThisWeek}
      />

      {/* Week info */}
      <div class="flex items-center justify-between mb-4">
        <span class="text-xs" style={{ color: 'var(--text-dim)' }}>Week {week}</span>
        <span class="text-xs" style={{ color: 'var(--text-dim)' }}>{completedDays} completed</span>
      </div>

      {/* Days list */}
      <div>
        {weekDays.map((day) => {
          const workout = getWorkoutForDate(day, startDate);
          const dayLog = getDayLog(day);
          const isToday = isSameDay(day, new Date());
          const isWorkoutDay = workout.type === 'workout';

          return (
            <button
              key={day.toISOString()}
              onClick={() => onDayClick(day)}
              class="w-full flex items-center gap-4 py-4 cursor-pointer"
              style={{
                borderBottom: '1px solid var(--border)',
                background: isToday ? 'var(--bg-alt)' : 'transparent',
              }}
            >
              {/* Day */}
              <div class="w-12 text-center">
                <div class="text-xs" style={{ color: 'var(--text-dim)' }}>
                  {format(day, 'EEE')}
                </div>
                <div class="text-lg font-semibold" style={{ color: 'var(--text)' }}>
                  {format(day, 'd')}
                </div>
              </div>

              {/* Type */}
              <div class="flex-1 text-left">
                <span style={{ color: isWorkoutDay ? 'var(--text)' : 'var(--text-dim)' }}>
                  {isWorkoutDay ? 'Practice' : 'Rest'}
                </span>
              </div>

              {/* Status */}
              {dayLog?.completed && (
                <div
                  class="w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ background: 'var(--check)' }}
                >
                  <Check size={14} color="white" strokeWidth={3} />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
