import { useState, useEffect, useMemo, useRef } from 'preact/hooks';
import {
  X,
  Play,
  Pause,
  Check,
  ChevronLeft,
  ChevronRight,
  Volume2,
  VolumeX,
  Plus,
  Minus,
  Flame,
  Trophy,
  Radio,
  Music,
  Mic,
  SkipForward,
  Settings2,
} from 'lucide-preact';
import { buildSessionSteps, getExercise, type WorkoutDay, type SessionStep } from '../data/workouts';
import { ExerciseImage } from './ExerciseCard';
import {
  makeShareCode,
  shareUrlFor,
  startBroadcast,
  liveStateForStep,
  type LiveBroadcaster,
} from '../lib/live';
import { initAudio, cueGo, cueRest, cueDone, cueTick } from '../lib/sound';
import {
  musicEnabled,
  setMusicEnabled,
  startMusic,
  stopMusic,
  musicStatus,
  skipTrack,
  onTrackChange,
  type MusicTrack,
} from '../lib/music';
import {
  voiceEnabled,
  setVoiceEnabled,
  speak,
  speakRandom,
  stopSpeaking,
  voiceFileForExercise,
  voiceFileForFinisher,
  ENCOURAGEMENTS,
  WRAPUPS,
  PACING,
} from '../lib/voice';
import { celebrate } from '../lib/confetti';
import { getBestFinisherScore, saveFinisherScore, saveSetLogs, saveSymptom } from '../db';
import { SetLogger } from './SetLogger';
import { SymptomCheck } from './SymptomCheck';
import type { PainRegion } from '../lib/progression';

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

const FINISHER_REST_LINES = [
  'Shake it out. Back in a few seconds.',
  'Breathe hard, recover fast.',
  'Halfway is just a number. Keep counting.',
];

interface GuidedSessionProps {
  workout: WorkoutDay;
  dateString: string; // YYYY-MM-DD — for logging finisher scores
  weightUnit: 'kg' | 'lbs';
  onClose: () => void;
  onExerciseComplete: (exerciseId: string) => void;
  onSessionLogged: () => void; // performance recorded — the snapshot needs recomputing
}

const MUTE_KEY = 'idaraya-session-muted';

function fmt(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

function phaseLabelFor(step: SessionStep): string {
  switch (step.kind) {
    case 'warmup':
      return 'Warm-up';
    case 'rest':
      return 'Rest';
    case 'log':
      return 'Log your sets';
    case 'symptom-check':
      return 'Check in';
    case 'work':
      return step.supersetLabel ?? `Set ${step.set} of ${step.sets}`;
    case 'finisher-intro':
      return 'Finisher';
    case 'finisher-work':
      return step.rounds > 1 ? `Finisher · Round ${step.round} of ${step.rounds}` : 'Finisher · Go';
    case 'finisher-rest':
      return `Finisher · Rest ${step.round} of ${step.rounds - 1}`;
    case 'finisher-score':
      return 'Finisher · Score';
  }
}

function stepDuration(step: SessionStep): number {
  if (step.kind === 'warmup') return step.duration;
  if (step.kind === 'rest') return step.duration;
  if (step.kind === 'work' && step.holdFor) return step.holdFor;
  if (step.kind === 'finisher-work' || step.kind === 'finisher-rest') return step.duration;
  return 0; // rep-based work, logging, finisher intro, score entry: untimed
}

// What the logger's number means for this exercise: reps, seconds, or steps.
function measureOf(exerciseId: string): 'reps' | 'seconds' | 'steps' {
  const kind = getExercise(exerciseId).prescription.kind;
  if (kind === 'hold') return 'seconds';
  if (kind === 'steps') return 'steps';
  return 'reps';
}

export function GuidedSession({
  workout,
  dateString,
  weightUnit,
  onClose,
  onExerciseComplete,
  onSessionLogged,
}: GuidedSessionProps) {
  // The session is frozen at the moment it starts. Logging a set recomputes the
  // progression snapshot, which produces a new `workout` object with new targets — and
  // rebuilding the step list mid-session would renumber the steps under the user's feet,
  // sending them back through work they had already finished.
  const frozenWorkout = useRef(workout);
  const steps = useMemo(() => buildSessionSteps(frozenWorkout.current), []);
  const [idx, setIdx] = useState(0);
  const [remaining, setRemaining] = useState(() => stepDuration(steps[0]));
  const [paused, setPaused] = useState(false);
  const [finished, setFinished] = useState(false);
  const [muted, setMuted] = useState(() => localStorage.getItem(MUTE_KEY) === '1');
  const [music, setMusic] = useState(() => musicEnabled());
  const [voice, setVoice] = useState(() => voiceEnabled());
  const [nowPlaying, setNowPlaying] = useState<MusicTrack | null>(null);
  const restsSeen = useRef(0);

  useEffect(() => onTrackChange(setNowPlaying), []);

  const toggleVoice = () => {
    setVoice((on) => {
      const next = !on;
      setVoiceEnabled(next);
      if (!next) stopSpeaking();
      return next;
    });
  };

  // Ambience runs for the session's lifetime and no longer: it starts with the
  // overlay (we are past the Start tap, so autoplay is allowed) and fades out
  // when the session closes, however it closes.
  useEffect(() => {
    if (music) startMusic();
    else stopMusic();
  }, [music]);
  useEffect(() => () => stopMusic(), []);

  const toggleMusic = () => {
    setMusic((on) => {
      const next = !on;
      setMusicEnabled(next);
      return next;
    });
  };

  // Finisher scoring state
  const [bestScore, setBestScore] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [prResult, setPrResult] = useState<{ isPR: boolean; previousBest: number | null } | null>(null);

  const mutedRef = useRef(muted);
  mutedRef.current = muted;
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  // Live follow: sharing opens a relay socket; every screen change is re-sent so a
  // partner's phone mirrors this one. Read-only on their side by construction.
  const [shareCode, setShareCode] = useState<string | null>(null);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [shareLive, setShareLive] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const broadcaster = useRef<LiveBroadcaster | null>(null);

  const copyShareLink = (code: string) => {
    navigator.clipboard?.writeText(shareUrlFor(code)).then(
      () => {
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2000);
      },
      () => {}
    );
  };

  const toggleShare = () => {
    if (shareCode) {
      broadcaster.current?.close();
      broadcaster.current = null;
      setShareCode(null);
      setShareLive(false);
      return;
    }
    const code = makeShareCode();
    setShareCode(code);
    broadcaster.current = startBroadcast(code, setShareLive);
    copyShareLink(code);
  };

  // The socket must not outlive the session.
  useEffect(() => () => broadcaster.current?.close(), []);
  useEffect(() => () => stopSpeaking(), []);

  const step = steps[idx];
  const timed = stepDuration(step) > 0;

  const finisher = frozenWorkout.current.finisher;

  // Load the score to beat once per session.
  useEffect(() => {
    if (!finisher) return;
    getBestFinisherScore(finisher.id).then(setBestScore);
  }, [finisher]);

  const goPrev = () => setIdx((i) => Math.max(0, i - 1));

  const toggleMute = () => {
    setMuted((m) => {
      const next = !m;
      localStorage.setItem(MUTE_KEY, next ? '1' : '0');
      if (!next) initAudio();
      return next;
    });
  };

  const beep = (fn: () => void) => {
    if (!mutedRef.current) fn();
  };

  const buzz = (pattern: number | number[]) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(pattern);
  };

  // Entering a new step: reset timer, play the entry cue, and let the coach talk.
  // The voice is rationed by design — instructions once per exercise, pacing on
  // the last set and final round, encouragement every other rest, never per rep.
  useEffect(() => {
    if (finished) {
      speakRandom(WRAPUPS);
      return;
    }
    setRemaining(stepDuration(step));
    setPaused(false);
    if (step.kind === 'rest' || step.kind === 'finisher-rest') {
      beep(cueRest);
      buzz(20);
    } else if (step.kind === 'finisher-score') {
      // quiet — let them catch their breath and count
    } else {
      beep(cueGo);
      buzz(30);
    }

    switch (step.kind) {
      case 'warmup':
        speak(voiceFileForExercise(step.id));
        break;
      case 'work':
        if (step.set === 1) speak(voiceFileForExercise(step.id));
        else if (step.isLastSet && step.sets > 1) speak(PACING.lastSet.file);
        break;
      case 'rest':
      case 'finisher-rest':
        restsSeen.current += 1;
        if (restsSeen.current % 2 === 0) speakRandom(ENCOURAGEMENTS);
        break;
      case 'finisher-intro':
        speak(voiceFileForFinisher(step.finisher.id));
        break;
      case 'finisher-work':
        if (step.rounds > 1 && step.round === step.rounds) speak(PACING.finalRound.file);
        break;
      case 'finisher-score':
        speak(PACING.score.file);
        break;
      case 'symptom-check':
        speak(PACING.checkIn.file);
        break;
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

  // What was actually logged, kept for the done screen: the session should end by
  // showing what you did, not just that you did something.
  const recap = useRef<Array<{ name: string; summary: string }>>([]);

  // Record what actually happened. This is the engine's only input — skipping it
  // leaves the prescription frozen where it is.
  const saveSets = async (
    exerciseId: string,
    prescribedSets: number,
    rows: Array<{ reps: number; load: number; rir: number }>
  ) => {
    await saveSetLogs(dateString, exerciseId, prescribedSets, rows);
    const best = Math.max(...rows.map((r) => r.reps));
    const load = rows[0]?.load ?? 0;
    const unit = measureOf(exerciseId) === 'seconds' ? 's' : measureOf(exerciseId) === 'steps' ? ' steps' : '';
    recap.current.push({
      name: getExercise(exerciseId).name,
      summary: `${rows.length} × ${best}${unit}${load > 0 ? ` · ${load} ${weightUnit}` : ''}`,
    });
    onSessionLogged();
    advance(false);
  };

  const saveSymptoms = async (reports: Array<{ region: PainRegion; nprs: number }>) => {
    for (const r of reports) await saveSymptom(dateString, r.region, r.nprs);
    onSessionLogged();
    advance(false);
  };

  // Save the finisher score, check for a PR, then advance.
  const submitScore = async () => {
    if (step.kind !== 'finisher-score') return;
    const result = await saveFinisherScore(dateString, step.finisher.id, score);
    setPrResult(result);
    onExerciseComplete(step.finisher.id);
    if (result.isPR) {
      beep(cueDone);
      buzz([80, 50, 80, 50, 160]);
      celebrate(2400);
    }
    advance(false);
  };

  // Mirror this screen to anyone following the share link. Re-sent on every tick,
  // so the viewer never needs its own clock (or trust in one).
  useEffect(() => {
    if (!shareCode || !broadcaster.current) return;
    if (finished) {
      broadcaster.current.send({
        kind: 'done',
        detail:
          prResult && finisher
            ? `${score} ${finisher.scoreUnit}${prResult.isPR ? ' — a new record' : ''}`
            : undefined,
        music: musicStatus(),
        idx: steps.length,
        total: steps.length,
      });
      return;
    }
    broadcaster.current.send({
      kind: 'step',
      ...liveStateForStep(step, phaseLabelFor(step), weightUnit),
      timer: timed ? { remaining, paused } : undefined,
      music: musicStatus(),
      idx: idx + 1,
      total: steps.length,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shareCode, idx, remaining, paused, finished]);

  // Countdown tick for timed steps.
  useEffect(() => {
    if (finished || !timed || paused) return;
    const t = setInterval(() => {
      setRemaining((r) => r - 1);
    }, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, paused, timed, finished]);

  // Last-3-seconds tick cue, then advance at zero (auto-completing the set).
  // Long timed efforts get a spoken halfway marker — the pacing the clock
  // shows but tired eyes stop reading.
  useEffect(() => {
    if (finished || !timed) return;
    if (remaining > 0 && remaining <= 3) beep(cueTick);
    const total = stepDuration(step);
    if (total >= 40 && remaining === Math.ceil(total / 2) && step.kind !== 'rest') {
      speak(PACING.halfway.file, 0);
    }
    if (remaining <= 0) advance(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining]);

  // Keyboard navigation: ←/→ seek, space/enter = primary action, M mute, Esc close.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (finished) {
        if (e.key === 'Enter' || e.key === 'Escape' || e.key === ' ') {
          e.preventDefault();
          onClose();
        }
        return;
      }
      // Data-entry steps own their own keyboard: space and enter must reach the
      // stepper and scale buttons, not skip the step.
      const isDataStep = step.kind === 'log' || step.kind === 'symptom-check';

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          goPrev();
          break;
        case 'ArrowRight':
          e.preventDefault();
          advance(false);
          break;
        case ' ':
        case 'Enter':
          if (isDataStep) break;
          e.preventDefault();
          if (step.kind === 'finisher-score') submitScore();
          else if (step.kind === 'rest' || step.kind === 'finisher-rest' || step.kind === 'finisher-intro')
            advance(false);
          else if (timed) setPaused((p) => !p);
          else advance(true);
          break;
        case 'm':
        case 'M':
          toggleMute();
          break;
        case 'Escape':
          onClose();
          break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, finished, timed, step, score]);

  // Swipe: left = next/skip, right = previous.
  const onTouchStart = (e: TouchEvent) => {
    const t = e.changedTouches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  };
  const onTouchEnd = (e: TouchEvent) => {
    if (!touchStart.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.current.x;
    const dy = t.clientY - touchStart.current.y;
    touchStart.current = null;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (dx < 0) advance(false);
      else goPrev();
    }
  };

  const completedExercises = useMemo(() => {
    const ids = new Set<string>();
    steps.slice(0, idx).forEach((s) => {
      if (s.kind === 'work' && s.isLastSet) ids.add(s.id);
      if (s.kind === 'finisher-score') ids.add(s.finisher.id);
    });
    return ids.size;
  }, [steps, idx]);

  if (finished) {
    return (
      <div class="session-overlay">
        <div class="session-done">
          <div class="session-done-check">
            {prResult?.isPR ? (
              <Trophy size={40} strokeWidth={2.5} style={{ color: 'var(--check)' }} />
            ) : (
              <Check size={40} strokeWidth={3} style={{ color: 'var(--check)' }} />
            )}
          </div>
          <h2 class="text-2xl font-semibold mt-4">
            {prResult?.isPR ? 'New record!' : 'Session complete'}
          </h2>
          {prResult?.isPR && finisher && (
            <p class="mt-2 font-medium" style={{ color: 'var(--check)' }}>
              {score} {finisher.scoreUnit} — previous best was {prResult.previousBest}.
            </p>
          )}
          <p class="mt-2" style={{ color: 'var(--text-dim)' }}>
            {DONE_LINES[completedExercises % DONE_LINES.length]}
          </p>
          <p class="mt-1 text-sm" style={{ color: 'var(--text-dim)' }}>
            {completedExercises} exercises done.
          </p>
          {recap.current.length > 0 && (
            <dl class="session-recap">
              {recap.current.map((r) => (
                <div key={r.name} class="session-recap-row">
                  <dt>{r.name}</dt>
                  <dd>{r.summary}</dd>
                </div>
              ))}
            </dl>
          )}
          <button class="session-btn-primary mt-8" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    );
  }

  const total = steps.length;
  const isDataStep = step.kind === 'log' || step.kind === 'symptom-check';
  const isRest = step.kind === 'rest' || step.kind === 'finisher-rest';
  const isFinisherStep =
    step.kind === 'finisher-intro' ||
    step.kind === 'finisher-work' ||
    step.kind === 'finisher-rest' ||
    step.kind === 'finisher-score';

  const phaseLabel = phaseLabelFor(step);

  return (
    <div class="session-overlay" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      {/* Top bar */}
      <div class="session-top">
        <button onClick={onClose} class="session-icon-btn" aria-label="Close session">
          <X size={20} />
        </button>
        <span class="text-xs" style={{ color: 'var(--text-dim)' }}>
          {idx + 1} / {total}
        </span>
        <button
          onClick={() => setOptionsOpen((o) => !o)}
          class="session-icon-btn"
          aria-label="Session options"
          aria-expanded={optionsOpen}
        >
          <Settings2 size={20} />
        </button>
      </div>

      {optionsOpen && (
        <>
          <div class="session-options-backdrop" onClick={() => setOptionsOpen(false)} />
          <div class="session-options" role="menu" aria-label="Session options">
            <button class="session-option" data-on={voice ? 'true' : undefined} onClick={toggleVoice} role="menuitemcheckbox" aria-checked={voice}>
              <Mic size={16} />
              <span>Coach voice</span>
              <span class="session-option-state">{voice ? 'On' : 'Off'}</span>
            </button>
            <button class="session-option" data-on={music ? 'true' : undefined} onClick={toggleMusic} role="menuitemcheckbox" aria-checked={music}>
              <Music size={16} />
              <span>Music</span>
              <span class="session-option-state">{music ? 'On' : 'Off'}</span>
            </button>
            <button class="session-option" data-on={!muted ? 'true' : undefined} onClick={toggleMute} role="menuitemcheckbox" aria-checked={!muted}>
              {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              <span>Sound cues</span>
              <span class="session-option-state">{muted ? 'Off' : 'On'}</span>
            </button>
            <button class="session-option" data-on={shareCode ? 'true' : undefined} onClick={toggleShare} role="menuitemcheckbox" aria-checked={!!shareCode}>
              <Radio size={16} />
              <span>Share live</span>
              <span class="session-option-state">{shareCode ? (shareLive ? 'Live' : '…') : 'Off'}</span>
            </button>
          </div>
        </>
      )}

      <div class="session-progress">
        <div class="session-progress-fill" style={{ width: `${((idx + 1) / total) * 100}%` }} />
      </div>

      {/* Live share strip — visible only while sharing, tap to re-copy the link. */}
      {shareCode && (
        <button class="session-share" onClick={() => copyShareLink(shareCode)} data-live={shareLive ? 'true' : undefined}>
          <Radio size={13} strokeWidth={2.5} />
          <span>
            {shareLive ? 'Live' : 'Connecting'} · {shareCode}
          </span>
          <span class="session-share-hint">{shareCopied ? 'Link copied' : 'Tap to copy link'}</span>
        </button>
      )}

      {/* Now playing — what the speaker is doing, and a way to change its mind. */}
      {nowPlaying && (
        <div class="session-player">
          <Music size={13} strokeWidth={2.5} class="session-player-icon" />
          <span class="session-player-title">{nowPlaying.title}</span>
          <span class="session-player-artist">{nowPlaying.artist.split(' (')[0]}</span>
          <button onClick={skipTrack} class="session-player-skip" aria-label="Next track">
            <SkipForward size={16} />
          </button>
        </div>
      )}

      {/* Body */}
      <div class="session-body">
        <p
          class="session-phase"
          style={{
            color: isRest ? 'var(--check)' : isFinisherStep ? 'var(--flame)' : 'var(--text-dim)',
          }}
        >
          {phaseLabel}
        </p>

        {step.kind === 'rest' ? (
          <>
            <p class="session-encourage">{REST_ENCOURAGEMENT[idx % REST_ENCOURAGEMENT.length]}</p>
            <div class="session-timer">{fmt(remaining)}</div>
            <p class="session-next" style={{ color: 'var(--text-dim)' }}>
              Next: {step.nextName}
            </p>
          </>
        ) : step.kind === 'finisher-rest' ? (
          <>
            <p class="session-encourage">
              {FINISHER_REST_LINES[step.round % FINISHER_REST_LINES.length]}
            </p>
            <div class="session-timer">{fmt(remaining)}</div>
            <p class="session-next" style={{ color: 'var(--text-dim)' }}>
              Next: Round {step.round + 1} of {step.rounds}
            </p>
          </>
        ) : step.kind === 'finisher-intro' ? (
          <>
            <div class="finisher-flame">
              <Flame size={28} strokeWidth={2.25} />
            </div>
            <h2 class="session-name">{step.finisher.name}</h2>
            <img
              src={`/exercises/${step.finisher.id}.webp`}
              alt={`${step.finisher.name} circuit`}
              class="session-image"
              loading="eager"
            />
            <p class="session-cue">{step.finisher.tagline}</p>
            <div class="finisher-spec">
              {step.finisher.format === 'intervals' ? (
                <span>
                  {step.finisher.rounds} × {step.finisher.workSeconds}s on / {step.finisher.restSeconds}s off
                </span>
              ) : (
                <span>
                  {Math.round((step.finisher.durationSeconds ?? 240) / 60)} min AMRAP · {step.finisher.task}
                </span>
              )}
            </div>
            <p class="finisher-target">
              {bestScore !== null ? (
                <>
                  Score to beat: <strong>{bestScore} {step.finisher.scoreUnit}</strong>
                </>
              ) : (
                <>First time — set the bar. Count your {step.finisher.scoreUnit}.</>
              )}
            </p>
          </>
        ) : step.kind === 'finisher-work' ? (
          <>
            <h2 class="session-name">{step.finisher.name}</h2>
            <img
              src={`/exercises/${step.finisher.id}.webp`}
              alt={`${step.finisher.name} circuit`}
              class="session-image"
              loading="eager"
            />
            <div class="session-timer">{fmt(remaining)}</div>
            <p class="session-cue">
              {step.finisher.format === 'amrap' ? step.finisher.task : step.finisher.scoreCue}
            </p>
          </>
        ) : step.kind === 'finisher-score' ? (
          <>
            <h2 class="session-name">How many {step.finisher.scoreUnit}?</h2>
            <div class="score-stepper">
              <button
                class="score-stepper-btn"
                onClick={() => setScore((s) => Math.max(0, s - 1))}
                aria-label="Decrease score"
              >
                <Minus size={22} />
              </button>
              <input
                class="score-stepper-value"
                type="text"
                inputMode="numeric"
                value={score}
                onInput={(e) => {
                  const v = parseInt((e.target as HTMLInputElement).value, 10);
                  setScore(Number.isNaN(v) ? 0 : Math.max(0, v));
                }}
              />
              <button
                class="score-stepper-btn"
                onClick={() => setScore((s) => s + 1)}
                aria-label="Increase score"
              >
                <Plus size={22} />
              </button>
            </div>
            {bestScore !== null && (
              <p class="finisher-target">
                Best: {bestScore} {step.finisher.scoreUnit}
                {score > bestScore && (
                  <span style={{ color: 'var(--check)' }}> — that’s a new record</span>
                )}
              </p>
            )}
          </>
        ) : step.kind === 'log' ? (
          <SetLogger
            name={step.name}
            sets={step.sets}
            target={step.target}
            load={step.load}
            unitLabel={weightUnit}
            measure={measureOf(step.exerciseId)}
            onSave={(rows) => saveSets(step.exerciseId, step.sets, rows)}
          />
        ) : step.kind === 'symptom-check' ? (
          <SymptomCheck onSave={saveSymptoms} />
        ) : (
          <>
            <h2 class="session-name">{step.name}</h2>
            <ExerciseImage id={step.id} alt={step.name} imgClass="session-image" />
            {timed ? (
              <div class="session-timer">{fmt(remaining)}</div>
            ) : (
              step.kind === 'work' && <div class="session-reps">{step.targetLabel}</div>
            )}
            {step.kind === 'work' && (step.load > 0 || step.tempo) && (
              <p class="session-dose">
                {step.load > 0 && (
                  <span>
                    {step.load} {weightUnit}
                  </span>
                )}
                {step.load > 0 && step.tempo && <span aria-hidden="true"> · </span>}
                {step.tempo && (
                  <span title="Seconds: lower, pause, lift, squeeze">
                    Tempo {step.tempo.eccentric}-{step.tempo.pauseBottom}-{step.tempo.concentric}-
                    {step.tempo.pauseTop}
                  </span>
                )}
              </p>
            )}
            <p class="session-cue">{step.cue}</p>
          </>
        )}
      </div>

      {/* Controls */}
      <div class="session-controls">
        <button onClick={goPrev} class="session-icon-btn" disabled={idx === 0} aria-label="Previous">
          <ChevronLeft size={22} />
        </button>

        {isDataStep ? (
          // SetLogger and SymptomCheck each own their save button.
          <span class="session-controls-spacer" />
        ) : step.kind === 'finisher-intro' ? (
          <button onClick={() => advance(false)} class="session-btn-primary session-btn-wide">
            <Flame size={18} /> Go
          </button>
        ) : step.kind === 'finisher-score' ? (
          <button onClick={submitScore} class="session-btn-primary session-btn-wide">
            <Check size={18} /> Save score
          </button>
        ) : isRest ? (
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
