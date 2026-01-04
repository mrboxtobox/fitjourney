import { useState, useEffect } from 'preact/hooks';
import { Check, ChevronDown, Play, Pause, RotateCcw } from 'lucide-preact';
import type { Exercise } from '../data/workouts';
import { useTimer } from '../hooks/useTimer';

interface ExerciseCardProps {
  exercise: Exercise;
  completed: boolean;
  weight?: number;
  suggestedWeight?: number;
  onToggle: () => void;
  onWeightChange?: (weight: number) => void;
  colorIndex?: number;
}

export function ExerciseCard({
  exercise,
  completed,
  weight,
  suggestedWeight = 0,
  onToggle,
  onWeightChange,
  colorIndex = 0,
}: ExerciseCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [localWeight, setLocalWeight] = useState(weight || suggestedWeight);
  const hasWeight = exercise.equipment && exercise.equipment.length > 0;

  // Update local weight when prop changes
  useEffect(() => {
    if (weight !== undefined) {
      setLocalWeight(weight);
    }
  }, [weight]);

  const handleWeightChange = (newWeight: number) => {
    setLocalWeight(newWeight);
    onWeightChange?.(newWeight);
  };

  const handleToggle = (e: Event) => {
    e.stopPropagation();
    onToggle();
  };

  // Color based on index
  const colors = ['var(--coral)', 'var(--mint)', 'var(--gold)', 'var(--purple)', 'var(--coral)'];
  const accentColor = colors[colorIndex % colors.length];

  return (
    <div class="animate-fade-in mb-3">
      <div
        class="card-dark p-5 cursor-pointer"
        style={{ '--accent': accentColor } as any}
        onClick={() => setExpanded(!expanded)}
      >
        {/* Accent bar */}
        <div
          class="absolute top-0 left-0 right-0 h-[3px]"
          style={{ background: accentColor }}
        />

        <div class="flex items-start gap-4">
          {/* Checkbox */}
          <button
            onClick={handleToggle}
            class={`checkbox-poster ${completed ? 'checked' : ''}`}
            aria-label={completed ? 'Mark incomplete' : 'Mark complete'}
          >
            {completed && <Check size={16} color="var(--black)" strokeWidth={3} />}
          </button>

          {/* Content */}
          <div class="flex-1 min-w-0">
            <div class="flex items-start justify-between gap-3">
              <div class="flex-1">
                <h3
                  class={`font-semibold text-base ${completed ? 'line-through opacity-50' : ''}`}
                >
                  {exercise.name}
                </h3>
                <p class="text-sm mt-1" style={{ color: 'var(--white-muted)' }}>
                  {exercise.sets} × {exercise.reps}
                  {exercise.restBetweenSets && (
                    <span style={{ color: 'var(--white-dim)' }}> · {exercise.restBetweenSets}s rest</span>
                  )}
                </p>

                {/* Muscle tags */}
                <div class="flex flex-wrap gap-2 mt-3">
                  {exercise.isCompound && (
                    <span class="muscle-tag" style={{ background: 'rgba(78, 205, 196, 0.2)', color: 'var(--mint)' }}>
                      Compound
                    </span>
                  )}
                  {exercise.primaryMuscles.map((muscle) => (
                    <span key={muscle} class="muscle-tag primary">{muscle}</span>
                  ))}
                  {exercise.secondaryMuscles.map((muscle) => (
                    <span key={muscle} class="muscle-tag">{muscle}</span>
                  ))}
                </div>

                {/* Weight input for weighted exercises */}
                {hasWeight && onWeightChange && (
                  <div class="flex items-center gap-3 mt-4" onClick={(e) => e.stopPropagation()}>
                    <button
                      class="w-10 h-10 rounded-lg flex items-center justify-center text-xl font-bold cursor-pointer"
                      style={{ background: 'var(--gray)', color: 'var(--white)' }}
                      onClick={() => handleWeightChange(Math.max(0, localWeight - 5))}
                    >
                      −
                    </button>
                    <div class="text-center">
                      <input
                        type="number"
                        inputMode="decimal"
                        value={localWeight || ''}
                        onChange={(e) => handleWeightChange(Number((e.target as HTMLInputElement).value))}
                        placeholder="0"
                        class="w-20 text-center text-2xl font-bold bg-transparent border-none outline-none"
                        style={{ color: 'var(--white)' }}
                      />
                      <div class="text-xs" style={{ color: 'var(--white-dim)' }}>lbs</div>
                    </div>
                    <button
                      class="w-10 h-10 rounded-lg flex items-center justify-center text-xl font-bold cursor-pointer"
                      style={{ background: 'var(--gray)', color: 'var(--white)' }}
                      onClick={() => handleWeightChange(localWeight + 5)}
                    >
                      +
                    </button>
                    {suggestedWeight > 0 && localWeight !== suggestedWeight && (
                      <button
                        class="text-xs px-2 py-1 rounded cursor-pointer"
                        style={{ background: 'var(--coral)', color: 'var(--black)' }}
                        onClick={() => handleWeightChange(suggestedWeight)}
                      >
                        Use {suggestedWeight}
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Expand indicator */}
              <ChevronDown
                size={20}
                style={{
                  color: 'var(--white-dim)',
                  transform: expanded ? 'rotate(180deg)' : 'rotate(0)',
                  transition: 'transform 0.2s ease',
                }}
              />
            </div>
          </div>
        </div>

        {/* Expanded content */}
        {expanded && (
          <div class="mt-5 pt-5 border-t border-white/10 animate-fade-in">
            <p class="text-sm leading-relaxed" style={{ color: 'var(--white-muted)' }}>
              {exercise.description}
            </p>

            {/* Tips */}
            {exercise.tips.length > 0 && (
              <div class="mt-4">
                <p class="text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--white-dim)' }}>
                  Tips
                </p>
                <ul class="text-sm space-y-1" style={{ color: 'var(--white-muted)' }}>
                  {exercise.tips.map((tip, i) => (
                    <li key={i}>— {tip}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Equipment */}
            {exercise.equipment && exercise.equipment.length > 0 && (
              <div class="mt-4">
                <p class="text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--white-dim)' }}>
                  Equipment
                </p>
                <p class="text-sm" style={{ color: 'var(--white-muted)' }}>
                  {exercise.equipment.join(', ')}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Warmup item component (simpler)
interface WarmupItemProps {
  name: string;
  description: string;
  duration: number;
  completed: boolean;
  onToggle: () => void;
}

export function WarmupItem({ name, description, duration, completed, onToggle }: WarmupItemProps) {
  const timer = useTimer({
    initialSeconds: duration,
    onComplete: onToggle,
    countDown: true,
  });

  const handleTimerToggle = (e: Event) => {
    e.stopPropagation();
    timer.toggle();
  };

  const handleTimerReset = (e: Event) => {
    e.stopPropagation();
    timer.reset();
  };

  return (
    <div class="flex items-center gap-4 py-4 border-b border-white/5">
      <button
        onClick={onToggle}
        class={`checkbox-poster ${completed ? 'checked' : ''}`}
      >
        {completed && <Check size={16} color="var(--black)" strokeWidth={3} />}
      </button>

      <div class="flex-1">
        <h4 class={`font-medium ${completed ? 'line-through opacity-50' : ''}`}>{name}</h4>
        <p class="text-sm" style={{ color: 'var(--white-dim)' }}>{description}</p>
      </div>

      <div class="flex items-center gap-2">
        <span class="timer-display text-lg" style={{ color: timer.seconds <= 5 && timer.isRunning ? 'var(--coral)' : 'var(--white)' }}>
          {timer.formattedTime}
        </span>
        <button
          onClick={handleTimerToggle}
          class="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer"
          style={{ background: 'var(--gray)' }}
        >
          {timer.isRunning ? (
            <Pause size={16} style={{ color: 'var(--white)' }} />
          ) : (
            <Play size={16} style={{ color: 'var(--white)', marginLeft: 2 }} />
          )}
        </button>
        <button
          onClick={handleTimerReset}
          class="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer"
          style={{ background: 'var(--gray)' }}
        >
          <RotateCcw size={16} style={{ color: 'var(--white)' }} />
        </button>
      </div>
    </div>
  );
}
