// Session cues, synthesized. No samples: every cue is a couple of soft mallet
// strikes shaped in Web Audio — a warm triangle-plus-harmonic voice with a fast
// attack and an exponential decay, run through a gentle lowpass so nothing pierces.
// Designed to sit over the background music (which ducks briefly under each cue)
// and to read as rhythm, not alarm — the old sampled countdown beeped like a
// microwave, which is exactly the feeling being removed here.

import { duckMusic } from './music';

let ctx: AudioContext | null = null;
let master: GainNode | null = null;

export function initAudio(): void {
  if (typeof window === 'undefined') return;
  if (!ctx) {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    ctx = new Ctor();
    master = ctx.createGain();
    master.gain.value = 1;
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 3200;
    master.connect(lowpass);
    lowpass.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') void ctx.resume();
}

// One mallet strike: a triangle fundamental with a quiet sine an octave up,
// both decaying exponentially. `bright` shortens the decay for tick-like hits.
function strike(freq: number, at: number, vol: number, decay: number): void {
  if (!ctx || !master) return;
  const t = ctx.currentTime + at;

  const fundamental = ctx.createOscillator();
  fundamental.type = 'triangle';
  fundamental.frequency.value = freq;

  const overtone = ctx.createOscillator();
  overtone.type = 'sine';
  overtone.frequency.value = freq * 2;
  overtone.detune.value = 4; // a hair sharp — the shimmer that reads as "mallet"

  const env = ctx.createGain();
  env.gain.setValueAtTime(0.0001, t);
  env.gain.exponentialRampToValueAtTime(vol, t + 0.008);
  env.gain.exponentialRampToValueAtTime(0.0001, t + decay);

  const overtoneGain = ctx.createGain();
  overtoneGain.gain.value = 0.35;

  fundamental.connect(env);
  overtone.connect(overtoneGain);
  overtoneGain.connect(env);
  env.connect(master);

  fundamental.start(t);
  overtone.start(t);
  fundamental.stop(t + decay + 0.05);
  overtone.stop(t + decay + 0.05);
}

// The last-three-seconds count: one soft, low wood-block tap. Quiet on purpose —
// it marks time, it does not nag.
export function cueTick(): void {
  if (!ctx) return;
  duckMusic(350);
  strike(523.25, 0, 0.16, 0.09); // C5, very short
}

// Work begins: two quick rising notes — inhale, go.
export function cueGo(): void {
  if (!ctx) return;
  duckMusic(700);
  strike(440, 0, 0.4, 0.28); // A4
  strike(659.25, 0.11, 0.45, 0.34); // E5
}

// Rest begins: the same figure falling — exhale.
export function cueRest(): void {
  if (!ctx) return;
  duckMusic(700);
  strike(659.25, 0, 0.35, 0.28); // E5
  strike(440, 0.11, 0.4, 0.4); // A4, allowed to ring
}

// Session done: a small A-major arpeggio that overlaps into a chord.
export function cueDone(): void {
  if (!ctx) return;
  duckMusic(1400);
  strike(440, 0, 0.4, 0.5); // A4
  strike(554.37, 0.13, 0.4, 0.5); // C#5
  strike(659.25, 0.26, 0.45, 0.7); // E5
  strike(880, 0.42, 0.3, 0.9); // A5, the sparkle on top
}
