import {
  createWorld,
  hashWorld,
  step,
  type LevelData,
  type TankCommand,
  type World,
} from '@arena/sim';

export { angleDelta } from '@arena/core';
export {
  Move,
  PLAYER_ID,
  SIM_VERSION,
  TANK_RADIUS,
  TICK_RATE,
  TILE_SIZE,
  Tile,
  encodeAim,
  type LevelData,
  type Tank,
  type TankCommand,
  type World,
} from '@arena/sim';
export { TRAINING_GROUND } from './levels/training-ground.ts';

export interface MatchOptions {
  readonly level: LevelData;
  /** Same level + seed + inputs = same match, on every machine. */
  readonly seed: number;
}

export interface Match {
  readonly world: Readonly<World>;
  /** Advances one tick with the player's command for that tick. */
  step(player: TankCommand): void;
  /** Checksum of the current state (see hashWorld). */
  hash(): number;
}

export function createMatch({ level, seed }: MatchOptions): Match {
  const world = createWorld(level, seed);
  return {
    world,
    step: (player) => step(world, [player]),
    hash: () => hashWorld(world),
  };
}
