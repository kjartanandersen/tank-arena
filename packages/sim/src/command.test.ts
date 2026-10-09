import { describe, expect, it } from 'vitest';
import { PI, TAU } from '@arena/core';
import { decodeAim, encodeAim } from './command.ts';

describe('aim encoding', () => {
  it('round-trips any angle to within half a step', () => {
    for (let i = -100; i <= 100; i++) {
      const angle = i * 0.0317;
      const error = Math.abs(Math.atan2(Math.sin(decodeAim(encodeAim(angle)) - angle), 1));
      expect(error).toBeLessThanOrEqual(TAU / 65536 / 2 + 1e-12);
    }
  });

  it('uses the full unsigned 16-bit range', () => {
    expect(encodeAim(0)).toBe(0);
    expect(encodeAim(PI / 2)).toBe(16384);
    expect(encodeAim(-PI / 2)).toBe(49152);
    expect(decodeAim(32768)).toBeCloseTo(-PI, 12);
  });
});
