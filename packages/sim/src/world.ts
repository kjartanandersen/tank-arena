import { FNV_OFFSET, forkRng, hashByte, hashNumber, type Rng } from '@arena/core';
import { BULLET_SPEED, advanceBullet, bulletsTouch, createBullet, type Bullet } from './bullet.ts';
import type { TankCommand } from './command.ts';
import { parseLevel, type Arena, type LevelData } from './level.ts';
import {
  FIRE_COOLDOWN,
  MAX_BULLETS_PER_TANK,
  MUZZLE_DISTANCE,
  updateTank,
  type Tank,
} from './tank.ts';

/** Bump whenever simulation behaviour changes: recorded replays and scores are only valid for one version. */
export const SIM_VERSION = 3;
export const TICK_RATE = 60;
export const PLAYER_ID = 0;

/**
 * Bullets move in this many substeps per tick. Two bullets flying straight at each other close
 * 2 * BULLET_SPEED / BULLET_SUBSTEPS = 5 px per substep, less than the 8 px at which they touch,
 * so they can't pass through each other between checks.
 */
const BULLET_SUBSTEPS = 2;

/** The whole simulation state. Plain data only, so it can be cloned, hashed and compared. */
export interface World {
  tick: number;
  readonly arena: Arena;
  readonly tanks: Tank[];
  /** Flying bullets, oldest first. Replaced with a new array as bullets are destroyed. */
  bullets: Bullet[];
  /** Id for the next bullet fired. Ids are never reused, so the renderer can track bullets. */
  nextBulletId: number;
  /** Seeded randomness for the simulation (AI inaccuracy, from M2). */
  readonly rng: Rng;
}

export function createWorld(level: LevelData, seed: number): World {
  const { arena, playerSpawn } = parseLevel(level);
  return {
    tick: 0,
    arena,
    tanks: [
      { id: PLAYER_ID, x: playerSpawn.x, y: playerSpawn.y, heading: 0, turret: 0, cooldown: 0 },
    ],
    bullets: [],
    nextBulletId: 0,
    rng: forkRng(seed, 'sim'),
  };
}

/** Advances the world by exactly one tick. `commands[id]` drives the tank with that id. */
export function step(world: World, commands: readonly TankCommand[]): void {
  for (const tank of world.tanks) {
    const command = commands[tank.id];
    if (command) updateTank(tank, command, world.arena);
    if (tank.cooldown > 0) tank.cooldown -= 1;
    if (command?.fire) fire(world, tank);
  }
  moveBullets(world);
  world.tick += 1;
}

function fire(world: World, tank: Tank): void {
  if (tank.cooldown > 0) return;
  let flying = 0;
  for (const bullet of world.bullets) if (bullet.owner === tank.id) flying += 1;
  if (flying >= MAX_BULLETS_PER_TANK) return;

  tank.cooldown = FIRE_COOLDOWN;
  const bullet = createBullet(world.nextBulletId, tank.id, tank.x, tank.y, tank.turret);
  world.nextBulletId += 1;
  // Start at the tank's centre and sweep out to the muzzle, so a shot fired with the barrel against
  // a wall ricochets off it instead of appearing inside it.
  if (advanceBullet(bullet, MUZZLE_DISTANCE, world.arena)) world.bullets.push(bullet);
}

function moveBullets(world: World): void {
  for (let substep = 0; substep < BULLET_SUBSTEPS; substep++) {
    const survivors: Bullet[] = [];
    for (const bullet of world.bullets) {
      if (advanceBullet(bullet, BULLET_SPEED / BULLET_SUBSTEPS, world.arena))
        survivors.push(bullet);
    }
    world.bullets = removeTouchingBullets(survivors);
  }
}

/** Bullets that touch destroy each other, whoever fired them. */
function removeTouchingBullets(bullets: Bullet[]): Bullet[] {
  const destroyed = new Set<number>();
  for (let i = 0; i < bullets.length; i++) {
    for (let j = i + 1; j < bullets.length; j++) {
      const a = bullets[i];
      const b = bullets[j];
      if (a && b && bulletsTouch(a, b)) {
        destroyed.add(a.id);
        destroyed.add(b.id);
      }
    }
  }
  return destroyed.size === 0 ? bullets : bullets.filter((bullet) => !destroyed.has(bullet.id));
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
    h = hashNumber(h, tank.cooldown);
  }
  for (const bullet of world.bullets) {
    h = hashNumber(h, bullet.id);
    h = hashNumber(h, bullet.owner);
    h = hashNumber(h, bullet.x);
    h = hashNumber(h, bullet.y);
    h = hashNumber(h, bullet.dirX);
    h = hashNumber(h, bullet.dirY);
    h = hashNumber(h, bullet.bouncesLeft);
  }
  h = hashNumber(h, world.nextBulletId);
  h = hashNumber(h, world.rng.a);
  h = hashNumber(h, world.rng.b);
  h = hashNumber(h, world.rng.c);
  return hashNumber(h, world.rng.d);
}
