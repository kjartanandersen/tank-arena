import { detMath } from '@arena/core';
import { TILE_SIZE, Tile, tileAt, type Arena } from './level.ts';

/** Pixels per tick (300 px/s at 60 Hz). */
export const BULLET_SPEED = 5;
/** Used for bullet-vs-bullet hits. Walls treat bullets as points. */
export const BULLET_RADIUS = 4;
/** Wall hits a bullet survives. The next hit destroys it. */
export const BULLET_BOUNCES = 1;

export interface Bullet {
  readonly id: number;
  /** Id of the tank that fired it. */
  readonly owner: number;
  x: number;
  y: number;
  /** Unit vector of travel. */
  dirX: number;
  dirY: number;
  /** Wall hits it can still survive. */
  bouncesLeft: number;
}

export function createBullet(
  id: number,
  owner: number,
  x: number,
  y: number,
  angle: number,
): Bullet {
  return {
    id,
    owner,
    x,
    y,
    dirX: detMath.cos(angle),
    dirY: detMath.sin(angle),
    bouncesLeft: BULLET_BOUNCES,
  };
}

/**
 * Moves a bullet `distance` px through the tile grid, reflecting off walls. Returns false if it hit
 * a wall with no bounces left.
 *
 * The bullet steps from grid line to grid line (a DDA ray traversal, after Amanatides & Woo), so it
 * checks every tile it passes through and can't tunnel through a wall, however far it moves at once.
 * At each crossing it knows exactly which face it hit, so it reflects the right component.
 */
export function advanceBullet(bullet: Bullet, distance: number, arena: Arena): boolean {
  let remaining = distance;
  let col = Math.floor(bullet.x / TILE_SIZE);
  let row = Math.floor(bullet.y / TILE_SIZE);

  // Each pass reaches the next grid line; the guard only matters if something is badly wrong.
  for (let guard = 0; remaining > 0 && guard < 64; guard++) {
    const stepX = bullet.dirX > 0 ? 1 : -1;
    const stepY = bullet.dirY > 0 ? 1 : -1;
    const lineX = (bullet.dirX > 0 ? col + 1 : col) * TILE_SIZE;
    const lineY = (bullet.dirY > 0 ? row + 1 : row) * TILE_SIZE;
    const toLineX = bullet.dirX === 0 ? Infinity : (lineX - bullet.x) / bullet.dirX;
    const toLineY = bullet.dirY === 0 ? Infinity : (lineY - bullet.y) / bullet.dirY;
    const t = Math.min(toLineX, toLineY);

    if (t >= remaining) {
      bullet.x += bullet.dirX * remaining;
      bullet.y += bullet.dirY * remaining;
      return true;
    }

    // Move onto the grid line(s), snapping exactly so rounding errors can't build up.
    const crossX = toLineX === t;
    const crossY = toLineY === t;
    bullet.x = crossX ? lineX : bullet.x + bullet.dirX * t;
    bullet.y = crossY ? lineY : bullet.y + bullet.dirY * t;
    remaining -= t;

    const wallX = crossX && isWall(arena, col + stepX, row);
    const wallY = crossY && isWall(arena, col, row + stepY);
    // Through a tile corner with both side tiles open: only the diagonal tile can block.
    const wallCorner =
      crossX && crossY && !wallX && !wallY && isWall(arena, col + stepX, row + stepY);

    if (wallX || wallY || wallCorner) {
      if (bullet.bouncesLeft === 0) return false;
      bullet.bouncesLeft -= 1;
      if (wallX || wallCorner) bullet.dirX = -bullet.dirX;
      if (wallY || wallCorner) bullet.dirY = -bullet.dirY;
    }
    if (crossX && !wallX && !wallCorner) col += stepX;
    if (crossY && !wallY && !wallCorner) row += stepY;
  }
  return true;
}

export function bulletsTouch(a: Bullet, b: Bullet): boolean {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const reach = 2 * BULLET_RADIUS;
  return dx * dx + dy * dy < reach * reach;
}

function isWall(arena: Arena, col: number, row: number): boolean {
  return tileAt(arena, col, row) === Tile.Wall;
}
