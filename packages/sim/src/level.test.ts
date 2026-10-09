import { describe, expect, it } from 'vitest';
import { TILE_SIZE, Tile, parseLevel, tileAt } from './level.ts';

const level = { name: 'test', rows: ['####', '#P.#', '####'] };

describe('parseLevel', () => {
  it('reads tiles row by row and finds the spawn', () => {
    const { arena, playerSpawn } = parseLevel(level);
    expect(arena.cols).toBe(4);
    expect(arena.rows).toBe(3);
    expect(tileAt(arena, 0, 0)).toBe(Tile.Wall);
    expect(tileAt(arena, 2, 1)).toBe(Tile.Floor);
    expect(playerSpawn).toEqual({ x: 1.5 * TILE_SIZE, y: 1.5 * TILE_SIZE });
  });

  it('treats everything outside the arena as wall', () => {
    const { arena } = parseLevel(level);
    expect(tileAt(arena, -1, 1)).toBe(Tile.Wall);
    expect(tileAt(arena, 4, 1)).toBe(Tile.Wall);
  });

  it('rejects malformed levels with a useful message', () => {
    expect(() => parseLevel({ name: 'ragged', rows: ['###', '#P'] })).toThrow(
      /row 1 has 2 columns/,
    );
    expect(() => parseLevel({ name: 'odd', rows: ['#P?'] })).toThrow(/unknown tile '\?'/);
    expect(() => parseLevel({ name: 'empty', rows: [] })).toThrow(/is empty/);
    expect(() => parseLevel({ name: 'nobody', rows: ['#.#'] })).toThrow(/no player spawn/);
  });
});
