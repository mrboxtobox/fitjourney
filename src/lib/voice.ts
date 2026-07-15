// The coach's voice — pre-generated Kokoro TTS clips, bundled under /voice.
//
// Every line the coach can say is known at build time, so the 82M model never
// ships to a phone: scripts/generate-voice.ts renders THIS manifest to mp3 with
// Kokoro (Apache 2.0) and the app just plays files. One source of truth: the
// generator imports these exact lines, and the asset guard fails if a line has
// no file or a file has no line.
//
// Voice design: instructions state the movement once; pacing lines mark where
// you are (last set, final round, halfway); encouragement is rationed — every
// other rest, not every breath — so it stays a coach, not a chatterbox.

import { EXERCISES, WARMUP } from '../data/exercises';
import { FINISHERS } from '../data/workouts';
import { duckMusic } from './music';

export interface VoiceLine {
  file: string; // under /voice/
  text: string;
}

const exerciseLine = (name: string, cue: string): string => `${name}. ${cue}`;

export const ENCOURAGEMENTS: VoiceLine[] = [
  { file: 'enc-1.mp3', text: 'Good work. Breathe, and reset.' },
  { file: 'enc-2.mp3', text: "You're moving well. Keep that form." },
  { file: 'enc-3.mp3', text: 'Strong set. Shake it loose.' },
  { file: 'enc-4.mp3', text: 'Stay with it. It all adds up.' },
  { file: 'enc-5.mp3', text: 'Nice pace. Recover, then go again.' },
  { file: 'enc-6.mp3', text: "Deep breath. You've got more in you." },
  { file: 'enc-7.mp3', text: 'Small rests, big returns.' },
  { file: 'enc-8.mp3', text: "That's how it's done. Next one soon." },
];

export const WRAPUPS: VoiceLine[] = [
  { file: 'wrap-1.mp3', text: "That's the session. You showed up — and that's the whole game." },
  { file: 'wrap-2.mp3', text: 'Done. Consistency is the superpower, and you just proved it again.' },
  { file: 'wrap-3.mp3', text: 'Session complete. Strong today, stronger tomorrow.' },
  { file: 'wrap-4.mp3', text: 'The work is banked. Nobody can take that back.' },
  { file: 'wrap-5.mp3', text: 'What stands in the way becomes the way. Well done.' },
  { file: 'wrap-6.mp3', text: 'Another brick in the wall. See you tomorrow.' },
];

export const PACING: Record<string, VoiceLine> = {
  lastSet: { file: 'pace-last-set.mp3', text: 'Last set. Make it count.' },
  finalRound: { file: 'pace-final-round.mp3', text: 'Final round. Empty the tank.' },
  halfway: { file: 'pace-halfway.mp3', text: 'Halfway. Stay smooth.' },
  score: { file: 'pace-score.mp3', text: 'Count it up, and log your score.' },
  checkIn: { file: 'pace-check-in.mp3', text: "Session's done. How did that feel?" },
  cooldown: { file: 'pace-cooldown.mp3', text: 'Cooldown. Slow everything down, and breathe.' },
};

export const voiceFileForExercise = (id: string): string => `ex-${id}.mp3`;
export const voiceFileForFinisher = (id: string): string => `fin-${id}.mp3`;

// The complete manifest — what the generator renders and the guard verifies.
export const VOICE_LINES: VoiceLine[] = [
  ...EXERCISES.map((e) => ({ file: voiceFileForExercise(e.id), text: exerciseLine(e.name, e.cue) })),
  ...WARMUP.map((w) => ({ file: voiceFileForExercise(w.id), text: exerciseLine(w.name, w.cue) })),
  ...FINISHERS.map((f) => ({ file: voiceFileForFinisher(f.id), text: `${f.name}. ${f.tagline}` })),
  ...ENCOURAGEMENTS,
  ...WRAPUPS,
  ...Object.values(PACING),
];

// ── Preference ───────────────────────────────────────────────────────────────

const PREF_KEY = 'idaraya-session-voice';

export function voiceEnabled(): boolean {
  if (typeof localStorage === 'undefined') return false;
  return localStorage.getItem(PREF_KEY) !== '0'; // the coach speaks unless silenced
}

export function setVoiceEnabled(on: boolean): void {
  localStorage.setItem(PREF_KEY, on ? '1' : '0');
}

// ── Playback ─────────────────────────────────────────────────────────────────
// One element: a new line replaces whatever was being said (the screen moved on,
// the voice should too). Music ducks for the length of the clip.

let el: HTMLAudioElement | null = null;
let pending: ReturnType<typeof setTimeout> | null = null;

export function speak(file: string, delayMs = 400): void {
  if (typeof window === 'undefined' || !voiceEnabled()) return;
  if (pending) clearTimeout(pending);
  // The short delay keeps the voice from landing on top of the step-entry cue.
  pending = setTimeout(() => {
    pending = null;
    if (!el) {
      el = new Audio();
      el.preload = 'auto';
      el.volume = 0.95;
      el.addEventListener('loadedmetadata', () => {
        if (el && Number.isFinite(el.duration)) duckMusic(el.duration * 1000 + 400);
      });
    }
    el.src = `/voice/${file}`;
    void el.play().catch(() => {});
  }, delayMs);
}

export function stopSpeaking(): void {
  if (pending) clearTimeout(pending);
  pending = null;
  el?.pause();
}

export function speakRandom(lines: VoiceLine[]): void {
  speak(lines[Math.floor(Math.random() * lines.length)].file);
}
