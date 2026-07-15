import { useState, useEffect } from 'preact/hooks';
import { Radio, X, Music } from 'lucide-preact';
import { watchSession, type LiveState } from '../lib/live';
import { musicEnabled, syncMusic, stopFollowMusic } from '../lib/music';

// The read-only mirror of someone else's guided session. Opened from a share link
// (?follow=CODE), it renders whatever the host's screen currently says — same
// exercise, same set, same clock — and nothing else. There is nothing to tap
// through and nothing to log: the person training owns the session.

interface FollowViewProps {
  code: string;
}

function fmt(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.max(0, s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export function FollowView({ code }: FollowViewProps) {
  const [state, setState] = useState<LiveState>({ kind: 'waiting' });
  const [connected, setConnected] = useState(false);
  // Mirror the host's music through the local bundled copy. Browsers refuse
  // audio without a gesture, so a blocked attempt flips the toggle off and the
  // Music button (a tap — a gesture) turns it back on.
  const [tunes, setTunes] = useState(() => musicEnabled());

  useEffect(() => watchSession(code, setState, setConnected), [code]);

  useEffect(() => {
    if (!tunes) {
      stopFollowMusic();
      return;
    }
    if (state.kind === 'step' || state.kind === 'done') {
      syncMusic(state.music ?? null, () => setTunes(false));
    } else {
      stopFollowMusic();
    }
  }, [state, tunes]);
  useEffect(() => () => stopFollowMusic(), []);

  const leave = () => {
    location.href = location.origin;
  };

  const isLive = state.kind === 'step' && connected;

  return (
    <div class="session-overlay">
      <div class="session-top">
        <button onClick={leave} class="session-icon-btn" aria-label="Stop following">
          <X size={20} />
        </button>
        <span class="follow-badge" data-live={isLive ? 'true' : undefined}>
          <Radio size={13} strokeWidth={2.5} />
          {isLive ? `Live · ${code}` : code}
        </span>
        <button
          onClick={() => setTunes((t) => !t)}
          class="session-icon-btn"
          data-music={tunes ? 'true' : undefined}
          aria-label={tunes ? 'Stop mirroring their music' : 'Play their music too'}
          aria-pressed={tunes}
        >
          <Music size={20} />
        </button>
      </div>

      <div class="session-body">
        {state.kind === 'step' ? (
          <>
            {state.phase && <p class="session-phase" style={{ color: 'var(--text-dim)' }}>{state.phase}</p>}
            <h2 class="session-name">{state.name}</h2>
            {state.imageId && (
              <img
                src={`/exercises/${state.imageId}.webp`}
                alt={state.name ?? ''}
                class="session-image"
                loading="eager"
              />
            )}
            {state.timer ? (
              <div class="session-timer">
                {fmt(state.timer.remaining)}
                {state.timer.paused && (
                  <span class="follow-paused"> paused</span>
                )}
              </div>
            ) : (
              state.detail && <div class="session-reps">{state.detail}</div>
            )}
            {state.timer && state.detail && <p class="session-dose">{state.detail}</p>}
            {state.cue && <p class="session-cue">{state.cue}</p>}
          </>
        ) : state.kind === 'done' ? (
          <>
            <p class="session-phase" style={{ color: 'var(--check)' }}>Session complete</p>
            <h2 class="session-name">They made it.</h2>
            {state.detail && <div class="session-reps">{state.detail}</div>}
            <p class="session-cue">Tell them well done.</p>
          </>
        ) : state.kind === 'ended' ? (
          <>
            <p class="session-phase" style={{ color: 'var(--text-dim)' }}>Session ended</p>
            <h2 class="session-name">The session closed</h2>
            <p class="session-cue">Ask them to share a new link next time they train.</p>
          </>
        ) : (
          <>
            <p class="session-phase" style={{ color: 'var(--text-dim)' }}>
              {connected ? 'Waiting to start' : 'Connecting…'}
            </p>
            <h2 class="session-name">Following {code}</h2>
            <p class="session-cue">
              When they start moving, you will see the same exercise, set and clock they do.
            </p>
          </>
        )}
      </div>

      {tunes && state.kind === 'step' && state.music && (
        <div class="session-player follow-player">
          <Music size={13} strokeWidth={2.5} class="session-player-icon" />
          <span class="session-player-title">{state.music.title}</span>
          <span class="session-player-artist">with them, in sync</span>
        </div>
      )}

      <div class="session-controls">
        <span class="session-controls-spacer" />
      </div>
    </div>
  );
}
