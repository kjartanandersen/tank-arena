import { describe, expect, it } from 'vitest';
import { encodeAim, Move } from './command.ts';
import { TILE_SIZE, parseLevel } from './level.ts';
import { TANK_RADIUS, TANK_SPEED, TANK_TURN_RATE, updateTank, type Tank } from './tank.ts';

// A 7x5 room. The spawn is the centre of tile (3, 2): x = 168, y = 120.
const { arena } = parseLevel({
  name: 'room',
  rows: ['#######', '#.....#', '#..P..#', '#.....#', '#######'],
});

const spawnTank = (heading = 0): Tank => ({
  id: 0,
  x: 168,
  y: 120,
  heading,
  turret: 0,
  cooldown: 0,
});
const drive = (tank: Tank, move: number, ticks: number) => {
  for (let i = 0; i < ticks; i++) updateTank(tank, { move, aim: 0, fire: false }, arena);
};

describe('tank movement', () => {
  it('drives along its heading', () => {
    const tank = spawnTank();
    drive(tank, Move.Right, 1);
    expect(tank.x).toBe(168 + TANK_SPEED);
    expect(tank.y).toBe(120);
  });

  it('turns on the spot before driving', () => {
    const tank = spawnTank();
    drive(tank, Move.Up, 1);
    expect(tank.heading).toBeCloseTo(-TANK_TURN_RATE, 12);
    expect({ x: tank.x, y: tank.y }).toEqual({ x: 168, y: 120 });
  });

  it('reverses instead of turning around', () => {
    const tank = spawnTank();
    drive(tank, Move.Left, 1);
    expect(tank.heading).toBe(0);
    expect(tank.x).toBe(168 - TANK_SPEED);
  });

  it('stops at walls, touching them', () => {
    const tank = spawnTank();
    drive(tank, Move.Right, 200);
    expect(tank.x).toBeCloseTo(6 * TILE_SIZE - TANK_RADIUS, 9);
  });

  it('slides along walls into a corner', () => {
    const tank = spawnTank();
    drive(tank, Move.Up | Move.Right, 300);
    expect(tank.x).toBeCloseTo(6 * TILE_SIZE - TANK_RADIUS, 6);
    expect(tank.y).toBeCloseTo(TILE_SIZE + TANK_RADIUS, 6);
  });

  it('points the turret wherever the command aims', () => {
    const tank = spawnTank();
    updateTank(tank, { move: 0, aim: encodeAim(2), fire: false }, arena);
    expect(tank.turret).toBeCloseTo(2, 4);
  });
});
