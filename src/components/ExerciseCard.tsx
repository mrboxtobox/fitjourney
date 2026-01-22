import { useState } from 'preact/hooks';
import { Check, Play, Pause, RotateCcw, Minus, Plus, Maximize2 } from 'lucide-preact';
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
  'band-lateral-walk': '/exercises/band-lateral-walk.png',
  'band-monster-walk': '/exercises/band-monster-walk.png',
  'band-glute-bridge': '/exercises/band-glute-bridge.png',
  'band-clamshell': '/exercises/band-clamshell.png',
  'band-squat': '/exercises/band-squat.png',
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
  const [expanded, setExpanded] = useState(false);
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
      {/* Thumbnail image - always visible */}
      {imagePath && (
        <button
          onClick={() => setExpanded(!expanded)}
          class="exercise-thumbnail-btn"
          aria-label={expanded ? 'Collapse image' : 'Expand image'}
        >
          <img
            src={imagePath}
            alt={`${exercise.name} form`}
            class="exercise-thumbnail"
            loading="lazy"
          />
          <div class="thumbnail-expand-icon">
            <Maximize2 size={10} />
          </div>
        </button>
      )}

      <div class="flex-1 min-w-0">
        <div class="flex items-start justify-between gap-3">
          <div class="flex-1">
            <div class="flex items-center gap-2">
              <button
                onClick={onToggle}
                class={`checkbox-min ${completed ? 'checked' : ''}`}
                aria-label={completed ? 'Mark incomplete' : 'Mark complete'}
              >
                {completed && <Check size={12} color="white" strokeWidth={3} />}
              </button>
              <h3 class={`font-medium ${completed ? 'completed' : ''}`}>
                {exercise.name}
              </h3>
            </div>
            <p class="text-sm mt-0.5 ml-6" style={{ color: 'var(--text-muted)' }}>
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
          <div class="flex items-center gap-3 mt-3 ml-6">
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
        <p class="text-xs mt-2 ml-6" style={{ color: 'var(--text-dim)' }}>
          {exercise.sets} × {exercise.reps}
          {exercise.restBetweenSets && exercise.restBetweenSets > 0 && (
            <span> · {exercise.restBetweenSets}s rest</span>
          )}
        </p>

        {/* Expanded exercise illustration */}
        {imagePath && expanded && (
          <div class="exercise-image-container" onClick={() => setExpanded(false)}>
            <img
              src={imagePath}
              alt={`${exercise.name} form demonstration`}
              class="exercise-image"
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
  const [expanded, setExpanded] = useState(false);
  const imagePath = EXERCISE_IMAGES[exercise.id];

  const timer = useTimer({
    initialSeconds: exercise.duration,
    onComplete: onToggle,
    countDown: true,
  });

  return (
    <div class="exercise-item animate-fade">
      {/* Thumbnail image - always visible */}
      {imagePath && (
        <button
          onClick={() => setExpanded(!expanded)}
          class="exercise-thumbnail-btn"
          aria-label={expanded ? 'Collapse image' : 'Expand image'}
        >
          <img
            src={imagePath}
            alt={`${exercise.name} form`}
            class="exercise-thumbnail"
            loading="lazy"
          />
          <div class="thumbnail-expand-icon">
            <Maximize2 size={10} />
          </div>
        </button>
      )}

      <div class="flex-1 min-w-0">
        <div class="flex items-center justify-between">
          <div>
            <div class="flex items-center gap-2">
              <button
                onClick={onToggle}
                class={`checkbox-min ${completed ? 'checked' : ''}`}
              >
                {completed && <Check size={12} color="white" strokeWidth={3} />}
              </button>
              <h4 class={`font-medium ${completed ? 'completed' : ''}`}>{exercise.name}</h4>
            </div>
            <p class="text-sm ml-6" style={{ color: 'var(--text-dim)' }}>{exercise.cue}</p>
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

        {/* Expanded exercise illustration */}
        {imagePath && expanded && (
          <div class="exercise-image-container" onClick={() => setExpanded(false)}>
            <img
              src={imagePath}
              alt={`${exercise.name} form demonstration`}
              class="exercise-image"
            />
          </div>
        )}
      </div>
    </div>
  );
}

// Legacy export for compatibility
export { ExerciseItem as ExerciseCard };
