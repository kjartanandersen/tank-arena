import { PI, angleDelta, clamp, detMath, turnTowards, wrapAngle } from '@arena/core';
import { Move, decodeAim, type TankCommand } from './command.ts';
import { TILE_SIZE, Tile, tileAt, type Arena } from './level.ts';

/** Collision radius. Must stay above TANK_SPEED, or a tank could step into a wall in one tick. */
export const TANK_RADIUS = 18;
/** Pixels per tick (150 px/s at 60 Hz). */
export const TANK_SPEED = 2.5;
/** Radians per tick the body can turn (about 340 degrees per second). */
export const TANK_TURN_RATE = 0.1;
/** The tank only drives once its body is within this angle (about 20 degrees) of where it should face. */
export const DRIVE_ALIGNMENT = 0.35;
/** Ticks between shots (0.2 s). */
export const FIRE_COOLDOWN = 12;
/** A tank can't fire while this many of its bullets are still flying. */
export const MAX_BULLETS_PER_TANK = 5;
/** Distance from the tank's centre to the tip of the barrel, where bullets leave. */
export const MUZZLE_DISTANCE = 26;

export interface Tank {
  readonly id: number;
  x: number;
  y: number;
  /** Body direction in radians: 0 is +x, increasing clockwise on screen. */
  heading: number;
  /** Turret direction in radians, in world space (independent of the body). */
  turret: number;
  /** Ticks until the tank may fire again. 0 means ready. */
  cooldown: number;
}

export function updateTank(tank: Tank, cmd: TankCommand, arena: Arena): void {
  tank.turret = decodeAim(cmd.aim);

  const dx = (cmd.move & Move.Right ? 1 : 0) - (cmd.move & Move.Left ? 1 : 0);
  const dy = (cmd.move & Move.Down ? 1 : 0) - (cmd.move & Move.Up ? 1 : 0);
  if (dx === 0 && dy === 0) return;

  // Tanks drive equally well forwards and backwards, so turn whichever end is closer to the target.
  const wanted = detMath.atan2(dy, dx);
  const forwards = Math.abs(angleDelta(tank.heading, wanted)) <= PI / 2;
  const target = forwards ? wanted : wrapAngle(wanted + PI);
  tank.heading = turnTowards(tank.heading, target, TANK_TURN_RATE);

  // Turn on the spot first; only drive once roughly lined up, like a real tank.
  if (Math.abs(angleDelta(tank.heading, target)) > DRIVE_ALIGNMENT) return;
  const speed = forwards ? TANK_SPEED : -TANK_SPEED;
  tank.x += detMath.cos(tank.heading) * speed;
  tank.y += detMath.sin(tank.heading) * speed;
  pushOutOfWalls(tank, arena);
}

/**
 * Resolves overlap between the tank's circle and nearby wall tiles by pushing it out along the line
 * from the closest point on each tile. Pushing out only the overlapping part makes tanks slide along
 * walls instead of sticking to them.
 */
function pushOutOfWalls(tank: Tank, arena: Arena): void {
  const firstCol = Math.floor((tank.x - TANK_RADIUS) / TILE_SIZE);
  const lastCol = Math.floor((tank.x + TANK_RADIUS) / TILE_SIZE);
  const firstRow = Math.floor((tank.y - TANK_RADIUS) / TILE_SIZE);
  const lastRow = Math.floor((tank.y + TANK_RADIUS) / TILE_SIZE);

  for (let row = firstRow; row <= lastRow; row++) {
    for (let col = firstCol; col <= lastCol; col++) {
      if (tileAt(arena, col, row) !== Tile.Wall) continue;
      const left = col * TILE_SIZE;
      const top = row * TILE_SIZE;
      const offsetX = tank.x - clamp(tank.x, left, left + TILE_SIZE);
      const offsetY = tank.y - clamp(tank.y, top, top + TILE_SIZE);
      const distanceSq = offsetX * offsetX + offsetY * offsetY;
      // distanceSq is 0 only if the centre is inside a wall, which TANK_SPEED < TANK_RADIUS prevents.
      if (distanceSq >= TANK_RADIUS * TANK_RADIUS || distanceSq === 0) continue;
      const distance = Math.sqrt(distanceSq);
      const push = (TANK_RADIUS - distance) / distance;
      tank.x += offsetX * push;
      tank.y += offsetY * push;
    }
  }
}
