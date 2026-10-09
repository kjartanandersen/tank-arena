import { describe, expect, it } from 'vitest';
import { createWorld } from '@arena/sim';
import { idle } from './index.ts';

describe('idle brain', () => {
  it('never moves', () => {
    const world = createWorld({ name: 'room', rows: ['###', '#P#', '###'] }, 1);
    expect(idle(world)).toEqual({ move: 0, aim: 0 });
  });
});
