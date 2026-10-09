import { describe, expect, it } from 'vitest';
import { PI, TAU, angleDelta, turnTowards, wrapAngle } from './angle.ts';

describe('wrapAngle', () => {
  it('wraps into [-PI, PI)', () => {
    expect(wrapAngle(0)).toBe(0);
    expect(wrapAngle(PI)).toBeCloseTo(-PI, 12);
    expect(wrapAngle(-PI)).toBeCloseTo(-PI, 12);
    expect(wrapAngle(3 * TAU + 1)).toBeCloseTo(1, 12);
    expect(wrapAngle(-TAU - 1)).toBeCloseTo(-1, 12);
  });
});

describe('angleDelta', () => {
  it('takes the short way round', () => {
    expect(angleDelta(PI - 0.1, -PI + 0.1)).toBeCloseTo(0.2, 12);
    expect(angleDelta(0.5, 0.2)).toBeCloseTo(-0.3, 12);
  });
});

describe('turnTowards', () => {
  it('turns by at most maxStep, and lands exactly on the target', () => {
    expect(turnTowards(0, 1, 0.25)).toBeCloseTo(0.25, 12);
    expect(turnTowards(0, -1, 0.25)).toBeCloseTo(-0.25, 12);
    expect(turnTowards(0.9, 1, 0.25)).toBe(1);
  });
});
