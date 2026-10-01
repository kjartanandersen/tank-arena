import { Move, type TankCommand } from '@arena/game';

const KEYS: Record<string, number> = {
  KeyW: Move.Up,
  KeyS: Move.Down,
  KeyA: Move.Left,
  KeyD: Move.Right,
};

export function createKeyboard(target: Window) {
  const down = new Set<string>();
  const onDown = (e: KeyboardEvent) => void down.add(e.code);
  const onUp = (e: KeyboardEvent) => void down.delete(e.code);
  target.addEventListener('keydown', onDown);
  target.addEventListener('keyup', onUp);

  return {
    command(): TankCommand {
      let move = 0;
      for (const code of down) move |= KEYS[code] ?? 0;
      return { move };
    },
    dispose() {
      target.removeEventListener('keydown', onDown);
      target.removeEventListener('keyup', onUp);
    },
  };
}
