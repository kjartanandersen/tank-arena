import { describe, expect, it } from 'vitest';
import { createBullet } from './bullet.ts';
import { Move, type TankCommand } from './command.ts';
import { FIRE_COOLDOWN, MAX_BULLETS_PER_TANK } from './tank.ts';
import { PLAYER_ID, createWorld, hashWorld, step } from './world.ts';

const level = { name: 'room', rows: ['#####', '#.P.#', '#####'] };
// A 7x5 room with the spawn at (168, 120).
const room = { name: 'room', rows: ['#######', '#.....#', '#..P..#', '#.....#', '#######'] };

const idle: TankCommand = { move: 0, aim: 0, fire: false };
const shoot: TankCommand = { move: 0, aim: 0, fire: true }; // aim 0 = straight right

describe('world', () => {
  it('starts with the player tank at the spawn', () => {
    const world = createWorld(level, 1);
    expect(world.tick).toBe(0);
    expect(world.tanks).toEqual([
      { id: PLAYER_ID, x: 120, y: 72, heading: 0, turret: 0, cooldown: 0 },
    ]);
    expect(world.bullets).toEqual([]);
  });

  it('advances one tick per step and ignores missing commands', () => {
    const world = createWorld(level, 1);
    step(world, []);
    step(world, [{ ...idle, move: Move.Right }]);
    expect(world.tick).toBe(2);
  });

  it('hashes equal states equally and different states differently', () => {
    const a = createWorld(level, 1);
    const b = createWorld(level, 1);
    expect(hashWorld(a)).toBe(hashWorld(b));

    step(a, [{ ...idle, move: Move.Right }]);
    expect(hashWorld(a)).not.toBe(hashWorld(b));

    expect(hashWorld(createWorld(level, 2))).not.toBe(hashWorld(b)); // the seed is part of the state
  });
});

describe('firing', () => {
  it('fires from the muzzle in the turret direction', () => {
    const world = createWorld(room, 1);
    step(world, [shoot]);
    expect(world.bullets).toHaveLength(1);
    const [bullet] = world.bullets;
    expect(bullet?.owner).toBe(PLAYER_ID);
    // Centre 168 + muzzle 26 + one tick of flight (5 px).
    expect({ x: bullet?.x, y: bullet?.y }).toEqual({ x: 199, y: 120 });
  });

  it('waits for the cooldown between shots', () => {
    const world = createWorld(room, 1);
    for (let i = 0; i < FIRE_COOLDOWN; i++) step(world, [shoot]);
    expect(world.nextBulletId).toBe(1);
    step(world, [shoot]);
    expect(world.nextBulletId).toBe(2);
  });

  it('refuses to fire while the tank has too many bullets in flight', () => {
    const world = createWorld(room, 1);
    // Five of the player's bullets flying side by side, well apart.
    world.bullets = Array.from({ length: MAX_BULLETS_PER_TANK }, (_, i) =>
      createBullet(100 + i, PLAYER_ID, 72, 60 + i * 20, 0),
    );
    step(world, [shoot]);
    expect(world.nextBulletId).toBe(0);

    world.bullets.pop();
    step(world, [shoot]);
    expect(world.nextBulletId).toBe(1);
  });

  it('destroys bullets that touch each other', () => {
    const world = createWorld(room, 1);
    world.bullets = [
      createBullet(100, PLAYER_ID, 100, 72, 0), // flying right
      createBullet(101, PLAYER_ID, 141, 72, Math.PI), // flying left, 41 px away
    ];
    for (let i = 0; i < 5; i++) step(world, [idle]);
    expect(world.bullets).toEqual([]);
  });

  it('includes bullets in the hash', () => {
    const a = createWorld(room, 1);
    const b = createWorld(room, 1);
    step(a, [shoot]);
    step(b, [idle]);
    expect(hashWorld(a)).not.toBe(hashWorld(b));
  });
});
