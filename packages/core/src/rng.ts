import { hashString } from './hash.ts';

/**
 * State of a seeded pseudo-random number generator (sfc32). Four plain unsigned 32-bit numbers, so
 * it lives inside the simulation state and is snapshotted, restored and hashed like everything else.
 */
export interface Rng {
  a: number;
  b: number;
  c: number;
  d: number;
}

/** Creates a generator from a 32-bit seed. Equal seeds give equal sequences on every engine. */
export function createRng(seed: number): Rng {
  // splitmix32 spreads the seed over the four state words, so similar seeds give unrelated sequences.
  let s = seed | 0;
  const mix = (): number => {
    s = (s + 0x9e3779b9) | 0;
    let t = s ^ (s >>> 16);
    t = Math.imul(t, 0x21f0aaad);
    t ^= t >>> 15;
    t = Math.imul(t, 0x735a2d97);
    return (t ^ (t >>> 15)) >>> 0;
  };
  const rng: Rng = { a: mix(), b: mix(), c: mix(), d: mix() };
  for (let i = 0; i < 12; i++) nextU32(rng);
  return rng;
}

/** A generator for a named stream, e.g. `forkRng(seed, 'spread')`. Streams don't affect each other. */
export function forkRng(seed: number, stream: string): Rng {
  return createRng(seed ^ hashString(stream));
}

/** Next unsigned 32-bit integer. Advances `rng`. */
export function nextU32(rng: Rng): number {
  const { a, b, c, d } = rng;
  const t = (((a + b) | 0) + d) | 0;
  rng.d = (d + 1) >>> 0;
  rng.a = (b ^ (b >>> 9)) >>> 0;
  rng.b = (c + (c << 3)) >>> 0;
  rng.c = (((c << 21) | (c >>> 11)) + t) >>> 0;
  return t >>> 0;
}

/** Next float in [0, 1). */
export function nextFloat(rng: Rng): number {
  return nextU32(rng) / 4294967296;
}

/** Next integer in [min, max). */
export function nextInt(rng: Rng, min: number, max: number): number {
  return min + Math.floor(nextFloat(rng) * (max - min));
}
