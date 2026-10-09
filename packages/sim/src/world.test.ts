import { describe, expect, it } from 'vitest';
import { Move } from './command.ts';
import { PLAYER_ID, createWorld, hashWorld, step } from './world.ts';

const level = { name: 'room', rows: ['#####', '#.P.#', '#####'] };

describe('world', () => {
  it('starts with the player tank at the spawn', () => {
    const world = createWorld(level, 1);
    expect(world.tick).toBe(0);
    expect(world.tanks).toEqual([{ id: PLAYER_ID, x: 120, y: 72, heading: 0, turret: 0 }]);
  });

  it('advances one tick per step and ignores missing commands', () => {
    const world = createWorld(level, 1);
    step(world, []);
    step(world, [{ move: Move.Right, aim: 0 }]);
    expect(world.tick).toBe(2);
  });

  it('hashes equal states equally and different states differently', () => {
    const a = createWorld(level, 1);
    const b = createWorld(level, 1);
    expect(hashWorld(a)).toBe(hashWorld(b));

    step(a, [{ move: Move.Right, aim: 0 }]);
    expect(hashWorld(a)).not.toBe(hashWorld(b));

    expect(hashWorld(createWorld(level, 2))).not.toBe(hashWorld(b)); // the seed is part of the state
  });
});
