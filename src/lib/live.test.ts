// Live follow guard — the viewer renders whatever liveStateForStep produces, so a
// step kind that maps to an empty payload shows a partner a blank screen. Build a
// real day's steps and prove every one of them is renderable.

import { describe, it, expect } from 'vitest';
import { getWorkoutForDate, buildSessionSteps, EMPTY_SNAPSHOT } from '../data/workouts';
import { liveStateForStep, makeShareCode } from './live';

const START = new Date('2026-01-05T00:00:00'); // a Monday

describe('live follow', () => {
  const workout = getWorkoutForDate(START, START, EMPTY_SNAPSHOT);
  const steps = buildSessionSteps(workout);

  it('maps every step of a real session to a renderable payload', () => {
    expect(steps.length).toBeGreaterThan(10);
    for (const step of steps) {
      const s = liveStateForStep(step, 'label', 'kg');
      expect(s.name, `blank name for step kind ${step.kind}`).toBeTruthy();
      expect(s.phase).toBe('label');
    }
  });

  it('work steps carry the illustration, the set count and the target', () => {
    const work = steps.filter((s) => s.kind === 'work');
    expect(work.length).toBeGreaterThan(0);
    for (const step of work) {
      const s = liveStateForStep(step, 'label', 'kg');
      expect(s.imageId).toBeTruthy();
      expect(s.detail).toMatch(/Set \d+ of \d+/);
    }
  });

  it('a loaded work step states its load in the viewer detail', () => {
    const step = steps.find((s) => s.kind === 'work')!;
    const loaded = { ...step, load: 12 } as typeof step & { load: number };
    expect(liveStateForStep(loaded, 'label', 'kg').detail).toContain('12 kg');
    expect(liveStateForStep(loaded, 'label', 'lbs').detail).toContain('12 lbs');
  });

  it('share codes use only unambiguous characters', () => {
    for (let i = 0; i < 50; i++) {
      const code = makeShareCode();
      expect(code).toMatch(/^[A-HJ-KM-NP-Z2-9]{6}$/);
      expect(code).not.toMatch(/[01OIL]/);
    }
  });
});
