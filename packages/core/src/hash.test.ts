import { describe, expect, it } from 'vitest';
import { FNV_OFFSET, hashByte, hashNumber, hashString } from './hash.ts';

const fnvAscii = (text: string) =>
  [...text].reduce((hash, char) => hashByte(hash, char.charCodeAt(0)), FNV_OFFSET);

describe('hash', () => {
  it('matches the published FNV-1a test vectors', () => {
    expect(fnvAscii('')).toBe(0x811c9dc5);
    expect(fnvAscii('a')).toBe(0xe40c292c);
    expect(fnvAscii('foobar')).toBe(0xbf9cf968);
  });

  it('tells numbers apart by their exact bits', () => {
    expect(hashNumber(FNV_OFFSET, 0.1 + 0.2)).not.toBe(hashNumber(FNV_OFFSET, 0.3));
    expect(hashNumber(FNV_OFFSET, 0)).not.toBe(hashNumber(FNV_OFFSET, -0));
    expect(hashNumber(FNV_OFFSET, 1.5)).toBe(hashNumber(FNV_OFFSET, 1.5));
  });

  it('is order-sensitive for strings', () => {
    expect(hashString('ai')).not.toBe(hashString('ia'));
  });
});
