export const TILE_SIZE = 48;

export const Tile = { Floor: 0, Wall: 1 } as const;
export type Tile = (typeof Tile)[keyof typeof Tile];

/** A level as people write it: one string per row. `#` wall, `.` floor, `P` player spawn. */
export interface LevelData {
  readonly name: string;
  readonly rows: readonly string[];
}

export interface Arena {
  readonly cols: number;
  readonly rows: number;
  /** Row-major, `cols * rows` long. Mutable: destructible walls will change it. */
  readonly tiles: Tile[];
}

export interface Point {
  readonly x: number;
  readonly y: number;
}

export function parseLevel(level: LevelData): { arena: Arena; playerSpawn: Point } {
  const rows = level.rows.length;
  const cols = level.rows[0]?.length ?? 0;
  if (rows === 0 || cols === 0) throw new Error(`Level "${level.name}" is empty`);

  const tiles: Tile[] = [];
  let playerSpawn: Point | undefined;
  level.rows.forEach((line, row) => {
    if (line.length !== cols) {
      throw new Error(
        `Level "${level.name}": row ${row} has ${line.length} columns, expected ${cols}`,
      );
    }
    for (let col = 0; col < cols; col++) {
      const char = line.charAt(col);
      switch (char) {
        case '#':
          tiles.push(Tile.Wall);
          break;
        case '.':
          tiles.push(Tile.Floor);
          break;
        case 'P':
          tiles.push(Tile.Floor);
          playerSpawn = tileCenter(col, row);
          break;
        default:
          throw new Error(
            `Level "${level.name}": unknown tile '${char}' at column ${col}, row ${row}`,
          );
      }
    }
  });
  if (!playerSpawn) throw new Error(`Level "${level.name}" has no player spawn (P)`);
  return { arena: { cols, rows, tiles }, playerSpawn };
}

/** The tile at a grid position. Everything outside the arena counts as wall. */
export function tileAt(arena: Arena, col: number, row: number): Tile {
  if (col < 0 || row < 0 || col >= arena.cols || row >= arena.rows) return Tile.Wall;
  return arena.tiles[row * arena.cols + col] ?? Tile.Wall;
}

export function tileCenter(col: number, row: number): Point {
  return { x: (col + 0.5) * TILE_SIZE, y: (row + 0.5) * TILE_SIZE };
}
