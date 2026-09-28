import { describe, expect, it } from 'vitest';
import { createMatch, Move } from './index.ts';

const inputs = Array.from({ length: 600 }, (_, i) => ({
  move: i % 120 < 60 ? Move.Right : Move.Down,
}));

describe('match', () => {
  it('replays identically from the same inputs', () => {
    const a = createMatch();
    const b = createMatch();
    for (const cmd of inputs) {
      a.step(cmd);
      b.step(cmd);
    }
    expect(JSON.stringify(a.world)).toBe(JSON.stringify(b.world));
    expect(a.world.tick).toBe(600);
  });
});
