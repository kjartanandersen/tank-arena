import { describe, expect, it } from 'vitest';
import { advanceBullet, createBullet, type Bullet } from './bullet.ts';
import { parseLevel } from './level.ts';

// A 7x5 room: the floor spans x 48-288 and y 48-192. (168, 120) is the centre of tile (3, 2).
const room = parseLevel({
  name: 'room',
  rows: ['#######', '#.....#', '#..P..#', '#.....#', '#######'],
}).arena;

// The same room with a one-tile pillar at (3, 2), whose top-left corner is the point (144, 96).
const pillar = parseLevel({
  name: 'pillar',
  rows: ['#######', '#P....#', '#..#..#', '#.....#', '#######'],
}).arena;

const diagonal = (x: number, y: number, dirX: number, dirY: number): Bullet => ({
  id: 0,
  owner: 0,
  x,
  y,
  dirX: dirX * Math.SQRT1_2,
  dirY: dirY * Math.SQRT1_2,
  bouncesLeft: 1,
});

describe('advanceBullet', () => {
  it('flies straight through open floor', () => {
    const bullet = createBullet(0, 0, 168, 120, 0);
    expect(advanceBullet(bullet, 10, room)).toBe(true);
    expect({ x: bullet.x, y: bullet.y }).toEqual({ x: 178, y: 120 });
  });

  it('reflects off a vertical wall, using up its bounce', () => {
    const bullet = createBullet(0, 0, 168, 120, 0);
    // 120 px to the right wall's face at x = 288, then 30 px back.
    expect(advanceBullet(bullet, 150, room)).toBe(true);
    expect(bullet.x).toBe(258);
    expect(bullet.dirX).toBe(-1);
    expect(bullet.bouncesLeft).toBe(0);
  });

  it('reflects off a horizontal wall', () => {
    const bullet = createBullet(0, 0, 168, 120, -Math.PI / 2); // straight up
    // 72 px to the top wall's face at y = 48, then 28 px back down.
    expect(advanceBullet(bullet, 100, room)).toBe(true);
    expect(bullet.y).toBe(76);
    expect(bullet.dirY).toBe(1);
  });

  it('is destroyed by its second wall hit', () => {
    const bullet = createBullet(0, 0, 168, 120, 0);
    // 120 px to the right wall, 240 px back to the left wall.
    expect(advanceBullet(bullet, 400, room)).toBe(false);
  });

  it('comes straight back out of an inside corner', () => {
    const bullet = diagonal(72, 72, -1, -1); // from tile (1, 1) into the top-left corner
    expect(advanceBullet(bullet, 40, room)).toBe(true);
    expect(bullet.dirX).toBeGreaterThan(0);
    expect(bullet.dirY).toBeGreaterThan(0);
    expect(bullet.bouncesLeft).toBe(0); // both directions flip, but it's one hit
  });

  it('bounces off the tip of an outside corner', () => {
    // From tile (2, 1) straight at the pillar's corner: both neighbouring tiles are open floor.
    const bullet = diagonal(120, 72, 1, 1);
    expect(advanceBullet(bullet, 40, pillar)).toBe(true);
    expect(bullet.dirX).toBeLessThan(0);
    expect(bullet.dirY).toBeLessThan(0);
  });

  it('never tunnels out of the arena, however far it moves at once', () => {
    const bullet = createBullet(0, 0, 168, 120, 0.3);
    expect(advanceBullet(bullet, 100_000, room)).toBe(false);
    expect(bullet.x >= 48 && bullet.x <= 288).toBe(true);
    expect(bullet.y >= 48 && bullet.y <= 192).toBe(true);
  });
});
