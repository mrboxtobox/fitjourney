// Asset guard.
//
// ExerciseCard derives every image path as `/exercises/<id>.webp`. Nothing checks at
// runtime that the file is there — a new exercise simply renders a broken image. This
// suite is that check, and it runs on a clean checkout with no browser.

import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { EXERCISES, EXERCISE_MUSCLES, WARMUP, MOTION_FRAMES, MOTION_VIDEOS } from './exercises';
import { FINISHERS } from './workouts';
import { MUSIC_TRACKS } from '../lib/music';
import { VOICE_LINES } from '../lib/voice';

const ROOT = process.cwd();
const PUBLIC = join(ROOT, 'public', 'exercises');

const formImage = (id: string) => join(PUBLIC, `${id}.webp`);
const muscleImage = (id: string) => join(PUBLIC, 'muscles', `${id}.webp`);

describe('every illustration referenced by the app exists on disk', () => {
  it('has a form illustration for every exercise', () => {
    const missing = EXERCISES.filter((e) => !existsSync(formImage(e.id))).map((e) => e.id);
    expect(missing).toEqual([]);
  });

  it('has a form illustration for every warm-up movement', () => {
    const missing = WARMUP.filter((w) => !existsSync(formImage(w.id))).map((w) => w.id);
    expect(missing).toEqual([]);
  });

  it('has a circuit diagram for every finisher', () => {
    const missing = FINISHERS.filter((f) => !existsSync(formImage(f.id))).map((f) => f.id);
    expect(missing).toEqual([]);
  });

  it('has a muscle map for every exercise that declares one', () => {
    const missing = Object.keys(EXERCISE_MUSCLES).filter((id) => !existsSync(muscleImage(id)));
    expect(missing).toEqual([]);
  });

  it('has both animation frames for every exercise that declares motion', () => {
    // The UI renders <id>-a.webp and <id>-b.webp for these; a missing frame is a
    // permanently broken image inside the sheet and the guided session.
    const missing = [...MOTION_FRAMES].flatMap((id) =>
      ['a', 'b'].filter((f) => !existsSync(formImage(`${id}-${f}`))).map((f) => `${id}-${f}`)
    );
    expect(missing).toEqual([]);
  });

  it('declares motion only for exercises that exist', () => {
    const ids = new Set(EXERCISES.map((e) => e.id));
    expect([...MOTION_FRAMES].filter((id) => !ids.has(id))).toEqual([]);
  });

  it('has an animation clip for every exercise that declares one', () => {
    // ExerciseImage renders /motion/<id>.mp4 for these; a missing clip is a
    // grey rectangle exactly where the movement demo should be.
    const missing = [...MOTION_VIDEOS].filter(
      (id) => !existsSync(join(ROOT, 'public', 'motion', `${id}.mp4`))
    );
    expect(missing).toEqual([]);
  });

  it('has a video recipe for every declared animation clip', () => {
    const videoScript = readFileSync(join(ROOT, 'scripts', 'generate-motion-videos.ts'), 'utf8');
    const specced = new Set([...videoScript.matchAll(/\{ id: '([\w-]+)'/g)].map((m) => m[1]));
    expect([...MOTION_VIDEOS].filter((id) => !specced.has(id))).toEqual([]);
  });
});

describe('session music ships what the player lists — and nothing else', () => {
  const MUSIC_DIR = join(ROOT, 'public', 'music');

  it('has a file for every track in the playlist', () => {
    const missing = MUSIC_TRACKS.filter((t) => !existsSync(join(MUSIC_DIR, t.file)));
    expect(missing.map((t) => t.file)).toEqual([]);
  });

  it('bundles no orphan tracks the player can never reach', () => {
    const declared = new Set(MUSIC_TRACKS.map((t) => t.file));
    const orphans = readdirSync(MUSIC_DIR).filter(
      (f) => f.endsWith('.mp3') && !declared.has(f)
    );
    expect(orphans).toEqual([]);
  });

  it('has a rendered clip for every line the coach can say', () => {
    // speak() derives paths from VOICE_LINES; a missing clip is a silent coach
    // exactly when the screen says she should be talking.
    const VOICE_DIR = join(ROOT, 'public', 'voice');
    const missing = VOICE_LINES.filter((l) => !existsSync(join(VOICE_DIR, l.file)));
    expect(missing.map((l) => l.file)).toEqual([]);
  });

  it('bundles no orphan voice clips', () => {
    const VOICE_DIR = join(ROOT, 'public', 'voice');
    const declared = new Set(VOICE_LINES.map((l) => l.file));
    const orphans = readdirSync(VOICE_DIR).filter(
      (f) => f.endsWith('.mp3') && !declared.has(f)
    );
    expect(orphans).toEqual([]);
  });

  it('carries the CC BY attribution the license requires', () => {
    // The music is CC BY 4.0, not CC0: shipping it without attribution is a
    // license violation, not a style choice.
    const credits = readFileSync(join(MUSIC_DIR, 'CREDITS.txt'), 'utf8');
    expect(credits).toContain('Kevin MacLeod');
    expect(credits).toContain('creativecommons.org/licenses/by/4.0');
    const settings = readFileSync(join(ROOT, 'src', 'views', 'SettingsView.tsx'), 'utf8');
    expect(settings).toContain('Kevin MacLeod');
  });
});

describe('muscle focus data covers the library', () => {
  it('declares a muscle focus for every exercise', () => {
    const missing = EXERCISES.filter((e) => !(e.id in EXERCISE_MUSCLES)).map((e) => e.id);
    expect(missing).toEqual([]);
  });

  it('declares no muscle focus for an exercise that no longer exists', () => {
    const ids = new Set(EXERCISES.map((e) => e.id));
    const orphans = Object.keys(EXERCISE_MUSCLES).filter((id) => !ids.has(id));
    expect(orphans).toEqual([]);
  });
});

// The image files above are the *output*. These check the *recipes* that produce them.
// A movement whose file exists but whose generator spec does not would be skipped by every
// future regeneration — its diagram frozen forever, silently, while every other image
// improved around it.
describe('the generators can actually reproduce every image they ship', () => {
  const formScript = readFileSync(join(ROOT, 'scripts', 'generate-exercise-images.ts'), 'utf8');
  const muscleScript = readFileSync(join(ROOT, 'scripts', 'generate-muscle-maps.ts'), 'utf8');
  const motionScript = readFileSync(join(ROOT, 'scripts', 'generate-motion-frames.ts'), 'utf8');

  const specIds = (source: string) =>
    new Set([...source.matchAll(/^\s*(?:\{\s*)?id: '([\w-]+)'/gm)].map((m) => m[1]));

  it('has a form-illustration recipe for every exercise', () => {
    const specced = specIds(formScript);
    const missing = EXERCISES.filter((e) => !specced.has(e.id)).map((e) => e.id);
    expect(missing).toEqual([]);
  });

  it('has a form-illustration recipe for every warm-up movement and finisher', () => {
    const specced = specIds(formScript);
    const missing = [...WARMUP.map((w) => w.id), ...FINISHERS.map((f) => f.id)].filter(
      (id) => !specced.has(id)
    );
    expect(missing).toEqual([]);
  });

  it('has a muscle-map recipe for every exercise that declares a muscle focus', () => {
    const specced = specIds(muscleScript);
    const missing = Object.keys(EXERCISE_MUSCLES).filter((id) => !specced.has(id));
    expect(missing).toEqual([]);
  });

  it('has a motion-frame recipe for every exercise that declares motion', () => {
    const specced = specIds(motionScript);
    const missing = [...MOTION_FRAMES].filter((id) => !specced.has(id));
    expect(missing).toEqual([]);
  });

  it('keeps the no-border rule in BOTH style guides', () => {
    // The muscle-map guide was missing this rule while all 32 maps were generated. They
    // came out clean by luck. It is not left to luck again.
    for (const [name, source] of [
      ['generate-exercise-images.ts', formScript],
      ['generate-muscle-maps.ts', muscleScript],
    ] as const) {
      expect(source, name).toMatch(/Do NOT draw any border, frame, outline box, or\s*\n?\s*rectangle/);
    }
  });

  it('keeps the anatomical-accuracy block in the form style guide', () => {
    expect(formScript).toContain('ANATOMICAL ACCURACY');
    expect(formScript).toMatch(/knees and elbows are hinges/i);
  });
});
