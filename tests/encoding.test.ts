import { describe, expect, it } from 'vitest';
import {
  MODE_LABELS,
  chunk,
  decode,
  encode,
  fromBase64,
  inspect,
  rot13,
  toBase64,
  type EncodingMode,
} from '../src/lib/encoding';

const ROUND_TRIP: EncodingMode[] = ['base64', 'base64url', 'hex', 'urlcomponent', 'binary', 'rot13'];

describe('encoder / decoder', () => {
  it('encodes ASCII to the documented representations', () => {
    expect(encode('Hi', 'base64')).toBe('SGk=');
    expect(encode('Hi', 'hex')).toBe('48 69');
    expect(encode('Hi', 'binary')).toBe('01001000 01101001');
    expect(encode('a b', 'urlcomponent')).toBe('a%20b');
  });

  it('uses the URL-safe alphabet without padding for base64url', () => {
    const text = '🙂?~';
    expect(encode(text, 'base64url')).not.toMatch(/[+/=]/);
    expect(decode(encode(text, 'base64url'), 'base64url')).toBe(text);
  });

  it.each(ROUND_TRIP)('round-trips UTF-8 through %s', (mode) => {
    const text = 'Grüße, DevToys! ✨ 日本語 — 100%';
    expect(decode(encode(text, mode), mode)).toBe(text);
  });

  it('treats ROT13 as its own inverse', () => {
    expect(rot13('Hello, World!')).toBe('Uryyb, Jbeyq!');
    expect(rot13(rot13('Hello'))).toBe('Hello');
  });

  it('accepts hex with separators and 0x prefixes', () => {
    expect(decode('48:65-6c 6c 0x6f', 'hex')).toBe('Hello');
  });

  it('rejects malformed hex and binary with an explanation', () => {
    expect(() => decode('abc', 'hex')).toThrow(/even number/);
    expect(() => decode('zz', 'hex')).toThrow(/non-hex/);
    expect(() => decode('0101', 'binary')).toThrow(/multiple of 8/);
  });

  it('rejects base64 that is not valid UTF-8', () => {
    // 0xff is never a legal UTF-8 lead byte.
    expect(() => decode(toBase64(Uint8Array.from([0xff])), 'base64')).toThrow();
  });

  it('tolerates whitespace and missing padding when decoding base64', () => {
    expect(decode('SGVsbG8s\nIHdvcmxk', 'base64')).toBe('Hello, world');
    expect(fromBase64('SGk')).toEqual(Uint8Array.from([72, 105]));
  });

  it('wraps long output at 76 characters', () => {
    const wrapped = chunk('x'.repeat(200));
    expect(wrapped.split('\n').map((l) => l.length)).toEqual([76, 76, 48]);
  });

  it('counts characters, bytes and words separately', () => {
    const stats = inspect('héllo 🙂\nsecond line');
    expect(stats.characters).toBe(19);
    expect(stats.bytes).toBe(23);
    expect(stats.lines).toBe(2);
    expect(stats.words).toBe(4);
    expect(stats.firstBytes.split(' ')).toHaveLength(12);
  });

  it('reports an empty string as zero lines', () => {
    expect(inspect('')).toMatchObject({ characters: 0, bytes: 0, lines: 0, words: 0 });
  });

  it('labels every mode it can encode', () => {
    for (const mode of [...ROUND_TRIP, 'url'] as EncodingMode[]) {
      expect(MODE_LABELS[mode]).toBeTruthy();
    }
  });
});
