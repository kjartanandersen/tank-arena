import { Application, type Container } from 'pixi.js';
import {
  PLAYER_ID,
  TRAINING_GROUND,
  angleDelta,
  createMatch,
  encodeAim,
  type Tank,
} from '@arena/game';
import { createInput, type Input } from './input.ts';
import { createScene, type TankPose } from './render.ts';

const STEP_MS = 1000 / 60;
const MAX_STEPS_PER_FRAME = 5;

/** Mounts the game into `host`. Returns a cleanup function. */
export function mountGame(host: HTMLElement): () => void {
  const app = new Application();
  const match = createMatch({ level: TRAINING_GROUND, seed: 1 });
  const player = match.world.tanks.find((tank) => tank.id === PLAYER_ID);
  if (!player) throw new Error('The level has no player tank');
  let input: Input | undefined;
  let disposed = false;

  void app
    .init({
      resizeTo: host,
      background: '#14171c',
      antialias: true,
      resolution: window.devicePixelRatio,
      autoDensity: true,
    })
    .then(() => {
      if (disposed) {
        app.destroy(true); // unmounted (e.g. StrictMode) before init finished
        return;
      }
      host.appendChild(app.canvas);
      input = createInput(window, app.canvas);
      const scene = createScene(match.world);
      app.stage.addChild(scene.root);

      let previous = poseOf(player);
      let acc = 0;
      app.ticker.add((ticker) => {
        acc += ticker.deltaMS;
        let steps = 0;
        while (acc >= STEP_MS && steps < MAX_STEPS_PER_FRAME) {
          previous = poseOf(player);
          match.step({ move: input?.move() ?? 0, aim: aimAt(player, scene.root, input) });
          acc -= STEP_MS;
          steps += 1;
        }
        if (steps === MAX_STEPS_PER_FRAME) acc = 0; // drop time rather than spiral

        // Fit the arena to the window, letterboxed.
        const scale = Math.min(app.screen.width / scene.width, app.screen.height / scene.height);
        scene.root.scale.set(scale);
        scene.root.position.set(
          (app.screen.width - scene.width * scale) / 2,
          (app.screen.height - scene.height * scale) / 2,
        );

        // Draw between the last two ticks, so motion is smooth at any frame rate.
        scene.setPlayerPose(interpolate(previous, poseOf(player), acc / STEP_MS));
      });
    });

  return () => {
    disposed = true;
    input?.dispose();
    if (app.renderer) app.destroy(true);
  };
}

/** The 16-bit aim towards the pointer, measured from the tank's simulated (not drawn) position. */
function aimAt(tank: Tank, world: Container, input: Input | undefined): number {
  const pointer = input?.pointer();
  if (!pointer) return encodeAim(tank.turret);
  const target = world.toLocal(pointer);
  return encodeAim(Math.atan2(target.y - tank.y, target.x - tank.x));
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
