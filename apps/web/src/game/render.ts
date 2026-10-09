import { Container, Graphics } from 'pixi.js';
import { TILE_SIZE, Tile, type World } from '@arena/game';

/** What the renderer needs from a tank. Interpolated between ticks, so not a `Tank`. */
export interface TankPose {
  x: number;
  y: number;
  heading: number;
  turret: number;
}

const COLORS = {
  floor: 0x262b33,
  grid: 0x30363f,
  wall: 0x56606e,
  wallTop: 0x737e8d,
  tread: 0x2b3527,
  body: 0x5f9e4f,
  turret: 0x7cc46a,
  barrel: 0x48733c,
};

export interface Scene {
  /** Everything in world coordinates (1 unit = 1 px of the arena). Scale and move this to fit the screen. */
  readonly root: Container;
  readonly width: number;
  readonly height: number;
  setPlayerPose(pose: TankPose): void;
}

export function createScene(world: Readonly<World>): Scene {
  const root = new Container();
  root.addChild(drawArena(world));

  // The body rotates with the heading; the turret is a sibling so it can point anywhere.
  const tank = new Container();
  const body = new Graphics()
    .rect(-17, -14, 34, 6)
    .fill(COLORS.tread)
    .rect(-17, 8, 34, 6)
    .fill(COLORS.tread)
    .roundRect(-14, -10, 28, 20, 3)
    .fill(COLORS.body);
  const turret = new Graphics()
    .rect(0, -3, 26, 6)
    .fill(COLORS.barrel)
    .circle(0, 0, 8)
    .fill(COLORS.turret);
  tank.addChild(body, turret);
  root.addChild(tank);

  return {
    root,
    width: world.arena.cols * TILE_SIZE,
    height: world.arena.rows * TILE_SIZE,
    setPlayerPose(pose) {
      tank.position.set(pose.x, pose.y);
      body.rotation = pose.heading;
      turret.rotation = pose.turret;
    },
  };
}

function drawArena(world: Readonly<World>): Graphics {
  const { cols, rows, tiles } = world.arena;
  const width = cols * TILE_SIZE;
  const height = rows * TILE_SIZE;
  const g = new Graphics().rect(0, 0, width, height).fill(COLORS.floor);

  for (let col = 1; col < cols; col++) g.moveTo(col * TILE_SIZE, 0).lineTo(col * TILE_SIZE, height);
  for (let row = 1; row < rows; row++) g.moveTo(0, row * TILE_SIZE).lineTo(width, row * TILE_SIZE);
  g.stroke({ width: 1, color: COLORS.grid });

  tiles.forEach((tile, i) => {
    if (tile !== Tile.Wall) return;
    const x = (i % cols) * TILE_SIZE;
    const y = Math.floor(i / cols) * TILE_SIZE;
    g.rect(x, y, TILE_SIZE, TILE_SIZE).fill(COLORS.wall);
    g.rect(x, y, TILE_SIZE, 6).fill(COLORS.wallTop); // light top edge reads as height
  });
  return g;
}
