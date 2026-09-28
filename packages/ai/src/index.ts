import type { TankCommand, World } from '@arena/sim';

/** Placeholder brain: does nothing. Replaced in M2. */
export function idle(_world: Readonly<World>): TankCommand {
  return { move: 0 };
}
