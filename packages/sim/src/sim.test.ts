import { describe, expect, it } from 'vitest';
import { createWorld, Move, step } from './index.ts';

describe('step', () => {
  it('moves the tank and advances the tick', () => {
    const world = createWorld();
    const { x, y } = world.tank;
    step(world, { move: Move.Right | Move.Down });
    expect(world.tank).toEqual({ x: x + 3, y: y + 3 });
    expect(world.tick).toBe(1);
  });

  it('keeps the tank inside the arena', () => {
    const world = createWorld(100, 100);
    for (let i = 0; i < 100; i++) step(world, { move: Move.Left | Move.Up });
    expect(world.tank).toEqual({ x: 0, y: 0 });
  });
});
