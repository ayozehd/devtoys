import { describe, expect, it } from 'vitest';
import {
  CHARSETS,
  CROCKFORD,
  MAX_UUID,
  NANO_ALPHABET,
  NIL_UUID,
  UUID_RE,
  decorate,
  nanoid,
  randomColor,
  randomInt,
  randomString,
  sentence,
  ulid,
  uuid4,
  uuid7,
  uuid7Time,
} from '../src/lib/random';

describe('UUIDs', () => {
  it('generates v4 with the right version and variant bits', () => {
    for (let i = 0; i < 25; i++) {
      const id = uuid4();
      expect(id).toMatch(UUID_RE);
      expect(id[14]).toBe('4');
    }
  });

  it('generates v7 with version 7 and a recoverable timestamp', () => {
    const before = Date.now();
    const id = uuid7();
    expect(id).toMatch(UUID_RE);
    expect(id[14]).toBe('7');
    expect(uuid7Time(id)).toBeGreaterThanOrEqual(before);
    expect(uuid7Time(id)).toBeLessThanOrEqual(Date.now());
  });

  it('sorts v7 ids by creation time', () => {
    const ids = [uuid7(1_700_000_000_000), uuid7(1_700_000_001_000), uuid7(1_700_000_002_000)];
    expect([...ids].sort()).toEqual(ids);
  });

  it('never collides across a large batch', () => {
    const ids = new Set(Array.from({ length: 2000 }, uuid4));
    expect(ids.size).toBe(2000);
  });

  it('exposes the sentinel UUIDs in canonical form', () => {
    expect(NIL_UUID).toBe('00000000-0000-0000-0000-000000000000');
    expect(MAX_UUID).toBe('ffffffff-ffff-ffff-ffff-ffffffffffff');
    expect(NIL_UUID).toHaveLength(36);
  });
});

describe('ULID and Nano ID', () => {
  it('produces 26 Crockford base32 characters', () => {
    const id = ulid();
    expect(id).toHaveLength(26);
    expect([...id].every((c) => CROCKFORD.includes(c))).toBe(true);
  });

  it('sorts lexicographically by time', () => {
    const a = ulid(1_700_000_000_000);
    const b = ulid(1_700_000_001_000);
    expect(a.slice(0, 10) < b.slice(0, 10)).toBe(true);
  });

  it('encodes the timestamp in the first ten characters', () => {
    expect(ulid(0).slice(0, 10)).toBe('0000000000');
  });

  it('makes URL-safe Nano IDs of the requested size', () => {
    expect(nanoid()).toHaveLength(21);
    expect(nanoid(10)).toHaveLength(10);
    expect([...nanoid(200)].every((c) => NANO_ALPHABET.includes(c))).toBe(true);
    expect(nanoid(50)).not.toMatch(/[^A-Za-z0-9_-]/);
  });
});

describe('random values', () => {
  it('draws strings only from the given pool', () => {
    expect(randomString(100, CHARSETS.digits)).toMatch(/^\d{100}$/);
    expect(randomString(10, '')).toBe('');
  });

  it('stays inside the requested integer range', () => {
    for (let i = 0; i < 500; i++) {
      const value = randomInt(5, 8);
      expect(value).toBeGreaterThanOrEqual(5);
      expect(value).toBeLessThanOrEqual(8);
      expect(Number.isInteger(value)).toBe(true);
    }
  });

  it('handles reversed and single-value ranges', () => {
    expect(randomInt(9, 3)).toBeGreaterThanOrEqual(3);
    expect(randomInt(7, 7)).toBe(7);
  });

  it('covers the whole range given enough draws', () => {
    const seen = new Set(Array.from({ length: 400 }, () => randomInt(1, 6)));
    expect(seen.size).toBe(6);
  });

  it('emits colors as hex plus the matching rgb()', () => {
    const value = randomColor();
    const [hex, rgb] = value.split('  ');
    expect(hex).toMatch(/^#[0-9a-f]{6}$/);
    const [r, g, b] = rgb.match(/\d+/g)!.map(Number);
    expect(hex).toBe(
      `#${[r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('')}`,
    );
  });

  it('writes lorem sentences that start capitalised and end with a full stop', () => {
    const text = sentence();
    expect(text[0]).toBe(text[0].toUpperCase());
    expect(text.endsWith('.')).toBe(true);
    expect(text.split(' ').length).toBeGreaterThanOrEqual(8);
  });
});

describe('output decoration', () => {
  it('applies uppercase, braces and quotes in that order', () => {
    expect(decorate('abc', {})).toBe('abc');
    expect(decorate('abc', { upper: true })).toBe('ABC');
    expect(decorate('abc', { braces: true })).toBe('{abc}');
    expect(decorate('abc', { quotes: true })).toBe('"abc",');
    expect(decorate('abc', { upper: true, braces: true, quotes: true })).toBe('"{ABC}",');
  });
});
