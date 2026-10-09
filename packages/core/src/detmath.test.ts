import { describe, expect, it } from 'vitest';
import { atan2, cos, sin } from './detmath.ts';

// Tests may use Math.sin and friends (the determinism lint profile skips *.test.ts): they are the reference.
const TOLERANCE = 1e-12;

describe('detMath', () => {
  it('sin and cos match Math on [-10, 10]', () => {
    for (let i = 0; i <= 2000; i++) {
      const x = -10 + i * 0.01;
      expect(Math.abs(sin(x) - Math.sin(x))).toBeLessThan(TOLERANCE);
      expect(Math.abs(cos(x) - Math.cos(x))).toBeLessThan(TOLERANCE);
    }
  });

  it('atan2 matches Math in every direction', () => {
    for (let degrees = 0; degrees < 360; degrees++) {
      const a = (degrees * Math.PI) / 180 + 0.001;
      for (const radius of [0.5, 1, 1000]) {
        const y = radius * Math.sin(a);
        const x = radius * Math.cos(a);
        expect(Math.abs(atan2(y, x) - Math.atan2(y, x))).toBeLessThan(TOLERANCE);
      }
    }
  });

  it('handles the axes and the origin', () => {
    expect(atan2(0, 1)).toBe(0);
    expect(atan2(1, 0)).toBeCloseTo(Math.PI / 2, 15);
    expect(atan2(0, -1)).toBeCloseTo(Math.PI, 15);
    expect(atan2(-1, 0)).toBeCloseTo(-Math.PI / 2, 15);
    expect(atan2(0, 0)).toBe(0);
  });
});
