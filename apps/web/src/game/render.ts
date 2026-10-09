import { Container, Graphics } from 'pixi.js';
import { BULLET_RADIUS, TILE_SIZE, Tile, angleDelta, type Tank, type World } from '@arena/game';

/** What the renderer needs from a tank. Interpolated between ticks, so not a `Tank`. */
export interface TankPose {
  x: number;
  y: number;
  heading: number;
  turret: number;
}

/** Where everything was just before a tick, so the renderer can interpolate towards the next one. */
export interface Snapshot {
  readonly tanks: ReadonlyMap<number, TankPose>;
  readonly bullets: ReadonlyMap<number, { readonly x: number; readonly y: number }>;
}

export function snapshot(world: Readonly<World>): Snapshot {
  return {
    tanks: new Map(world.tanks.map((tank) => [tank.id, poseOf(tank)])),
    bullets: new Map(world.bullets.map((bullet) => [bullet.id, { x: bullet.x, y: bullet.y }])),
  };
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
  bullet: 0xf3e2b3,
  bulletEdge: 0x8a6a2c,
};

export interface Scene {
  /** Everything in world coordinates (1 unit = 1 px of the arena). Scale and move this to fit the screen. */
  readonly root: Container;
  readonly width: number;
  readonly height: number;
  /** Draws `world` as it was `alpha` (0 to 1) of the way from `previous` to the current tick. */
  render(previous: Snapshot, world: Readonly<World>, alpha: number): void;
}

export function createScene(world: Readonly<World>): Scene {
  const root = new Container();
  const tankLayer = new Container();
  const bulletLayer = new Container(); // drawn last, so bullets fly over tanks
  root.addChild(drawArena(world), tankLayer, bulletLayer);

  // One view per simulated object, keyed by id. Bullet ids are never reused, so a missing id means
  // the bullet was destroyed and its view can go.
  const tankViews = new Map<number, TankView>();
  const bulletViews = new Map<number, Graphics>();

  return {
    root,
    width: world.arena.cols * TILE_SIZE,
    height: world.arena.rows * TILE_SIZE,
    render(previous, current, alpha) {
      for (const tank of current.tanks) {
        let view = tankViews.get(tank.id);
        if (!view) {
          view = createTankView();
          tankLayer.addChild(view.root);
          tankViews.set(tank.id, view);
        }
        const to = poseOf(tank);
        view.setPose(interpolate(previous.tanks.get(tank.id) ?? to, to, alpha));
      }

      const flying = new Set<number>();
      for (const bullet of current.bullets) {
        flying.add(bullet.id);
        let view = bulletViews.get(bullet.id);
        if (!view) {
          view = createBulletView();
          bulletLayer.addChild(view);
          bulletViews.set(bullet.id, view);
        }
        const from = previous.bullets.get(bullet.id) ?? bullet; // new this tick: no previous position
        view.position.set(
          from.x + (bullet.x - from.x) * alpha,
          from.y + (bullet.y - from.y) * alpha,
        );
      }
      for (const [id, view] of bulletViews) {
        if (flying.has(id)) continue;
        view.destroy();
        bulletViews.delete(id);
      }
    },
  };
}

interface TankView {
  readonly root: Container;
  setPose(pose: TankPose): void;
}

function createTankView(): TankView {
  // The body rotates with the heading; the turret is a sibling so it can point anywhere.
  const root = new Container();
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
  root.addChild(body, turret);
  return {
    root,
    setPose(pose) {
      root.position.set(pose.x, pose.y);
      body.rotation = pose.heading;
      turret.rotation = pose.turret;
    },
  };
}

function createBulletView(): Graphics {
  return new Graphics()
    .circle(0, 0, BULLET_RADIUS)
    .fill(COLORS.bullet)
    .stroke({ width: 1.5, color: COLORS.bulletEdge });
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

function poseOf(tank: Tank): TankPose {
  return { x: tank.x, y: tank.y, heading: tank.heading, turret: tank.turret };
}

function interpolate(from: TankPose, to: TankPose, t: number): TankPose {
  return {
    x: from.x + (to.x - from.x) * t,
    y: from.y + (to.y - from.y) * t,
    heading: from.heading + angleDelta(from.heading, to.heading) * t,
    turret: from.turret + angleDelta(from.turret, to.turret) * t,
  };
}
