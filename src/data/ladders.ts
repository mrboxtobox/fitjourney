// Movement-pattern ladders — the logic. The rungs themselves, and the criteria for
// climbing them, are clinical judgements and live in src/clinical/parameters.ts.
//
// A ladder is an ordered chain of exercise variants for one movement pattern, easiest
// first. The progression engine holds a *level* per pattern, so a user's bridge can climb
// from a two-leg glute bridge to a loaded hip thrust over weeks while the day-of-week
// rotation keeps varying which patterns they see.

import { LADDER_RUNGS, type LadderRung, type MovementPattern } from '../clinical/parameters';

export type { MovementPattern, LadderRung } from '../clinical/parameters';

export interface Ladder {
  pattern: MovementPattern;
  levels: LadderRung[];
}

export const LADDERS: Record<Exclude<MovementPattern, 'mobility'>, Ladder> = Object.fromEntries(
  Object.entries(LADDER_RUNGS).map(([pattern, levels]) => [pattern, { pattern, levels }])
) as Record<Exclude<MovementPattern, 'mobility'>, Ladder>;

// Stretches are held, not progressed, so `mobility` has no ladder by construction.
export function getLadder(pattern: MovementPattern): Ladder | undefined {
  if (pattern === 'mobility') return undefined;
  return LADDERS[pattern];
}

// Clamp a stored level into the ladder's real bounds. A level that has drifted out of
// range — because a reviewer shortened a ladder in src/clinical/parameters.ts — resolves
// to the top rung rather than crashing or silently falling back to level 0.
export function levelExerciseId(pattern: MovementPattern, level: number): string | undefined {
  const ladder = getLadder(pattern);
  if (!ladder) return undefined;
  const idx = Math.min(Math.max(level, 0), ladder.levels.length - 1);
  return ladder.levels[idx].exerciseId;
}

export function ladderSize(pattern: MovementPattern): number {
  return getLadder(pattern)?.levels.length ?? 0;
}

export function isTopOfLadder(pattern: MovementPattern, level: number): boolean {
  const size = ladderSize(pattern);
  return size === 0 || level >= size - 1;
}
