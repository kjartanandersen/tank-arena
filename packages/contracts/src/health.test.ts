import { describe, expect, it } from 'vitest';
import { HealthResponse } from './index.ts';

describe('HealthResponse', () => {
  it('accepts a valid payload', () => {
    const payload = { ok: true, simVersion: 1, time: '2026-10-01T12:00:00.000Z' };
    expect(HealthResponse.parse(payload)).toEqual(payload);
  });

  it('rejects a malformed payload', () => {
    expect(HealthResponse.safeParse({ ok: true, simVersion: 1.5, time: 'yesterday' }).success).toBe(
      false,
    );
  });
});
