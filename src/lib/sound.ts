// Session cue player. Plays short CC0 / public-domain audio files via Web Audio
// for low latency. Buffers are decoded once and cached; created on first user
// gesture (the Start button calls initAudio).

type Cue = 'tick' | 'go' | 'rest' | 'done';

const FILES: Record<Cue, string> = {
  tick: '/sounds/tick.ogg',
  go: '/sounds/go.wav',
  rest: '/sounds/rest.wav',
  done: '/sounds/done.ogg',
};

let ctx: AudioContext | null = null;
const buffers: Partial<Record<Cue, AudioBuffer>> = {};

export function initAudio(): void {
  if (typeof window === 'undefined') return;
  if (!ctx) {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    ctx = new Ctor();
    // Preload + decode all cues.
    (Object.keys(FILES) as Cue[]).forEach(async (cue) => {
      try {
        const res = await fetch(FILES[cue]);
        const data = await res.arrayBuffer();
        buffers[cue] = await ctx!.decodeAudioData(data);
      } catch {
        /* cue stays unavailable; playback is a no-op */
      }
    });
  }
  if (ctx.state === 'suspended') void ctx.resume();
}

function play(cue: Cue, volume: number): void {
  const buf = buffers[cue];
  if (!ctx || !buf) return;
  const src = ctx.createBufferSource();
  const gain = ctx.createGain();
  gain.gain.value = volume;
  src.buffer = buf;
  src.connect(gain);
  gain.connect(ctx.destination);
  src.start();
}

export const cueTick = () => play('tick', 0.5);
export const cueGo = () => play('go', 0.8);
export const cueRest = () => play('rest', 0.7);
export const cueDone = () => play('done', 0.9);
