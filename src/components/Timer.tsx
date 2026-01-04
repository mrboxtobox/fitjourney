import { Play, Pause, RotateCcw } from 'lucide-preact';
import { useTimer } from '../hooks/useTimer';

interface TimerProps {
  seconds: number;
  onComplete?: () => void;
  size?: 'sm' | 'md' | 'lg';
  autoStart?: boolean;
}

export function Timer({ seconds, onComplete, size = 'md', autoStart = false }: TimerProps) {
  const timer = useTimer({
    initialSeconds: seconds,
    onComplete,
    countDown: true,
  });

  // Auto-start if requested
  if (autoStart && !timer.isRunning && timer.seconds === seconds) {
    timer.start();
  }

  const sizeClasses = {
    sm: 'text-2xl',
    md: 'text-4xl',
    lg: 'text-6xl',
  };

  const buttonSizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 28,
  };

  return (
    <div class="flex flex-col items-center gap-4">
      <div
        class={`font-mono ${sizeClasses[size]} font-bold tabular-nums ${
          timer.seconds <= 5 && timer.isRunning ? 'text-error-500 animate-pulse' : 'text-neutral-900'
        }`}
      >
        {timer.formattedTime}
      </div>

      <div class="flex items-center gap-3">
        <button
          onClick={timer.toggle}
          class={`${buttonSizeClasses[size]} rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 ${
            timer.isRunning
              ? 'bg-neutral-200 text-neutral-700 hover:bg-neutral-300'
              : 'bg-primary-500 text-white hover:bg-primary-600'
          }`}
          aria-label={timer.isRunning ? 'Pause' : 'Start'}
        >
          {timer.isRunning ? (
            <Pause size={iconSizes[size]} />
          ) : (
            <Play size={iconSizes[size]} class="ml-0.5" />
          )}
        </button>

        <button
          onClick={() => timer.reset()}
          class={`${buttonSizeClasses[size]} rounded-full bg-surface-100 text-neutral-600 hover:bg-surface-200 flex items-center justify-center cursor-pointer transition-colors`}
          aria-label="Reset"
        >
          <RotateCcw size={iconSizes[size]} />
        </button>
      </div>

      {/* Progress ring for visual feedback */}
      {size !== 'sm' && (
        <div class="w-full bg-surface-100 rounded-full h-1.5 overflow-hidden">
          <div
            class="h-full bg-primary-500 transition-all duration-1000 ease-linear"
            style={{ width: `${(timer.seconds / seconds) * 100}%` }}
          />
        </div>
      )}
    </div>
  );
}

// Rest timer between sets
interface RestTimerProps {
  seconds: number;
  onComplete: () => void;
}

export function RestTimer({ seconds, onComplete }: RestTimerProps) {
  const timer = useTimer({
    initialSeconds: seconds,
    onComplete,
    countDown: true,
  });

  return (
    <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in">
      <div class="bg-white rounded-2xl p-8 shadow-strong max-w-sm w-full mx-4 text-center">
        <p class="text-sm text-neutral-500 uppercase tracking-wide mb-2">Rest</p>
        <div class="text-6xl font-bold font-mono tabular-nums mb-6">{timer.formattedTime}</div>

        <div class="flex justify-center gap-4">
          <button
            onClick={timer.toggle}
            class="px-6 py-3 rounded-lg bg-primary-500 text-white hover:bg-primary-600 cursor-pointer transition-colors"
          >
            {timer.isRunning ? 'Pause' : 'Start'}
          </button>
          <button
            onClick={onComplete}
            class="px-6 py-3 rounded-lg bg-surface-100 text-neutral-700 hover:bg-surface-200 cursor-pointer transition-colors"
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}

// Inline timer for duration-based exercises
interface InlineTimerProps {
  seconds: number;
  onComplete?: () => void;
}

export function InlineTimer({ seconds, onComplete }: InlineTimerProps) {
  const timer = useTimer({
    initialSeconds: seconds,
    onComplete,
    countDown: true,
  });

  return (
    <div class="flex items-center gap-2">
      <span
        class={`font-mono text-lg tabular-nums ${
          timer.seconds <= 5 && timer.isRunning ? 'text-error-500' : ''
        }`}
      >
        {timer.formattedTime}
      </span>
      <button
        onClick={timer.toggle}
        class="p-1.5 rounded-full bg-surface-100 hover:bg-surface-200 cursor-pointer transition-colors"
        aria-label={timer.isRunning ? 'Pause' : 'Start'}
      >
        {timer.isRunning ? <Pause size={14} /> : <Play size={14} class="ml-0.5" />}
      </button>
      <button
        onClick={() => timer.reset()}
        class="p-1.5 rounded-full bg-surface-100 hover:bg-surface-200 cursor-pointer transition-colors"
        aria-label="Reset"
      >
        <RotateCcw size={14} />
      </button>
    </div>
  );
}
