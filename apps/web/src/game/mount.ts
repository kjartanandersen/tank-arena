import { Application, Graphics } from 'pixi.js';
import { createMatch } from '@arena/game';
import { createKeyboard } from './input.ts';

const STEP_MS = 1000 / 60;
const MAX_STEPS_PER_FRAME = 5;

/** Mounts the game into `host`. Returns a cleanup function. */
export function mountGame(host: HTMLElement): () => void {
  const app = new Application();
  const keyboard = createKeyboard(window);
  const match = createMatch();
  let disposed = false;

  void app.init({ resizeTo: host, background: '#1b1f24', antialias: true }).then(() => {
    if (disposed) {
      app.destroy(true); // unmounted (e.g. StrictMode) before init finished
      return;
    }
    host.appendChild(app.canvas);
    const tank = new Graphics().rect(-16, -12, 32, 24).fill(0x6bbf59);
    app.stage.addChild(tank);

    let acc = 0;
    app.ticker.add((ticker) => {
      acc += ticker.deltaMS;
      let steps = 0;
      while (acc >= STEP_MS && steps < MAX_STEPS_PER_FRAME) {
        match.step(keyboard.command());
        acc -= STEP_MS;
        steps += 1;
      }
      if (steps === MAX_STEPS_PER_FRAME) acc = 0; // drop time rather than spiral
      tank.position.set(match.world.tank.x, match.world.tank.y); // interpolation arrives in M1
    });
  });

  return () => {
    disposed = true;
    keyboard.dispose();
    if (app.renderer) app.destroy(true);
  };
}
