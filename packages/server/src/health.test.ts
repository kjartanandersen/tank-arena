import { describe, expect, it } from 'vitest';
import { HealthResponse } from '@arena/contracts';
import { SIM_VERSION } from '@arena/game';
import { app } from './index.ts';

describe('GET /api/health', () => {
  it('returns a valid health payload', async () => {
    const res = await app.request('/api/health');
    expect(res.status).toBe(200);
    expect(HealthResponse.parse(await res.json()).simVersion).toBe(SIM_VERSION);
  });
});
