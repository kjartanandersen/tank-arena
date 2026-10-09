import { Move } from '@arena/game';

const KEYS: Record<string, number> = {
  KeyW: Move.Up,
  KeyS: Move.Down,
  KeyA: Move.Left,
  KeyD: Move.Right,
  ArrowUp: Move.Up,
  ArrowDown: Move.Down,
  ArrowLeft: Move.Left,
  ArrowRight: Move.Right,
};

export interface Input {
  /** Bitmask of the `Move` directions currently held. */
  move(): number;
  /** Last pointer position in canvas (CSS) pixels, or null until the pointer has moved. */
  pointer(): { x: number; y: number } | null;
  dispose(): void;
}

export function createInput(target: Window, canvas: HTMLCanvasElement): Input {
  const down = new Set<string>();
  let pointer: { x: number; y: number } | null = null;

  const onKeyDown = (e: KeyboardEvent) => {
    if (!(e.code in KEYS)) return;
    down.add(e.code);
    e.preventDefault(); // stop arrow keys scrolling the page
  };
  const onKeyUp = (e: KeyboardEvent) => void down.delete(e.code);
  const onBlur = () => down.clear(); // keys released while the window is unfocused never send keyup
  const onPointerMove = (e: PointerEvent) => {
    pointer = { x: e.offsetX, y: e.offsetY };
  };

  target.addEventListener('keydown', onKeyDown);
  target.addEventListener('keyup', onKeyUp);
  target.addEventListener('blur', onBlur);
  canvas.addEventListener('pointermove', onPointerMove);

  return {
    move() {
      let move = 0;
      for (const code of down) move |= KEYS[code] ?? 0;
      return move;
    },
    pointer: () => pointer,
    dispose() {
      target.removeEventListener('keydown', onKeyDown);
      target.removeEventListener('keyup', onKeyUp);
      target.removeEventListener('blur', onBlur);
      canvas.removeEventListener('pointermove', onPointerMove);
    },
  };
}
