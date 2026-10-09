/**
 * 32-bit FNV-1a hashing for state checksums. Numbers are hashed by their exact float64 bits, so two
 * states hash equal only if they are bit-for-bit identical, which is the strictest determinism check.
 */
export const FNV_OFFSET = 0x811c9dc5;
const FNV_PRIME = 0x01000193;

const view = new DataView(new ArrayBuffer(8));

export function hashByte(hash: number, byte: number): number {
  return Math.imul(hash ^ (byte & 0xff), FNV_PRIME) >>> 0;
}

export function hashNumber(hash: number, value: number): number {
  view.setFloat64(0, value, true); // fixed little-endian byte order on every platform
  let h = hash;
  for (let i = 0; i < 8; i++) h = hashByte(h, view.getUint8(i));
  return h;
}

/** Hashes a string's UTF-16 code units, two bytes each. */
export function hashString(value: string, hash = FNV_OFFSET): number {
  let h = hash;
  for (let i = 0; i < value.length; i++) {
    const unit = value.charCodeAt(i);
    h = hashByte(h, unit);
    h = hashByte(h, unit >>> 8);
  }
  return h;
}
