import { createWorld, step, type TankCommand, type World } from '@arena/sim';

export { Move, SIM_VERSION, type TankCommand, type World } from '@arena/sim';

export interface Match {
  readonly world: Readonly<World>;
  step(player: TankCommand): void;
}

export function createMatch(): Match {
  const world = createWorld();
  return { world, step: (player) => step(world, player) };
}
