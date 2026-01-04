import { useState, useEffect, useCallback, useRef } from 'preact/hooks';

interface UseTimerOptions {
  initialSeconds?: number;
  onComplete?: () => void;
  countDown?: boolean;
}

interface UseTimerReturn {
  seconds: number;
  isRunning: boolean;
  start: () => void;
  pause: () => void;
  reset: (newSeconds?: number) => void;
  toggle: () => void;
  formattedTime: string;
}

export function useTimer(options: UseTimerOptions = {}): UseTimerReturn {
  const { initialSeconds = 0, onComplete, countDown = true } = options;
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const onCompleteRef = useRef(onComplete);

  // Update ref when callback changes
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Clear interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Timer logic
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = window.setInterval(() => {
        setSeconds((prev) => {
          if (countDown) {
            if (prev <= 1) {
              setIsRunning(false);
              if (intervalRef.current) clearInterval(intervalRef.current);
              onCompleteRef.current?.();
              return 0;
            }
            return prev - 1;
          } else {
            return prev + 1;
          }
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, countDown]);

  const start = useCallback(() => setIsRunning(true), []);
  const pause = useCallback(() => setIsRunning(false), []);
  const toggle = useCallback(() => setIsRunning((prev) => !prev), []);
  const reset = useCallback(
    (newSeconds?: number) => {
      setIsRunning(false);
      setSeconds(newSeconds ?? initialSeconds);
    },
    [initialSeconds]
  );

  const formattedTime = formatTime(seconds);

  return { seconds, isRunning, start, pause, reset, toggle, formattedTime };
}

export function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

export function formatDuration(totalSeconds: number): string {
  if (totalSeconds < 60) {
    return `${totalSeconds}s`;
  }
  const minutes = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  if (secs === 0) {
    return `${minutes} min`;
  }
  return `${minutes}m ${secs}s`;
}
