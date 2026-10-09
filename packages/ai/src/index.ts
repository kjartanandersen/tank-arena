import type { TankCommand, World } from '@arena/sim';

/** Placeholder brain: stands still, turret forward, never fires. Replaced in M2. */
export function idle(_world: Readonly<World>): TankCommand {
  return { move: 0, aim: 0, fire: false };
}
