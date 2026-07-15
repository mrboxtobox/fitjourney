// Session ambience — a bundled playlist that plays under the guided session.
//
// All tracks are Kevin MacLeod (incompetech.com), licensed Creative Commons
// BY 4.0 — free to bundle with attribution, which lives in Settings and in
// public/music/CREDITS.txt. Files are loudness-normalized to -16 LUFS at encode
// time (scripts note in CREDITS), so no per-track gain riding is needed here.
//
// The player is one HTMLAudioElement walking a shuffled queue: no Web Audio graph,
// so the OS treats it as media (hardware volume, interruptions behave normally).
// Cues duck it briefly via duckMusic() so they always sit on top.

export interface MusicTrack {
  file: string; // under /music/
  title: string;
  artist: string;
}

export const MUSIC_ARTIST = 'Kevin MacLeod (incompetech.com)';
export const MUSIC_LICENSE = 'CC BY 4.0';

export const MUSIC_TRACKS: MusicTrack[] = [
  { file: 'exit-the-premises.mp3', title: 'Exit the Premises', artist: MUSIC_ARTIST },
  { file: 'raving-energy.mp3', title: 'Raving Energy', artist: MUSIC_ARTIST },
  { file: 'pamgaea.mp3', title: 'Pamgaea', artist: MUSIC_ARTIST },
  { file: 'cut-and-run.mp3', title: 'Cut and Run', artist: MUSIC_ARTIST },
  { file: 'electrodoodle.mp3', title: 'Electrodoodle', artist: MUSIC_ARTIST },
  { file: 'deuces.mp3', title: 'Deuces', artist: MUSIC_ARTIST },
];

const PREF_KEY = 'idaraya-session-music';
const BASE_VOLUME = 0.3; // background, never foreground
const DUCK_FACTOR = 0.35;

let audio: HTMLAudioElement | null = null;
let queue: MusicTrack[] = [];
let queueIdx = 0;
let playing = false;
let duckTimer: ReturnType<typeof setTimeout> | null = null;
let fadeTimer: ReturnType<typeof setInterval> | null = null;

export function musicEnabled(): boolean {
  if (typeof localStorage === 'undefined') return false;
  return localStorage.getItem(PREF_KEY) !== '0'; // ambience is on unless turned off
}

export function setMusicEnabled(on: boolean): void {
  localStorage.setItem(PREF_KEY, on ? '1' : '0');
}

function shuffled<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function clearFade(): void {
  if (fadeTimer) {
    clearInterval(fadeTimer);
    fadeTimer = null;
  }
}

function fadeTo(target: number, ms: number, then?: () => void): void {
  if (!audio) return;
  clearFade();
  const el = audio;
  const step = (target - el.volume) / Math.max(1, ms / 50);
  fadeTimer = setInterval(() => {
    const next = el.volume + step;
    const arrived = step >= 0 ? next >= target : next <= target;
    el.volume = arrived ? target : next;
    if (arrived) {
      clearFade();
      then?.();
    }
  }, 50);
}

function playNext(): void {
  if (!audio || !playing) return;
  queueIdx = (queueIdx + 1) % queue.length;
  if (queueIdx === 0) queue = shuffled(MUSIC_TRACKS); // reshuffle each full pass
  audio.src = `/music/${queue[queueIdx].file}`;
  void audio.play().catch(() => {});
}

// Begin (or resume) the playlist. Safe to call repeatedly.
export function startMusic(): void {
  if (typeof window === 'undefined') return;
  if (!audio) {
    audio = new Audio();
    audio.preload = 'auto';
    audio.addEventListener('ended', playNext);
  }
  if (playing) return;
  playing = true;
  queue = shuffled(MUSIC_TRACKS);
  queueIdx = 0;
  audio.src = `/music/${queue[0].file}`;
  audio.volume = 0;
  void audio.play().catch(() => {
    // Autoplay refused (no gesture yet) — the next explicit toggle will retry.
    playing = false;
  });
  fadeTo(BASE_VOLUME, 900);
}

export function stopMusic(): void {
  if (!audio || !playing) return;
  playing = false;
  fadeTo(0, 500, () => {
    audio?.pause();
  });
}

export function musicPlaying(): boolean {
  return playing;
}

export function currentTrack(): MusicTrack | null {
  return playing ? (queue[queueIdx] ?? null) : null;
}

// ── Live-follow mirroring ────────────────────────────────────────────────────
// Both phones bundle the same files, so pairing on music is just telling the
// viewer which file is playing and how far in. The host reports status inside
// its live broadcast; the viewer mirrors with a second, independent element.

export interface MusicStatus {
  file: string;
  title: string;
  position: number; // seconds into the track
}

export function musicStatus(): MusicStatus | null {
  if (!playing || !audio) return null;
  const track = queue[queueIdx];
  if (!track) return null;
  return { file: track.file, title: track.title, position: audio.currentTime };
}

let followAudio: HTMLAudioElement | null = null;
let followFile: string | null = null;

// Mirror the host's music. Re-seeks only when drifted past a couple of seconds,
// so the common case is free-running local playback. `onBlocked` fires when the
// browser refuses playback (no user gesture yet) — the caller should flip its
// toggle off and wait for a tap.
export function syncMusic(status: MusicStatus | null, onBlocked?: () => void): void {
  if (!status) {
    stopFollowMusic();
    return;
  }
  if (!followAudio) {
    followAudio = new Audio();
    followAudio.preload = 'auto';
    followAudio.volume = BASE_VOLUME;
  }
  if (followFile !== status.file) {
    followFile = status.file;
    followAudio.src = `/music/${status.file}`;
    followAudio.currentTime = status.position;
    followAudio.play().catch(() => {
      followFile = null;
      onBlocked?.();
    });
  } else if (Math.abs(followAudio.currentTime - status.position) > 3) {
    followAudio.currentTime = status.position;
  }
}

export function stopFollowMusic(): void {
  followAudio?.pause();
  followFile = null;
}

// Dip under a cue, then recover. Cues call this so they always read clearly.
export function duckMusic(ms = 700): void {
  if (!audio || !playing) return;
  if (duckTimer) clearTimeout(duckTimer);
  clearFade();
  audio.volume = BASE_VOLUME * DUCK_FACTOR;
  duckTimer = setTimeout(() => {
    duckTimer = null;
    if (playing) fadeTo(BASE_VOLUME, 400);
  }, ms);
}
