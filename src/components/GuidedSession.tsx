import { useState, useEffect, useMemo, useRef } from 'preact/hooks';
import { X, Play, Pause, Check, ChevronLeft, ChevronRight, Volume2, VolumeX, Plus } from 'lucide-preact';
import { buildSessionSteps, type WorkoutDay, type SessionStep } from '../data/workouts';
import { initAudio, cueGo, cueRest, cueDone } from '../lib/sound';
import { celebrate } from '../lib/confetti';

const REST_ENCOURAGEMENT = [
  'Breathe. Shake it out.',
  'Strong work — recover.',
  'Stay loose, water if you need it.',
  'Almost there. Reset and go again.',
  'Nice. Let the heart rate settle.',
];

const DONE_LINES = [
  'You showed up. That’s the whole game.',
  'Glutes lit, core braced, arms done.',
  'Another brick in the wall. Well done.',
  'Consistency is the superpower. Nice work.',
];

interface GuidedSessionProps {
  workout: WorkoutDay;
  onClose: () => void;
  onExerciseComplete: (exerciseId: string) => void;
}

const MUTE_KEY = 'idaraya-session-muted';

function fmt(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

function stepDuration(step: SessionStep): number {
  if (step.kind === 'warmup') return step.duration;
  if (step.kind === 'rest') return step.duration;
  if (step.kind === 'work' && step.hold) return step.hold;
  return 0; // rep-based work: untimed, tap Done
}

export function GuidedSession({ workout, onClose, onExerciseComplete }: GuidedSessionProps) {
  const steps = useMemo(() => buildSessionSteps(workout), [workout]);
  const [idx, setIdx] = useState(0);
  const [remaining, setRemaining] = useState(() => stepDuration(steps[0]));
  const [paused, setPaused] = useState(false);
  const [finished, setFinished] = useState(false);
  const [muted, setMuted] = useState(() => localStorage.getItem(MUTE_KEY) === '1');

  const mutedRef = useRef(muted);
  mutedRef.current = muted;

  const step = steps[idx];
  const timed = stepDuration(step) > 0;

  const beep = (fn: () => void) => {
    if (!mutedRef.current) fn();
  };

  const buzz = (pattern: number | number[]) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(pattern);
  };

  // Entering a new step: reset timer + play the entry cue.
  useEffect(() => {
    if (finished) return;
    setRemaining(stepDuration(step));
    setPaused(false);
    if (step.kind === 'rest') {
      beep(cueRest);
      buzz(20);
    } else {
      beep(cueGo);
      buzz(30);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, finished]);

  const advance = (markComplete: boolean) => {
    if (markComplete && step.kind === 'work' && step.isLastSet) {
      onExerciseComplete(step.id);
    }
    if (idx + 1 >= steps.length) {
      setFinished(true);
      beep(cueDone);
      buzz([60, 40, 120]);
      celebrate();
    } else {
      setIdx(idx + 1);
    }
  };

  // Countdown tick for timed steps.
  useEffect(() => {
    if (finished || !timed || paused) return;
    const t = setInterval(() => {
      setRemaining((r) => r - 1);
    }, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, paused, timed, finished]);

  // When a timed step hits zero, advance (auto-completing the set).
  useEffect(() => {
    if (!finished && timed && remaining <= 0) advance(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining]);

  const completedExercises = useMemo(() => {
    const ids = new Set<string>();
    steps.slice(0, idx).forEach((s) => {
      if (s.kind === 'work' && s.isLastSet) ids.add(s.id);
    });
    return ids.size;
  }, [steps, idx]);

  if (finished) {
    return (
      <div class="session-overlay">
        <div class="session-done">
          <div class="session-done-check">
            <Check size={40} strokeWidth={3} style={{ color: 'var(--check)' }} />
          </div>
          <h2 class="text-2xl font-semibold mt-4">Session complete</h2>
          <p class="mt-2" style={{ color: 'var(--text-dim)' }}>
            {DONE_LINES[completedExercises % DONE_LINES.length]}
          </p>
          <p class="mt-1 text-sm" style={{ color: 'var(--text-dim)' }}>
            {completedExercises} exercises done.
          </p>
          <button class="session-btn-primary mt-8" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    );
  }

  const total = steps.length;
  const isRest = step.kind === 'rest';
  const phaseLabel =
    step.kind === 'warmup' ? 'Warm-up' : step.kind === 'rest' ? 'Rest' : `Set ${step.set} of ${step.sets}`;

  return (
    <div class="session-overlay">
      {/* Top bar */}
      <div class="session-top">
        <button onClick={onClose} class="session-icon-btn" aria-label="Close session">
          <X size={20} />
        </button>
        <span class="text-xs" style={{ color: 'var(--text-dim)' }}>
          {idx + 1} / {total}
        </span>
        <button
          onClick={() => {
            const next = !muted;
            setMuted(next);
            localStorage.setItem(MUTE_KEY, next ? '1' : '0');
            if (!next) initAudio();
          }}
          class="session-icon-btn"
          aria-label={muted ? 'Unmute' : 'Mute'}
        >
          {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>
      </div>

      <div class="session-progress">
        <div class="session-progress-fill" style={{ width: `${((idx + 1) / total) * 100}%` }} />
      </div>

      {/* Body */}
      <div class="session-body">
        <p class="session-phase" style={{ color: isRest ? 'var(--check)' : 'var(--text-dim)' }}>
          {phaseLabel}
        </p>

        {isRest ? (
          <>
            <p class="session-encourage">{REST_ENCOURAGEMENT[idx % REST_ENCOURAGEMENT.length]}</p>
            <div class="session-timer">{fmt(remaining)}</div>
            <p class="session-next" style={{ color: 'var(--text-dim)' }}>
              Next: {step.nextName}
            </p>
          </>
        ) : (
          <>
            <h2 class="session-name">{step.name}</h2>
            <img src={`/exercises/${step.id}.webp`} alt={step.name} class="session-image" loading="eager" />
            {timed ? (
              <div class="session-timer">{fmt(remaining)}</div>
            ) : (
              step.kind === 'work' && <div class="session-reps">{step.reps}</div>
            )}
            <p class="session-cue">{step.cue}</p>
          </>
        )}
      </div>

      {/* Controls */}
      <div class="session-controls">
        <button onClick={() => setIdx(Math.max(0, idx - 1))} class="session-icon-btn" disabled={idx === 0} aria-label="Previous">
          <ChevronLeft size={22} />
        </button>

        {isRest ? (
          <>
            <button onClick={() => setRemaining((r) => r + 15)} class="session-btn-secondary" aria-label="Add 15 seconds">
              <Plus size={16} /> 15s
            </button>
            <button onClick={() => advance(false)} class="session-btn-primary">
              Skip rest
            </button>
          </>
        ) : timed ? (
          <>
            <button onClick={() => setPaused((p) => !p)} class="session-icon-btn" aria-label={paused ? 'Resume' : 'Pause'}>
              {paused ? <Play size={22} /> : <Pause size={22} />}
            </button>
            <button onClick={() => advance(true)} class="session-btn-primary">
              <Check size={18} /> Done
            </button>
          </>
        ) : (
          <button onClick={() => advance(true)} class="session-btn-primary session-btn-wide">
            <Check size={18} /> Done
          </button>
        )}

        <button onClick={() => advance(false)} class="session-icon-btn" aria-label="Skip">
          <ChevronRight size={22} />
        </button>
      </div>
    </div>
  );
}
