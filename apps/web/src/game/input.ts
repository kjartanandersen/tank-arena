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
  /** True once per click: reading it clears it, so call it exactly once per tick. */
  takeFire(): boolean;
  dispose(): void;
}

export function createInput(target: Window, canvas: HTMLCanvasElement): Input {
  const down = new Set<string>();
  let pointer: { x: number; y: number } | null = null;
  // Latched until the next tick reads it, so a click shorter than a tick is never missed.
  let firePressed = false;

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
  const onPointerDown = (e: PointerEvent) => {
    if (e.button !== 0) return; // primary button only: left mouse button, touch or pen
    pointer = { x: e.offsetX, y: e.offsetY }; // clicking without moving first still aims at the click
    firePressed = true;
  };

  target.addEventListener('keydown', onKeyDown);
  target.addEventListener('keyup', onKeyUp);
  target.addEventListener('blur', onBlur);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerdown', onPointerDown);

  return {
    move() {
      let move = 0;
      for (const code of down) move |= KEYS[code] ?? 0;
      return move;
    },
    pointer: () => pointer,
    takeFire() {
      const fire = firePressed;
      firePressed = false;
      return fire;
    },
    dispose() {
      target.removeEventListener('keydown', onKeyDown);
      target.removeEventListener('keyup', onKeyUp);
      target.removeEventListener('blur', onBlur);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerdown', onPointerDown);
    },
  };
}
