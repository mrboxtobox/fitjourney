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
import { Dumbbell, Check } from 'lucide-preact';
import { getWorkoutForDate, getCurrentWeek, getPhaseInfo, PHASES, type Phase } from '../data/workouts';
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

  // Load month logs
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

  const isCurrentMonth =
    format(currentMonth, 'yyyy-MM') === format(new Date(), 'yyyy-MM');

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

  // Calculate monthly stats
  const completedDays = logs.filter((l) => l.completed).length;
  const workoutDays = logs.filter((l) => l.completed && l.workoutType === 'workout').length;

  // Current week info
  const currentWeek = getCurrentWeek(startDate);
  const phaseInfo = getPhaseInfo(currentWeek);

  return (
    <div class="container-poster pb-safe-nav">
      {/* Month navigation */}
      <DateNav
        displayText={format(currentMonth, 'MMMM yyyy')}
        onPrev={goToPrevMonth}
        onNext={goToNextMonth}
        onToday={goToThisMonth}
        showToday={!isCurrentMonth}
      />

      {/* Monthly stats */}
      <div class="grid grid-cols-2 gap-3 mb-6">
        <div class="card-dark p-4 text-center">
          <div class="flex items-center justify-center gap-2">
            <Check size={20} style={{ color: 'var(--mint)' }} />
            <span class="text-2xl font-bold" style={{ color: 'var(--white)' }}>{completedDays}</span>
          </div>
          <div class="text-xs mt-1" style={{ color: 'var(--white-dim)' }}>Days Completed</div>
        </div>
        <div class="card-dark p-4 text-center">
          <div class="flex items-center justify-center gap-2">
            <Dumbbell size={20} style={{ color: 'var(--coral)' }} />
            <span class="text-2xl font-bold" style={{ color: 'var(--white)' }}>{workoutDays}</span>
          </div>
          <div class="text-xs mt-1" style={{ color: 'var(--white-dim)' }}>Workouts</div>
        </div>
      </div>

      {/* Calendar */}
      <div class="card-dark p-4">
        {/* Weekday headers */}
        <div class="grid grid-cols-7 mb-2">
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
            <div key={i} class="text-center text-xs font-medium py-2" style={{ color: 'var(--white-dim)' }}>
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
                const isPast = date < new Date() && !isToday;
                const isWorkoutDay = workout.type === 'workout';

                return (
                  <button
                    key={date.toISOString()}
                    onClick={() => onDayClick(date)}
                    disabled={!isCurrentMonthDay}
                    class="relative aspect-square rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all"
                    style={{
                      opacity: isCurrentMonthDay ? 1 : 0.3,
                      background: isToday ? 'var(--coral)' : 'transparent',
                    }}
                  >
                    <span
                      class="text-sm"
                      style={{
                        color: isToday ? 'var(--black)' : isCurrentMonthDay ? 'var(--white)' : 'var(--white-dim)',
                        fontWeight: isToday ? 700 : 400,
                      }}
                    >
                      {format(date, 'd')}
                    </span>

                    {/* Workout type indicator */}
                    {isCurrentMonthDay && !isToday && (
                      <div class="mt-0.5">
                        {dayLog?.completed ? (
                          <div
                            class="w-2 h-2 rounded-full"
                            style={{ background: isWorkoutDay ? 'var(--mint)' : 'var(--white-dim)' }}
                          />
                        ) : isPast && isWorkoutDay ? (
                          <div class="w-2 h-2 rounded-full" style={{ background: 'var(--gray-light)' }} />
                        ) : isWorkoutDay ? (
                          <div class="w-2 h-2 rounded-full" style={{ background: 'var(--coral)', opacity: 0.4 }} />
                        ) : null}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div class="flex items-center justify-center gap-6 mt-4 pt-4 border-t" style={{ borderColor: 'var(--gray)' }}>
          <div class="flex items-center gap-2">
            <div class="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--mint)' }} />
            <span class="text-xs" style={{ color: 'var(--white-dim)' }}>Completed</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--coral)', opacity: 0.4 }} />
            <span class="text-xs" style={{ color: 'var(--white-dim)' }}>Scheduled</span>
          </div>
        </div>
      </div>

      {/* Year progress */}
      <div class="card-dark p-5 mt-6">
        <h3 class="section-title text-lg mb-4">52-WEEK PROGRESS</h3>
        <div class="space-y-4">
          {(Object.entries(PHASES) as [Phase, typeof PHASES[Phase]][]).map(([phase, info]) => {
            const isCurrent = phase === phaseInfo.name.toLowerCase();
            const weekRange = info.weeks.split('-').map(Number);
            const progress =
              currentWeek >= weekRange[1]
                ? 100
                : currentWeek >= weekRange[0]
                ? ((currentWeek - weekRange[0]) / (weekRange[1] - weekRange[0])) * 100
                : 0;

            return (
              <div key={phase}>
                <div class="flex items-center justify-between mb-1">
                  <span
                    class="text-sm"
                    style={{
                      color: isCurrent ? 'var(--coral)' : 'var(--white-muted)',
                      fontWeight: isCurrent ? 600 : 400,
                    }}
                  >
                    {info.name}
                  </span>
                  <span class="text-xs" style={{ color: 'var(--white-dim)' }}>
                    Weeks {info.weeks}
                  </span>
                </div>
                <div class="progress-bar">
                  <div
                    class="progress-bar-fill"
                    style={{
                      width: `${progress}%`,
                      background: isCurrent ? 'var(--coral)' : progress === 100 ? 'var(--mint)' : 'var(--gray)',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
