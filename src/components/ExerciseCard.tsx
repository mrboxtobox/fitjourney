import { useState } from 'preact/hooks';
import { Check, Play, Pause, RotateCcw, Minus, Plus, ChevronDown, ChevronUp } from 'lucide-preact';
import type { Exercise, WarmupExercise } from '../data/workouts';
import { useTimer } from '../hooks/useTimer';

// Map exercise IDs to their image paths
const EXERCISE_IMAGES: Record<string, string> = {
  'mcgill-curl-up': '/exercises/mcgill-curl-up.png',
  'mcgill-side-plank': '/exercises/mcgill-side-plank.png',
  'mcgill-bird-dog': '/exercises/mcgill-bird-dog.png',
  'goblet-squat': '/exercises/goblet-squat.png',
  'farmers-carry': '/exercises/farmers-carry.png',
  'kb-deadlift': '/exercises/kb-deadlift.png',
  'kb-swing': '/exercises/kb-swing.png',
  '90-90': '/exercises/90-90.png',
  'deep-squat-hold': '/exercises/deep-squat-hold.png',
  'couch-stretch': '/exercises/couch-stretch.png',
  'pigeon-stretch': '/exercises/pigeon-stretch.png',
  'cat-cow': '/exercises/cat-cow.png',
  'leg-swings': '/exercises/leg-swings.png',
  'hip-circles': '/exercises/hip-circles.png',
  'glute-bridge-warmup': '/exercises/glute-bridge-warmup.png',
};

interface ExerciseItemProps {
  exercise: Exercise;
  completed: boolean;
  onToggle: () => void;
}

export function ExerciseItem({ exercise, completed, onToggle }: ExerciseItemProps) {
  const [setCount, setSetCount] = useState(0);
  const [showImage, setShowImage] = useState(false);
  const hasHold = exercise.hold && exercise.hold > 0;
  const imagePath = EXERCISE_IMAGES[exercise.id];

  // Timer for timed holds
  const timer = useTimer({
    initialSeconds: exercise.hold || 0,
    onComplete: () => {
      // Auto-increment set count when timer completes
      if (setCount < exercise.sets) {
        setSetCount(setCount + 1);
      }
    },
    countDown: true,
  });

  const handleSetComplete = () => {
    if (setCount < exercise.sets) {
      setSetCount(setCount + 1);
      // Auto-complete when all sets done
      if (setCount + 1 >= exercise.sets && !completed) {
        onToggle();
      }
    }
  };

  const handleSetDecrement = () => {
    if (setCount > 0) {
      setSetCount(setCount - 1);
      // Un-complete if we go below target
      if (completed) {
        onToggle();
      }
    }
  };

  return (
    <div class="exercise-item animate-fade">
      <button
        onClick={onToggle}
        class={`checkbox-min ${completed ? 'checked' : ''}`}
        aria-label={completed ? 'Mark incomplete' : 'Mark complete'}
      >
        {completed && <Check size={12} color="white" strokeWidth={3} />}
      </button>

      <div class="flex-1 min-w-0">
        <div class="flex items-start justify-between gap-3">
          <div class="flex-1">
            <div class="flex items-center gap-2">
              <h3 class={`font-medium ${completed ? 'completed' : ''}`}>
                {exercise.name}
              </h3>
              {imagePath && (
                <button
                  onClick={() => setShowImage(!showImage)}
                  class="form-toggle-btn"
                  aria-label={showImage ? 'Hide form' : 'Show form'}
                >
                  {showImage ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              )}
            </div>
            <p class="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {exercise.cue}
            </p>
          </div>

          {/* Set counter */}
          <div class="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleSetDecrement}
              class="counter-btn"
              disabled={setCount === 0}
              style={{ opacity: setCount === 0 ? 0.3 : 1 }}
            >
              <Minus size={16} />
            </button>
            <span class="counter-display">
              {setCount}/{exercise.sets}
            </span>
            <button
              onClick={handleSetComplete}
              class="counter-btn"
              disabled={setCount >= exercise.sets}
              style={{ opacity: setCount >= exercise.sets ? 0.3 : 1 }}
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

        {/* Timer for holds */}
        {hasHold && (
          <div class="flex items-center gap-3 mt-3">
            <button onClick={timer.toggle} class="timer-btn">
              {timer.isRunning ? (
                <Pause size={14} style={{ color: 'var(--text)' }} />
              ) : (
                <Play size={14} style={{ color: 'var(--text)', marginLeft: 2 }} />
              )}
            </button>
            <span
              class="timer-display"
              style={{ color: timer.seconds <= 3 && timer.isRunning ? 'var(--check)' : 'var(--text)' }}
            >
              {timer.formattedTime}
            </span>
            <button onClick={() => timer.reset()} class="timer-btn">
              <RotateCcw size={14} style={{ color: 'var(--text)' }} />
            </button>
          </div>
        )}

        {/* Reps/Rest display */}
        <p class="text-xs mt-2" style={{ color: 'var(--text-dim)' }}>
          {exercise.sets} × {exercise.reps}
          {exercise.restBetweenSets && exercise.restBetweenSets > 0 && (
            <span> · {exercise.restBetweenSets}s rest</span>
          )}
        </p>

        {/* Exercise illustration */}
        {imagePath && showImage && (
          <div class="exercise-image-container">
            <img
              src={imagePath}
              alt={`${exercise.name} form demonstration`}
              class="exercise-image"
              loading="lazy"
            />
          </div>
        )}
      </div>
    </div>
  );
}

// Warmup item - simpler version with just timer
interface WarmupItemProps {
  exercise: WarmupExercise;
  completed: boolean;
  onToggle: () => void;
}

export function WarmupItem({ exercise, completed, onToggle }: WarmupItemProps) {
  const [showImage, setShowImage] = useState(false);
  const imagePath = EXERCISE_IMAGES[exercise.id];

  const timer = useTimer({
    initialSeconds: exercise.duration,
    onComplete: onToggle,
    countDown: true,
  });

  return (
    <div class="exercise-item animate-fade">
      <button
        onClick={onToggle}
        class={`checkbox-min ${completed ? 'checked' : ''}`}
      >
        {completed && <Check size={12} color="white" strokeWidth={3} />}
      </button>

      <div class="flex-1 min-w-0">
        <div class="flex items-center justify-between">
          <div>
            <div class="flex items-center gap-2">
              <h4 class={`font-medium ${completed ? 'completed' : ''}`}>{exercise.name}</h4>
              {imagePath && (
                <button
                  onClick={() => setShowImage(!showImage)}
                  class="form-toggle-btn"
                  aria-label={showImage ? 'Hide form' : 'Show form'}
                >
                  {showImage ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              )}
            </div>
            <p class="text-sm" style={{ color: 'var(--text-dim)' }}>{exercise.cue}</p>
          </div>

          <div class="flex items-center gap-2">
            <span
              class="timer-display"
              style={{ color: timer.seconds <= 3 && timer.isRunning ? 'var(--check)' : 'var(--text)' }}
            >
              {timer.formattedTime}
            </span>
            <button onClick={timer.toggle} class="timer-btn">
              {timer.isRunning ? (
                <Pause size={14} style={{ color: 'var(--text)' }} />
              ) : (
                <Play size={14} style={{ color: 'var(--text)', marginLeft: 2 }} />
              )}
            </button>
            <button onClick={() => timer.reset()} class="timer-btn">
              <RotateCcw size={14} style={{ color: 'var(--text)' }} />
            </button>
          </div>
        </div>

        {/* Exercise illustration */}
        {imagePath && showImage && (
          <div class="exercise-image-container">
            <img
              src={imagePath}
              alt={`${exercise.name} form demonstration`}
              class="exercise-image"
              loading="lazy"
            />
          </div>
        )}
      </div>
    </div>
  );
}

// Legacy export for compatibility
export { ExerciseItem as ExerciseCard };
