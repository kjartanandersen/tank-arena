import { z } from 'zod';

z.literal(true);

export const HealthResponse = z.object({
  ok: z.literal(true),
  simVersion: z.int(),
  time: z.iso.datetime(),
});
export type HealthResponse = z.infer<typeof HealthResponse>;
