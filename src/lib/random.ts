/**
 * Identifier and random-data generation.
 *
 * Every value comes from `crypto.getRandomValues`; `Math.random` is never used
 * for anything a caller might treat as unique or unguessable.
 */

export const NIL_UUID = '00000000-0000-0000-0000-000000000000';
export const MAX_UUID = 'ffffffff-ffff-ffff-ffff-ffffffffffff';

export const bytes = (n: number) => crypto.getRandomValues(new Uint8Array(n));

export const hex = (arr: Uint8Array) =>
  Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('');

const dashed = (h: string) =>
  `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;

export function uuid4(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const b = bytes(16);
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  return dashed(hex(b));
}

/** UUID v7: 48-bit big-endian timestamp, version/variant bits, then entropy. */
export function uuid7(now = Date.now()): string {
  const b = bytes(16);
  const ms = BigInt(now);
  for (let i = 0; i < 6; i++) {
    b[i] = Number((ms >> BigInt(8 * (5 - i))) & 0xffn);
  }
  b[6] = (b[6] & 0x0f) | 0x70;
  b[8] = (b[8] & 0x3f) | 0x80;
  return dashed(hex(b));
}

/** Reads the 48-bit timestamp back out of a v7 UUID. */
export function uuid7Time(id: string): number {
  return Number(BigInt(`0x${id.replace(/-/g, '').slice(0, 12)}`));
}

export const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

export function ulid(now = Date.now()): string {
  let time = now;
  let timePart = '';
  for (let i = 0; i < 10; i++) {
    timePart = CROCKFORD[time % 32] + timePart;
    time = Math.floor(time / 32);
  }
  const random = Array.from(bytes(16), (b) => CROCKFORD[b % 32]).join('');
  return timePart + random;
}

export const NANO_ALPHABET = 'useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict';

export function nanoid(size = 21): string {
  return Array.from(bytes(size), (b) => NANO_ALPHABET[b % NANO_ALPHABET.length]).join('');
}

export const CHARSETS: Record<string, string> = {
  lower: 'abcdefghijklmnopqrstuvwxyz',
  upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  digits: '0123456789',
  symbols: '!@#$%^&*()-_=+[]{};:,.?',
};

export function randomString(size: number, pool: string): string {
  if (!pool) return '';
  return Array.from(bytes(size), (b) => pool[b % pool.length]).join('');
}

/** Rejection sampling keeps the distribution uniform across the range. */
export function randomInt(min: number, max: number): number {
  const lo = Math.ceil(Math.min(min, max));
  const hi = Math.floor(Math.max(min, max));
  const range = hi - lo + 1;
  if (range <= 0) return lo;
  const limit = Math.floor(0xffffffff / range) * range;
  let value = 0;
  do {
    value = crypto.getRandomValues(new Uint32Array(1))[0];
  } while (value >= limit);
  return lo + (value % range);
}

export const LOREM =
  'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure in reprehenderit voluptate velit esse cillum eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum'.split(
    ' ',
  );

export function sentence(): string {
  const length = randomInt(8, 18);
  const picked = Array.from({ length }, () => LOREM[randomInt(0, LOREM.length - 1)]);
  return `${picked[0][0].toUpperCase()}${picked[0].slice(1)} ${picked.slice(1).join(' ')}.`;
}

export function randomColor(): string {
  const b = bytes(3);
  return `#${hex(b)}  rgb(${b[0]}, ${b[1]}, ${b[2]})`;
}

export interface Decoration {
  upper?: boolean;
  braces?: boolean;
  quotes?: boolean;
}

export function decorate(value: string, options: Decoration): string {
  let out = value;
  if (options.upper) out = out.toUpperCase();
  if (options.braces) out = `{${out}}`;
  if (options.quotes) out = `"${out}",`;
  return out;
}

export const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
