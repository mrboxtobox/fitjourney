import { useState, useEffect } from 'preact/hooks';
import { Check, Play, Pause, RotateCcw, Minus, Plus, Maximize2, ShieldCheck, Target, Flame, Trophy } from 'lucide-preact';
import type { Exercise, WarmupExercise, Finisher } from '../data/workouts';
import { getMuscleFocus } from '../data/workouts';
import { getBestFinisherScore } from '../db';
import { useTimer } from '../hooks/useTimer';

// Map exercise IDs to their image paths
const EXERCISE_IMAGES: Record<string, string> = {
  // Core & abs
  'mcgill-curl-up': '/exercises/mcgill-curl-up.webp',
  'mcgill-side-plank': '/exercises/mcgill-side-plank.webp',
  'mcgill-bird-dog': '/exercises/mcgill-bird-dog.webp',
  'dead-bug': '/exercises/dead-bug.webp',
  'front-plank': '/exercises/front-plank.webp',
  'hollow-hold': '/exercises/hollow-hold.webp',
  'pallof-press': '/exercises/pallof-press.webp',
  // Strength (glutes / lower)
  'glute-bridge': '/exercises/glute-bridge.webp',
  'band-glute-bridge': '/exercises/band-glute-bridge.webp',
  'hip-thrust': '/exercises/hip-thrust.webp',
  'single-leg-glute-bridge': '/exercises/single-leg-glute-bridge.webp',
  'kb-deadlift': '/exercises/kb-deadlift.webp',
  'db-rdl': '/exercises/db-rdl.webp',
  'b-stance-rdl': '/exercises/b-stance-rdl.webp',
  'box-squat': '/exercises/box-squat.webp',
  'goblet-squat': '/exercises/goblet-squat.webp',
  'farmers-carry': '/exercises/farmers-carry.webp',
  'kb-swing': '/exercises/kb-swing.webp',
  'band-lateral-walk': '/exercises/band-lateral-walk.webp',
  'band-monster-walk': '/exercises/band-monster-walk.webp',
  'band-clamshell': '/exercises/band-clamshell.webp',
  'band-kickback': '/exercises/band-kickback.webp',
  // Arms
  'db-bicep-curl': '/exercises/db-bicep-curl.webp',
  'db-overhead-press': '/exercises/db-overhead-press.webp',
  'db-tricep-kickback': '/exercises/db-tricep-kickback.webp',
  'db-lateral-raise': '/exercises/db-lateral-raise.webp',
  'push-up': '/exercises/push-up.webp',
  'band-pull-apart': '/exercises/band-pull-apart.webp',
  // Mobility
  '90-90': '/exercises/90-90.webp',
  'deep-squat-hold': '/exercises/deep-squat-hold.webp',
  'couch-stretch': '/exercises/couch-stretch.webp',
  'pigeon-stretch': '/exercises/pigeon-stretch.webp',
  // Warmup
  'cat-cow': '/exercises/cat-cow.webp',
  'leg-swings': '/exercises/leg-swings.webp',
  'hip-circles': '/exercises/hip-circles.webp',
  'glute-bridge-warmup': '/exercises/glute-bridge-warmup.webp',
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
  const muscle = getMuscleFocus(exercise.id);
  const musclePath = muscle ? `/exercises/muscles/${exercise.id}.webp` : undefined;

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
          {(exercise.restBetweenSets ?? 0) > 0 && (
            <span> · {exercise.restBetweenSets}s rest</span>
          )}
        </p>

        {/* Knee-friendly note */}
        {exercise.kneeNote && (
          <p
            class="text-xs mt-2 ml-6 flex items-start gap-1.5"
            style={{ color: 'var(--text-dim)' }}
          >
            <ShieldCheck size={13} class="flex-shrink-0 mt-0.5" style={{ color: 'var(--check)' }} />
            <span>{exercise.kneeNote}</span>
          </p>
        )}

        {/* Target muscles + squeeze cue */}
        {muscle && (
          <div class="ml-6 mt-2">
            <div class="flex items-center gap-3">
              {musclePath && (
                <button
                  onClick={() => setExpanded(!expanded)}
                  class="muscle-map-thumb-btn"
                  aria-label="Show target muscles"
                >
                  <img src={musclePath} alt={`${exercise.name} target muscles`} class="muscle-map-thumb" loading="lazy" />
                </button>
              )}
              <div class="flex flex-wrap gap-1.5">
                {muscle.targets.map((t) => (
                  <span key={t} class="muscle-chip">{t}</span>
                ))}
              </div>
            </div>
            <p class="text-xs mt-1.5 flex items-start gap-1.5" style={{ color: 'var(--text-dim)' }}>
              <Target size={13} class="flex-shrink-0 mt-0.5" style={{ color: 'var(--accent)' }} />
              <span>{muscle.squeeze}</span>
            </p>
          </div>
        )}

        {/* Expanded illustrations: form + target muscles */}
        {imagePath && expanded && (
          <div class="exercise-image-container" onClick={() => setExpanded(false)}>
            <img
              src={imagePath}
              alt={`${exercise.name} form demonstration`}
              class="exercise-image"
            />
            {musclePath && (
              <>
                <p class="exercise-image-caption">Muscles worked</p>
                <img
                  src={musclePath}
                  alt={`${exercise.name} target muscles`}
                  class="exercise-image"
                />
              </>
            )}
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

// Finisher item — the scored metabolic block at the end of the workout.
interface FinisherItemProps {
  finisher: Finisher;
  completed: boolean;
  onToggle: () => void;
}

export function FinisherItem({ finisher, completed, onToggle }: FinisherItemProps) {
  const [expanded, setExpanded] = useState(false);
  const [best, setBest] = useState<number | null>(null);
  const imagePath = `/exercises/${finisher.exerciseId}.webp`;

  useEffect(() => {
    getBestFinisherScore(finisher.id).then(setBest);
  }, [finisher.id]);

  const spec =
    finisher.format === 'intervals'
      ? `${finisher.rounds} × ${finisher.workSeconds}s on / ${finisher.restSeconds}s off`
      : `${Math.round((finisher.durationSeconds ?? 240) / 60)} min AMRAP · ${finisher.task}`;

  return (
    <div class="exercise-item animate-fade">
      {/* Thumbnail image - always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        class="exercise-thumbnail-btn"
        aria-label={expanded ? 'Collapse image' : 'Expand image'}
      >
        <img src={imagePath} alt={`${finisher.name} form`} class="exercise-thumbnail" loading="lazy" />
        <div class="thumbnail-expand-icon">
          <Maximize2 size={10} />
        </div>
      </button>

      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2">
          <button
            onClick={onToggle}
            class={`checkbox-min ${completed ? 'checked' : ''}`}
            aria-label={completed ? 'Mark incomplete' : 'Mark complete'}
          >
            {completed && <Check size={12} color="white" strokeWidth={3} />}
          </button>
          <h3 class={`font-medium ${completed ? 'completed' : ''}`}>{finisher.name}</h3>
          <Flame size={14} style={{ color: 'var(--flame)' }} class="flex-shrink-0" />
        </div>
        <p class="text-sm mt-0.5 ml-6" style={{ color: 'var(--text-muted)' }}>
          {finisher.tagline}
        </p>

        <p class="text-xs mt-2 ml-6" style={{ color: 'var(--text-dim)' }}>
          {spec}
        </p>

        {/* Score to beat */}
        <p class="text-xs mt-2 ml-6 flex items-start gap-1.5" style={{ color: 'var(--text-dim)' }}>
          <Trophy size={13} class="flex-shrink-0 mt-0.5" style={{ color: 'var(--check)' }} />
          <span>
            {best !== null
              ? `Score to beat: ${best} ${finisher.scoreUnit}`
              : `First time — set the bar in ${finisher.scoreUnit}.`}
          </span>
        </p>

        {/* Knee-friendly note */}
        {finisher.kneeNote && (
          <p class="text-xs mt-2 ml-6 flex items-start gap-1.5" style={{ color: 'var(--text-dim)' }}>
            <ShieldCheck size={13} class="flex-shrink-0 mt-0.5" style={{ color: 'var(--check)' }} />
            <span>{finisher.kneeNote}</span>
          </p>
        )}

        {/* Expanded illustration */}
        {expanded && (
          <div class="exercise-image-container" onClick={() => setExpanded(false)}>
            <img src={imagePath} alt={`${finisher.name} form demonstration`} class="exercise-image" />
          </div>
        )}
      </div>
    </div>
  );
}

// Legacy export for compatibility
export { ExerciseItem as ExerciseCard };
