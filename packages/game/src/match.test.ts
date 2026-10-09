import { describe, expect, it } from 'vitest';
import { createMatch, encodeAim, Move, TRAINING_GROUND, type TankCommand } from './index.ts';

// Ten seconds of scripted input: drive around while sweeping the turret and firing.
const inputs: TankCommand[] = Array.from({ length: 600 }, (_, i) => ({
  move: [Move.Right, Move.Down, Move.Left | Move.Up, Move.Up][Math.floor(i / 150)] ?? 0,
  aim: encodeAim(i * 0.05),
  fire: i % 20 === 0,
}));

const play = (seed: number) => {
  const match = createMatch({ level: TRAINING_GROUND, seed });
  for (const command of inputs) match.step(command);
  return match;
};

describe('match', () => {
  it('loads the training ground', () => {
    const { world } = createMatch({ level: TRAINING_GROUND, seed: 1 });
    expect(world.arena.cols).toBe(24);
    expect(world.arena.rows).toBe(16);
  });

  it('replays bit-for-bit from the same seed and inputs', () => {
    const a = play(1);
    expect(a.world.tick).toBe(600);
    expect(a.world.nextBulletId).toBeGreaterThan(0); // the script really did fire
    expect(a.hash()).toBe(play(1).hash());
  });

  it('depends on the seed', () => {
    expect(play(1).hash()).not.toBe(play(2).hash());
  });
});
