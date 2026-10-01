import { describe, expect, it } from 'vitest';
import { createWorld } from '@arena/sim';
import { idle } from './index.ts';

describe('idle brain', () => {
  it('never moves', () => {
    expect(idle(createWorld())).toEqual({ move: 0 });
  });
});
