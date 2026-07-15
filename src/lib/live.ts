// Live follow — one phone runs the guided session, another watches it happen.
//
// The host opens a WebSocket to the relay worker (worker/live.ts) and sends a small
// display state whenever the session's screen changes. A viewer who opens the share
// link sees exactly what the host sees: same exercise, same set, same clock. The
// viewer is read-only by construction — the relay only carries host → viewer.

import type { SessionStep } from '../data/workouts';

const LIVE_HOST = import.meta.env.VITE_LIVE_HOST ?? 'idaraya-live.straitstreetco.workers.dev';

// What a viewer needs to render one session screen. Kept flat and tiny: this is a
// wire format, not a model. `timer` carries the host's remaining seconds; the host
// re-sends on every tick, so the viewer never runs its own clock.
export interface LiveState {
  kind: 'step' | 'done' | 'waiting' | 'ended';
  phase?: string; // "Superset A · Round 1 of 3", "Warm-up", "Finisher · Round 2 of 6"
  name?: string;
  detail?: string; // the dose or target line
  cue?: string;
  imageId?: string; // renders as /exercises/<id>.webp
  timer?: { remaining: number; paused: boolean };
  idx?: number;
  total?: number;
}

// Unambiguous alphabet: no 0/O, no 1/I/L.
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function makeShareCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join('');
}

export function shareUrlFor(code: string): string {
  return `${location.origin}/?follow=${code}`;
}

export function followCodeFromUrl(): string | null {
  const code = new URLSearchParams(location.search).get('follow');
  if (!code) return null;
  const clean = code.toUpperCase();
  return /^[A-Z0-9]{4,12}$/.test(clean) ? clean : null;
}

// The pure mapping from a session step to what the viewer's screen should say.
// Exhaustive over SessionStep: a new step kind fails to compile here rather than
// rendering a blank viewer.
export function liveStateForStep(
  step: SessionStep,
  phaseLabel: string,
  weightUnit: 'kg' | 'lbs'
): Omit<LiveState, 'kind' | 'timer' | 'idx' | 'total'> {
  switch (step.kind) {
    case 'warmup':
      return { phase: phaseLabel, name: step.name, cue: step.cue, imageId: step.id };
    case 'work': {
      const load = step.load > 0 ? ` · ${step.load} ${weightUnit}` : '';
      return {
        phase: phaseLabel,
        name: step.name,
        detail: `Set ${step.set} of ${step.sets} · ${step.targetLabel}${load}`,
        cue: step.cue,
        imageId: step.id,
      };
    }
    case 'rest':
      return { phase: phaseLabel, name: 'Rest', detail: `Next: ${step.nextName}` };
    case 'log':
      return { phase: phaseLabel, name: step.name, detail: 'Logging sets' };
    case 'finisher-intro':
      return {
        phase: phaseLabel,
        name: step.finisher.name,
        detail: step.finisher.tagline,
        imageId: step.finisher.id,
      };
    case 'finisher-work':
      return {
        phase: phaseLabel,
        name: step.finisher.name,
        cue: step.finisher.format === 'amrap' ? step.finisher.task : step.finisher.scoreCue,
        imageId: step.finisher.id,
      };
    case 'finisher-rest':
      return { phase: phaseLabel, name: 'Rest', detail: `Next: Round ${step.round + 1} of ${step.rounds}` };
    case 'finisher-score':
      return { phase: phaseLabel, name: step.finisher.name, detail: 'Counting the score' };
    case 'symptom-check':
      return { phase: phaseLabel, name: 'Checking in', detail: 'How did that feel?' };
  }
}

// ── Host side ────────────────────────────────────────────────────────────────
// A small self-healing sender: queues nothing, drops nothing important (the next
// state supersedes the last), reconnects with a short backoff while the session
// is open, and goes quiet when closed.

export interface LiveBroadcaster {
  send(state: LiveState): void;
  close(): void;
}

export function startBroadcast(code: string, onStatus?: (up: boolean) => void): LiveBroadcaster {
  let ws: WebSocket | null = null;
  let closed = false;
  let lastState: string | null = null;
  let retry: ReturnType<typeof setTimeout> | null = null;

  const connect = () => {
    if (closed) return;
    ws = new WebSocket(`wss://${LIVE_HOST}/session/${code}/host`);
    ws.onopen = () => {
      onStatus?.(true);
      if (lastState) ws?.send(lastState);
    };
    const down = () => {
      onStatus?.(false);
      if (!closed && !retry) retry = setTimeout(() => ((retry = null), connect()), 2000);
    };
    ws.onclose = down;
    ws.onerror = down;
  };
  connect();

  return {
    send(state: LiveState) {
      lastState = JSON.stringify(state);
      if (ws?.readyState === WebSocket.OPEN) ws.send(lastState);
    },
    close() {
      closed = true;
      if (retry) clearTimeout(retry);
      ws?.close();
    },
  };
}

// ── Viewer side ──────────────────────────────────────────────────────────────

export function watchSession(
  code: string,
  onState: (state: LiveState) => void,
  onConnection?: (up: boolean) => void
): () => void {
  let closed = false;
  let ws: WebSocket | null = null;
  let retry: ReturnType<typeof setTimeout> | null = null;

  const connect = () => {
    if (closed) return;
    ws = new WebSocket(`wss://${LIVE_HOST}/session/${code}/watch`);
    ws.onopen = () => onConnection?.(true);
    ws.onmessage = (e) => {
      try {
        const state = JSON.parse(e.data as string) as LiveState;
        if (state && typeof state.kind === 'string') onState(state);
      } catch {
        // a malformed frame is dropped, not fatal
      }
    };
    const down = () => {
      onConnection?.(false);
      if (!closed && !retry) retry = setTimeout(() => ((retry = null), connect()), 2000);
    };
    ws.onclose = down;
    ws.onerror = down;
  };
  connect();

  return () => {
    closed = true;
    if (retry) clearTimeout(retry);
    ws?.close();
  };
}
