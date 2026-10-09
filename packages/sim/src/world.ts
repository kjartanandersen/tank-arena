import { FNV_OFFSET, forkRng, hashByte, hashNumber, type Rng } from '@arena/core';
import type { TankCommand } from './command.ts';
import { parseLevel, type Arena, type LevelData } from './level.ts';
import { updateTank, type Tank } from './tank.ts';

/** Bump whenever simulation behaviour changes: recorded replays and scores are only valid for one version. */
export const SIM_VERSION = 2;
export const TICK_RATE = 60;
export const PLAYER_ID = 0;

/** The whole simulation state. Plain data only, so it can be cloned, hashed and compared. */
export interface World {
  tick: number;
  readonly arena: Arena;
  readonly tanks: Tank[];
  /** Seeded randomness for the simulation (bullet spread, from the next slice). */
  readonly rng: Rng;
}

export function createWorld(level: LevelData, seed: number): World {
  const { arena, playerSpawn } = parseLevel(level);
  return {
    tick: 0,
    arena,
    tanks: [{ id: PLAYER_ID, x: playerSpawn.x, y: playerSpawn.y, heading: 0, turret: 0 }],
    rng: forkRng(seed, 'sim'),
  };
}

/** Advances the world by exactly one tick. `commands[id]` drives the tank with that id. */
export function step(world: World, commands: readonly TankCommand[]): void {
  for (const tank of world.tanks) {
    const command = commands[tank.id];
    if (command) updateTank(tank, command, world.arena);
  }
  world.tick += 1;
}

/** A checksum of the entire state. Two worlds hash equal only if they are bit-for-bit identical. */
export function hashWorld(world: World): number {
  let h = hashNumber(FNV_OFFSET, world.tick);
  for (const tile of world.arena.tiles) h = hashByte(h, tile);
  for (const tank of world.tanks) {
    h = hashNumber(h, tank.id);
    h = hashNumber(h, tank.x);
    h = hashNumber(h, tank.y);
    h = hashNumber(h, tank.heading);
    h = hashNumber(h, tank.turret);
  }
  h = hashNumber(h, world.rng.a);
  h = hashNumber(h, world.rng.b);
  h = hashNumber(h, world.rng.c);
  return hashNumber(h, world.rng.d);
}
