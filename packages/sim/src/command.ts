import { TAU, wrapAngle } from '@arena/core';

/**
 *
 */
export const Move = { Up: 1, Down: 2, Left: 4, Right: 8 } as const;

/**
 * Everything a tank can be told to do in one tick. Player input and, later, the AI produce exactly
 * this, so the AI can never do anything a player couldn't.
 */
export interface TankCommand {
  /** Bitmask of `Move` directions in screen space (Up is -y). */
  readonly move: number;
  /** Turret aim as an unsigned 16-bit angle: 0 points along +x, and it increases clockwise on screen. */
  readonly aim: number;
  /** Try to fire this tick */
  readonly fire: boolean;
}

const AIM_STEPS = 65536;

/**
 * Quantizes an angle in radians to the 16-bit command format. The client quantizes *before* the
 * simulation sees the value, so the recorded input is exactly what was simulated.
 */
export function encodeAim(angle: number): number {
  return Math.round((wrapAngle(angle) / TAU) * AIM_STEPS) & 0xffff;
}

/** The angle in radians, in [-PI, PI), that a 16-bit aim value stands for. */
export function decodeAim(aim: number): number {
  return wrapAngle((aim & 0xffff) * (TAU / AIM_STEPS));
}
