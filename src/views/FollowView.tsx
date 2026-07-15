import { useState, useEffect } from 'preact/hooks';
import { Radio, X } from 'lucide-preact';
import { watchSession, type LiveState } from '../lib/live';

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

  useEffect(() => watchSession(code, setState, setConnected), [code]);

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
        <span class="session-icon-btn" aria-hidden="true" />
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

      <div class="session-controls">
        <span class="session-controls-spacer" />
      </div>
    </div>
  );
}
