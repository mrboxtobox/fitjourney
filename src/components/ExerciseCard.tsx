import { useState, useEffect, useRef } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { Check, Play, Pause, RotateCcw, X, ShieldCheck, Target, Flame, Trophy } from 'lucide-preact';
import type { WarmupExercise, Finisher, PrescribedExercise } from '../data/workouts';
import { getMuscleFocus, formatTempo } from '../data/workouts';
import { hasMotionFrames } from '../data/exercises';
import { getBestFinisherScore } from '../db';
import { useTimer } from '../hooks/useTimer';

// Every illustration is `/exercises/<id>.webp`, and every muscle map is
// `/exercises/muscles/<id>.webp`. A missing file is caught by the asset guard test,
// not by a broken image in the user's face.
function imageFor(id: string): string {
  return `/exercises/${id}.webp`;
}

// The exercise picture, animated where a start/top frame pair exists: the two frames
// crossfade so the movement itself is visible. Reduced-motion users get the top
// frame, still. Falls back to the static diagram everywhere else.
export function ExerciseImage({ id, alt, imgClass }: { id: string; alt: string; imgClass: string }) {
  if (!hasMotionFrames(id)) {
    return <img src={imageFor(id)} alt={alt} class={imgClass} loading="eager" />;
  }
  return (
    <div class={`${imgClass} motion-image`} role="img" aria-label={alt}>
      <img src={`/exercises/${id}-a.webp`} alt="" loading="eager" />
      <img src={`/exercises/${id}-b.webp`} alt="" class="motion-frame-b" loading="eager" />
    </div>
  );
}

function formatSeconds(total: number): string {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

// ── The row ────────────────────────────────────────────────────────────────
// Today is the plan, not a second place to perform the workout — the guided session
// is that. So a row states one thing: what to do, how much, and whether it's done.
// The movement standard, the faults, the muscle map and the timer live in the sheet
// behind it, where they are read once rather than scrolled past fifteen times.
interface RowProps {
  id: string;
  name: string;
  dose: string;
  completed: boolean;
  onToggle: () => void;
  onOpen: () => void;
  // The engine's own sentence, shown only when it actually decided something.
  why?: { action: string; reason: string };
  accent?: ComponentChildren;
  // What the movement trains, visible on the row — not buried in the sheet.
  muscles?: string[];
}

function Row({ id, name, dose, completed, onToggle, onOpen, why, accent, muscles }: RowProps) {
  return (
    <div class="row" data-done={completed ? 'true' : undefined}>
      <div class="row-line">
        <button
          class={`row-check ${completed ? 'checked' : ''}`}
          onClick={onToggle}
          aria-pressed={completed}
          aria-label={completed ? `Mark ${name} incomplete` : `Mark ${name} complete`}
        >
          {completed && <Check size={12} color="var(--bg)" strokeWidth={3} />}
        </button>

        <button class="row-body" onClick={onOpen} aria-label={`${name} — how to do it`}>
          <img src={imageFor(id)} alt="" class="row-plate" loading="lazy" />
          <span class="row-text">
            <span class="row-name">
              {name}
              {accent}
            </span>
            {muscles && muscles.length > 0 && (
              <span class="row-muscles">{muscles.join(' · ')}</span>
            )}
          </span>
          <span class="row-dose">{dose}</span>
        </button>
      </div>

      {/* Full width, below the line — the reason needs room to be a sentence. */}
      {why && (
        <p class="row-why" data-action={why.action}>
          {why.reason}
        </p>
      )}
    </div>
  );
}

// ── The sheet ──────────────────────────────────────────────────────────────
interface SheetProps {
  title: string;
  onClose: () => void;
  children: ComponentChildren;
}

function Sheet({ title, onClose, children }: SheetProps) {
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    // The panel scrolls; the page behind it must not.
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panel.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div class="sheet-backdrop" onClick={onClose}>
      <div
        class="sheet"
        ref={panel}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <div class="sheet-head">
          <h2 class="sheet-title">{title}</h2>
          <button class="sheet-close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div class="sheet-body">{children}</div>
      </div>
    </div>
  );
}

// A countdown a user can start, pause and reset. Lives in the sheet, not the row.
function TimerControls({ seconds, onComplete }: { seconds: number; onComplete?: () => void }) {
  const timer = useTimer({ initialSeconds: seconds, onComplete, countDown: true });
  const nearlyDone = timer.seconds <= 3 && timer.isRunning;
  return (
    <div class="sheet-timer">
      <button onClick={timer.toggle} class="timer-btn" aria-label={timer.isRunning ? 'Pause' : 'Start'}>
        {timer.isRunning ? <Pause size={16} /> : <Play size={16} style={{ marginLeft: 2 }} />}
      </button>
      <span class="sheet-clock" style={{ color: nearlyDone ? 'var(--check)' : 'var(--text)' }}>
        {timer.formattedTime}
      </span>
      <button onClick={() => timer.reset()} class="timer-btn" aria-label="Reset">
        <RotateCcw size={16} />
      </button>
    </div>
  );
}

// The engine's game board: the rungs of this movement's ladder, the one you're on,
// and exactly what unlocks the next. Rendered only when there is a path to show.
function LadderPath({ progress }: { progress: NonNullable<PrescribedExercise['progress']> }) {
  if (progress.rungs.length < 2) return null;
  const { rungs, level, next, qualifyingStreak, streakNeeded } = progress;
  return (
    <div class="sheet-path">
      <p class="sheet-path-title">The path</p>
      <ol class="sheet-path-rungs">
        {rungs.map((rung, i) => (
          <li
            key={rung.name}
            class="sheet-path-rung"
            data-state={i < level ? 'earned' : i === level ? 'current' : 'ahead'}
          >
            {i < level ? <Check size={13} strokeWidth={2.5} /> : <span class="sheet-path-dot" />}
            {rung.name}
            {i === level && <span class="sheet-path-here">you are here</span>}
          </li>
        ))}
      </ol>
      {next ? (
        <p class="sheet-path-next">
          {next.criteria} {streakNeeded} good sessions like that unlock <strong>{next.name}</strong>
          {qualifyingStreak > 0 && (
            <span> — {qualifyingStreak} of {streakNeeded} banked</span>
          )}
          .
        </p>
      ) : (
        <p class="sheet-path-next">Top of the ladder — from here, progress is load and reps.</p>
      )}
    </div>
  );
}

function FormNotes({ standard, faults }: { standard: string; faults: string[] }) {
  return (
    <div class="form-notes">
      <p class="form-standard">{standard}</p>
      <p class="form-faults-title">Watch for</p>
      <ul class="form-faults">
        {faults.map((f) => (
          <li key={f}>{f}</li>
        ))}
      </ul>
    </div>
  );
}

// ── Prescribed exercise ────────────────────────────────────────────────────
interface ExerciseItemProps {
  prescribed: PrescribedExercise;
  weightUnit: 'kg' | 'lbs';
  completed: boolean;
  onToggle: () => void;
}

export function ExerciseItem({ prescribed, weightUnit, completed, onToggle }: ExerciseItemProps) {
  const exercise = prescribed.exercise;
  const [open, setOpen] = useState(false);
  const hasHold = prescribed.holdFor !== undefined && prescribed.holdFor > 0;
  const muscle = getMuscleFocus(exercise.id);
  const musclePath = muscle ? `/exercises/muscles/${exercise.id}.webp` : undefined;

  // The dose, stated once. Tempo and rest are detail — they belong in the sheet.
  // The row gets the compact target so it never overflows; the sheet gets the prose.
  const dose =
    `${prescribed.sets} × ${prescribed.targetLabelShort}` +
    (prescribed.load > 0 ? ` · ${prescribed.load}${weightUnit}` : '');
  const doseLong =
    `${prescribed.sets} × ${prescribed.targetLabel}` +
    (prescribed.load > 0 ? ` · ${prescribed.load}${weightUnit}` : '');

  return (
    <>
      <Row
        id={exercise.id}
        name={exercise.name}
        dose={dose}
        completed={completed}
        onToggle={onToggle}
        onOpen={() => setOpen(true)}
        why={prescribed.decision ? { action: prescribed.decision.action, reason: prescribed.decision.reason } : undefined}
        muscles={muscle?.targets}
      />

      {open && (
        <Sheet title={exercise.name} onClose={() => setOpen(false)}>
          <ExerciseImage id={exercise.id} alt={`${exercise.name} form`} imgClass="sheet-image" />

          <p class="sheet-dose">
            {doseLong}
            {prescribed.tempo && <span> · tempo {formatTempo(prescribed.tempo)}</span>}
            {exercise.restBetweenSets > 0 && <span> · {exercise.restBetweenSets}s rest</span>}
          </p>

          {prescribed.decision && (
            <p class="sheet-why" data-action={prescribed.decision.action}>
              {prescribed.decision.reason}
            </p>
          )}

          {hasHold && <TimerControls seconds={prescribed.holdFor ?? 0} />}

          <p class="sheet-cue">{exercise.cue}</p>
          <FormNotes standard={exercise.standard} faults={exercise.faults} />

          {prescribed.progress && <LadderPath progress={prescribed.progress} />}

          {exercise.kneeNote && (
            <p class="sheet-note">
              <ShieldCheck size={14} class="flex-shrink-0" style={{ color: 'var(--check)' }} />
              <span>{exercise.kneeNote}</span>
            </p>
          )}

          {muscle && (
            <div class="sheet-muscle">
              {musclePath && (
                <img src={musclePath} alt={`${exercise.name} target muscles`} class="sheet-muscle-map" loading="lazy" />
              )}
              <div class="sheet-muscle-text">
                <div class="flex flex-wrap gap-1.5">
                  {muscle.targets.map((t) => (
                    <span key={t} class="muscle-chip">{t}</span>
                  ))}
                </div>
                <p class="sheet-note">
                  <Target size={14} class="flex-shrink-0" style={{ color: 'var(--accent)' }} />
                  <span>{muscle.squeeze}</span>
                </p>
              </div>
            </div>
          )}

          <button
            class="sheet-action"
            onClick={() => {
              if (!completed) onToggle();
              setOpen(false);
            }}
          >
            {completed ? 'Done' : 'Mark done'}
          </button>
        </Sheet>
      )}
    </>
  );
}

// ── Warmup ─────────────────────────────────────────────────────────────────
interface WarmupItemProps {
  exercise: WarmupExercise;
  completed: boolean;
  onToggle: () => void;
}

export function WarmupItem({ exercise, completed, onToggle }: WarmupItemProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Row
        id={exercise.id}
        name={exercise.name}
        dose={formatSeconds(exercise.duration)}
        completed={completed}
        onToggle={onToggle}
        onOpen={() => setOpen(true)}
      />

      {open && (
        <Sheet title={exercise.name} onClose={() => setOpen(false)}>
          <img src={imageFor(exercise.id)} alt={`${exercise.name} form`} class="sheet-image" />
          <TimerControls
            seconds={exercise.duration}
            onComplete={() => {
              if (!completed) onToggle();
            }}
          />
          <p class="sheet-cue">{exercise.cue}</p>
          <button
            class="sheet-action"
            onClick={() => {
              if (!completed) onToggle();
              setOpen(false);
            }}
          >
            {completed ? 'Done' : 'Mark done'}
          </button>
        </Sheet>
      )}
    </>
  );
}

// ── Finisher — the scored metabolic block at the end of the workout ────────
interface FinisherItemProps {
  finisher: Finisher;
  completed: boolean;
  onToggle: () => void;
}

export function FinisherItem({ finisher, completed, onToggle }: FinisherItemProps) {
  const [open, setOpen] = useState(false);
  const [best, setBest] = useState<number | null>(null);
  // Each finisher has its own circuit diagram, named after the finisher id.
  const imagePath = `/exercises/${finisher.id}.webp`;

  useEffect(() => {
    getBestFinisherScore(finisher.id).then(setBest);
  }, [finisher.id]);

  const dose =
    finisher.format === 'intervals'
      ? `${finisher.rounds} × ${finisher.workSeconds}s/${finisher.restSeconds}s`
      : `${Math.round((finisher.durationSeconds ?? 240) / 60)} min`;

  const spec =
    finisher.format === 'intervals'
      ? `${finisher.rounds} × ${finisher.workSeconds}s on / ${finisher.restSeconds}s off`
      : `${Math.round((finisher.durationSeconds ?? 240) / 60)} min AMRAP · ${finisher.task}`;

  return (
    <>
      <Row
        id={finisher.id}
        name={finisher.name}
        dose={dose}
        completed={completed}
        onToggle={onToggle}
        onOpen={() => setOpen(true)}
        accent={<Flame size={13} style={{ color: 'var(--flame)' }} class="row-flame" />}
      />

      {open && (
        <Sheet title={finisher.name} onClose={() => setOpen(false)}>
          <img src={imagePath} alt={`${finisher.name} circuit`} class="sheet-image" />
          <p class="sheet-dose">{spec}</p>
          <p class="sheet-cue">{finisher.tagline}</p>

          <p class="sheet-note">
            <Trophy size={14} class="flex-shrink-0" style={{ color: 'var(--check)' }} />
            <span>
              {best !== null
                ? `Score to beat: ${best} ${finisher.scoreUnit}`
                : `First time — set the bar in ${finisher.scoreUnit}.`}
            </span>
          </p>

          {finisher.kneeNote && (
            <p class="sheet-note">
              <ShieldCheck size={14} class="flex-shrink-0" style={{ color: 'var(--check)' }} />
              <span>{finisher.kneeNote}</span>
            </p>
          )}

          <button
            class="sheet-action"
            onClick={() => {
              if (!completed) onToggle();
              setOpen(false);
            }}
          >
            {completed ? 'Done' : 'Mark done'}
          </button>
        </Sheet>
      )}
    </>
  );
}

// Legacy export for compatibility
export { ExerciseItem as ExerciseCard };
