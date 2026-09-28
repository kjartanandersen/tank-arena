import { clamp } from '@arena/core';

export const SIM_VERSION = 1;
export const TICK_RATE = 60;

export const Move = { Up: 1, Down: 2, Left: 4, Right: 8 } as const;

export interface TankCommand {
  readonly move: number; // bitmask of Move
}
export interface Tank {
  x: number;
  y: number;
}
export interface World {
  tick: number;
  readonly width: number;
  readonly height: number;
  tank: Tank;
}

const SPEED = 3; // px per tick

export function createWorld(width = 1152, height = 768): World {
  return { tick: 0, width, height, tank: { x: width / 2, y: height / 2 } };
}

export function step(world: World, cmd: TankCommand): void {
  const dx = (cmd.move & Move.Right ? 1 : 0) - (cmd.move & Move.Left ? 1 : 0);
  const dy = (cmd.move & Move.Down ? 1 : 0) - (cmd.move & Move.Up ? 1 : 0);
  world.tank.x = clamp(world.tank.x + dx * SPEED, 0, world.width);
  world.tank.y = clamp(world.tank.y + dy * SPEED, 0, world.height);
  world.tick += 1;
}
