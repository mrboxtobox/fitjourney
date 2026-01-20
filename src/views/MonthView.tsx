import { useState, useEffect } from 'preact/hooks';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
} from 'date-fns';
import { getWorkoutForDate, getCurrentWeek } from '../data/workouts';
import { DateNav } from '../components/Navigation';
import { getMonthLogs, type DailyLog } from '../db';
import { formatDateString } from '../hooks/useDate';

interface MonthViewProps {
  startDate: Date;
  onDayClick: (date: Date) => void;
}

export function MonthView({ startDate, onDayClick }: MonthViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [logs, setLogs] = useState<DailyLog[]>([]);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth() + 1;

  useEffect(() => {
    const loadLogs = async () => {
      const monthLogs = await getMonthLogs(year, month);
      setLogs(monthLogs);
    };
    loadLogs();
  }, [year, month]);

  const getDayLog = (date: Date) => {
    const dateStr = formatDateString(date);
    return logs.find((l) => l.date === dateStr);
  };

  const goToPrevMonth = () => setCurrentMonth((d) => subMonths(d, 1));
  const goToNextMonth = () => setCurrentMonth((d) => addMonths(d, 1));
  const goToThisMonth = () => setCurrentMonth(new Date());

  const isCurrentMonth = format(currentMonth, 'yyyy-MM') === format(new Date(), 'yyyy-MM');

  // Generate calendar days
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const calendarDays: Date[] = [];
  let day = calendarStart;
  while (day <= calendarEnd) {
    calendarDays.push(day);
    day = addDays(day, 1);
  }

  const weeks: Date[][] = [];
  for (let i = 0; i < calendarDays.length; i += 7) {
    weeks.push(calendarDays.slice(i, i + 7));
  }

  const completedDays = logs.filter((l) => l.completed).length;
  const currentWeek = getCurrentWeek(startDate);

  return (
    <div class="container-app pb-safe-nav">
      <DateNav
        displayText={format(currentMonth, 'MMMM yyyy')}
        onPrev={goToPrevMonth}
        onNext={goToNextMonth}
        onToday={goToThisMonth}
        showToday={!isCurrentMonth}
      />

      {/* Stats */}
      <div class="flex items-center justify-between mb-4">
        <span class="text-xs" style={{ color: 'var(--text-dim)' }}>Week {currentWeek}</span>
        <span class="text-xs" style={{ color: 'var(--text-dim)' }}>{completedDays} completed</span>
      </div>

      {/* Calendar */}
      <div class="card">
        {/* Weekday headers */}
        <div class="grid grid-cols-7 mb-2">
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
            <div key={i} class="text-center text-xs py-2" style={{ color: 'var(--text-dim)' }}>
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div class="space-y-1">
          {weeks.map((week, weekIdx) => (
            <div key={weekIdx} class="grid grid-cols-7 gap-1">
              {week.map((date) => {
                const isCurrentMonthDay = isSameMonth(date, currentMonth);
                const isToday = isSameDay(date, new Date());
                const workout = getWorkoutForDate(date, startDate);
                const dayLog = getDayLog(date);
                const isWorkoutDay = workout.type === 'workout';

                return (
                  <button
                    key={date.toISOString()}
                    onClick={() => onDayClick(date)}
                    disabled={!isCurrentMonthDay}
                    class="relative aspect-square rounded-lg flex flex-col items-center justify-center cursor-pointer"
                    style={{
                      opacity: isCurrentMonthDay ? 1 : 0.3,
                      background: isToday ? 'var(--text)' : 'transparent',
                    }}
                  >
                    <span
                      class="text-sm"
                      style={{
                        color: isToday ? 'var(--bg)' : 'var(--text)',
                        fontWeight: isToday ? 600 : 400,
                      }}
                    >
                      {format(date, 'd')}
                    </span>

                    {/* Indicator */}
                    {isCurrentMonthDay && !isToday && (
                      <div class="mt-0.5">
                        {dayLog?.completed ? (
                          <div class="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--check)' }} />
                        ) : isWorkoutDay ? (
                          <div class="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--border)' }} />
                        ) : null}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
