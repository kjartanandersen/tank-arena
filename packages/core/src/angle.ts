export const PI = Math.PI;
export const TAU = 2 * Math.PI;
export const HALF_PI = Math.PI / 2;

/** Wraps an angle in radians into [-PI, PI). */
export function wrapAngle(angle: number): number {
  return angle - TAU * Math.floor((angle + PI) / TAU);
}

/** The signed shortest rotation from `from` to `to`, in [-PI, PI). */
export function angleDelta(from: number, to: number): number {
  return wrapAngle(to - from);
}

/** Rotates `current` towards `target` by at most `maxStep` radians, the short way round. */
export function turnTowards(current: number, target: number, maxStep: number): number {
  const delta = angleDelta(current, target);
  if (Math.abs(delta) <= maxStep) return wrapAngle(target);
  return wrapAngle(current + (delta > 0 ? maxStep : -maxStep));
}
