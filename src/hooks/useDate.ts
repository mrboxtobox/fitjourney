import { useState, useCallback } from 'preact/hooks';
import { format, addDays, subDays, startOfWeek, endOfWeek, addWeeks, subWeeks } from 'date-fns';

export function useDate(initialDate: Date = new Date()) {
  const [currentDate, setCurrentDate] = useState(initialDate);

  const goToToday = useCallback(() => setCurrentDate(new Date()), []);
  const goToNext = useCallback(() => setCurrentDate((d) => addDays(d, 1)), []);
  const goPrev = useCallback(() => setCurrentDate((d) => subDays(d, 1)), []);
  const setDate = useCallback((date: Date) => setCurrentDate(date), []);

  const dateString = format(currentDate, 'yyyy-MM-dd');
  const displayDate = format(currentDate, 'EEEE, MMM d');
  const isToday = format(new Date(), 'yyyy-MM-dd') === dateString;

  return {
    currentDate,
    dateString,
    displayDate,
    isToday,
    goToToday,
    goToNext,
    goPrev,
    setDate,
  };
}

export function useWeek(initialDate: Date = new Date()) {
  const [currentDate, setCurrentDate] = useState(initialDate);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });

  const goToThisWeek = useCallback(() => setCurrentDate(new Date()), []);
  const goToNextWeek = useCallback(() => setCurrentDate((d) => addWeeks(d, 1)), []);
  const goPrevWeek = useCallback(() => setCurrentDate((d) => subWeeks(d, 1)), []);

  const weekStartString = format(weekStart, 'yyyy-MM-dd');
  const weekEndString = format(weekEnd, 'yyyy-MM-dd');
  const displayWeek = `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;

  const isThisWeek =
    format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd') === weekStartString;

  // Get all days in the week
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return {
    currentDate,
    weekStart,
    weekEnd,
    weekStartString,
    weekEndString,
    displayWeek,
    isThisWeek,
    weekDays,
    goToThisWeek,
    goToNextWeek,
    goPrevWeek,
    setDate: setCurrentDate,
  };
}

export function formatDateString(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}
