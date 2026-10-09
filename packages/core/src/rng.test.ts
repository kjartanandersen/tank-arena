import { describe, expect, it } from 'vitest';
import { createRng, forkRng, nextFloat, nextInt, nextU32 } from './rng.ts';

// The first four outputs for seed 1. If this ever changes, every recorded replay breaks.
const GOLDEN_SEED_1 = [1130556604, 2591592147, 3014952990, 960850752];

const take = (seed: number, count: number) => {
  const rng = createRng(seed);
  return Array.from({ length: count }, () => nextU32(rng));
};

describe('rng', () => {
  it('produces the same sequence from the same seed', () => {
    expect(take(42, 8)).toEqual(take(42, 8));
  });

  it('gives unrelated sequences for neighbouring seeds', () => {
    expect(take(1, 4)).not.toEqual(take(2, 4));
  });

  it('keeps named streams independent', () => {
    expect(nextU32(forkRng(7, 'ai'))).not.toBe(nextU32(forkRng(7, 'spread')));
  });

  it('produces floats in [0, 1) and integers in [min, max)', () => {
    const rng = createRng(3);
    for (let i = 0; i < 1000; i++) {
      const f = nextFloat(rng);
      expect(f >= 0 && f < 1).toBe(true);
      const n = nextInt(rng, -2, 3);
      expect(Number.isInteger(n) && n >= -2 && n < 3).toBe(true);
    }
  });

  it('never changes its output (replays depend on it)', () => {
    expect(take(1, 4)).toEqual(GOLDEN_SEED_1);
  });
});
