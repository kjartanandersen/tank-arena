/**
 * Deterministic replacements for Math.sin, Math.cos and Math.atan2.
 *
 * ECMAScript lets engines approximate those functions differently, so V8, SpiderMonkey and
 * JavaScriptCore can disagree in the last bit. These versions use only + - * /, Math.round and
 * Math.abs, which are exactly specified, so every engine returns identical bits.
 * See docs/adr/0001-deterministic-simulation.md.
 */
import { HALF_PI, PI } from './angle.ts';

// Taylor series coefficients, highest power first. Each series runs in powers of x², and on the
// small ranges used below the first omitted term is under 1e-13.
const SIN = [1 / 6227020800, -1 / 39916800, 1 / 362880, -1 / 5040, 1 / 120, -1 / 6, 1];
const COS = [-1 / 87178291200, 1 / 479001600, -1 / 3628800, 1 / 40320, -1 / 720, 1 / 24, -1 / 2, 1];
const ATAN = [-1 / 19, 1 / 17, -1 / 15, 1 / 13, -1 / 11, 1 / 9, -1 / 7, 1 / 5, -1 / 3, 1];

/** Evaluates a polynomial (highest power first) at x with Horner's rule. */
function horner(coefficients: readonly number[], x: number): number {
  let sum = 0;
  for (const c of coefficients) sum = sum * x + c;
  return sum;
}

/** Splits x into a quadrant (0-3) and a remainder in about [-PI/4, PI/4]. */
function reduce(x: number): [quadrant: number, remainder: number] {
  const q = Math.round(x / HALF_PI);
  return [((q % 4) + 4) % 4, x - q * HALF_PI];
}

const sinSmall = (r: number) => r * horner(SIN, r * r);
const cosSmall = (r: number) => horner(COS, r * r);

/** Deterministic sine. Accurate to about 1e-13 for |x| up to a few thousand radians. */
export function sin(x: number): number {
  const [quadrant, r] = reduce(x);
  switch (quadrant) {
    case 0:
      return sinSmall(r);
    case 1:
      return cosSmall(r);
    case 2:
      return -sinSmall(r);
    default:
      return -cosSmall(r);
  }
}

/** Deterministic cosine. Accurate to about 1e-13 for |x| up to a few thousand radians. */
export function cos(x: number): number {
  const [quadrant, r] = reduce(x);
  switch (quadrant) {
    case 0:
      return cosSmall(r);
    case 1:
      return -sinSmall(r);
    case 2:
      return -cosSmall(r);
    default:
      return sinSmall(r);
  }
}

const SQRT3 = 1.7320508075688772;
const TAN_15_DEG = 2 - SQRT3;

/** atan(t) for t in [0, 1]. */
function atanUnit(t: number): number {
  if (t <= TAN_15_DEG) return t * horner(ATAN, t * t);
  // atan(t) = PI/6 + atan(u) with u = (sqrt(3)*t - 1) / (sqrt(3) + t), and |u| <= tan(15 deg).
  const u = (SQRT3 * t - 1) / (SQRT3 + t);
  return PI / 6 + u * horner(ATAN, u * u);
}

/** Deterministic atan2. Returns an angle in [-PI, PI]; atan2(0, 0) is 0. */
export function atan2(y: number, x: number): number {
  const ax = Math.abs(x);
  const ay = Math.abs(y);
  if (ax === 0 && ay === 0) return 0;
  let angle = ay <= ax ? atanUnit(ay / ax) : HALF_PI - atanUnit(ax / ay);
  if (x < 0) angle = PI - angle;
  return y < 0 ? -angle : angle;
}
