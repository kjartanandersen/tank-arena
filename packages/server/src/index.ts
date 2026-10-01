import { Hono } from 'hono';
import { HealthResponse } from '@arena/contracts';
import { SIM_VERSION } from '@arena/game';

export const app = new Hono().basePath('/api');

app.get('/health', (c) =>
  c.json(
    HealthResponse.parse({ ok: true, simVersion: SIM_VERSION, time: new Date().toISOString() }),
  ),
);
