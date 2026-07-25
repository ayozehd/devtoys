import { describe, expect, it } from 'vitest';
import {
  algorithmNote,
  decodeJwt,
  decodeSegment,
  expiryStatus,
  formatClaim,
  normalizeToken,
  JwtError,
} from '../src/lib/jwt';

const b64url = (value: unknown) =>
  Buffer.from(JSON.stringify(value))
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

const token = (header: unknown, payload: unknown, signature = 'sig') =>
  `${b64url(header)}.${b64url(payload)}.${signature}`;

const NOW = 1_700_000_000;

describe('JWT decoding', () => {
  it('splits a token into header, payload and signature', () => {
    const jwt = decodeJwt(token({ alg: 'HS256', typ: 'JWT' }, { sub: '42', name: 'Ada' }));
    expect(jwt.header).toEqual({ alg: 'HS256', typ: 'JWT' });
    expect(jwt.payload).toEqual({ sub: '42', name: 'Ada' });
    expect(jwt.signature).toBe('sig');
  });

  it('decodes base64url segments that lack padding', () => {
    expect(decodeSegment(b64url({ a: 1 }))).toEqual({ a: 1 });
  });

  it('handles non-ASCII claims', () => {
    const jwt = decodeJwt(token({ alg: 'none' }, { name: 'Grüße 🙂' }));
    expect(jwt.payload.name).toBe('Grüße 🙂');
  });

  it('strips a Bearer prefix and surrounding whitespace', () => {
    expect(normalizeToken('  Bearer  a.b.c ')).toBe('a.b.c');
    expect(normalizeToken('bearer a.b.c')).toBe('a.b.c');
    expect(() => decodeJwt(` Bearer ${token({ alg: 'HS256' }, { sub: '1' })}`)).not.toThrow();
  });

  it('reports how many parts a malformed token has', () => {
    expect(() => decodeJwt('a.b')).toThrow(JwtError);
    expect(() => decodeJwt('a.b')).toThrow(/three dot-separated parts; this one has 2/);
    expect(() => decodeJwt('a.b.c.d')).toThrow(/has 4/);
  });

  it('names the segment that failed to decode', () => {
    expect(() => decodeJwt(`!!!.${b64url({})}.sig`)).toThrow(/header is not valid/);
    expect(() => decodeJwt(`${b64url({})}.!!!.sig`)).toThrow(/payload is not valid/);
  });

  it('rejects a segment that decodes to something other than JSON', () => {
    const notJson = Buffer.from('plain text').toString('base64url');
    expect(() => decodeJwt(`${notJson}.${b64url({})}.sig`)).toThrow(/header is not valid/);
  });
});

describe('expiry', () => {
  it('flags a token that has expired', () => {
    const status = expiryStatus({ exp: NOW - 3600 }, NOW);
    expect(status).toMatchObject({ state: 'expired', badge: 'badge-danger' });
    expect(status.label).toBe('Expired 1 h ago');
  });

  it('reports remaining life in minutes, then hours', () => {
    expect(expiryStatus({ exp: NOW + 1800 }, NOW).label).toBe('Valid for 30 min');
    expect(expiryStatus({ exp: NOW + 7200 }, NOW).label).toBe('Valid for 2 h');
  });

  it('treats the exact expiry second as expired', () => {
    expect(expiryStatus({ exp: NOW }, NOW).state).toBe('valid');
    expect(expiryStatus({ exp: NOW - 1 }, NOW).state).toBe('expired');
  });

  it('honours nbf for tokens that are not usable yet', () => {
    expect(expiryStatus({ exp: NOW + 3600, nbf: NOW + 60 }, NOW)).toMatchObject({
      state: 'pending',
      label: 'Not valid yet',
    });
  });

  it('says so when there is no exp claim at all', () => {
    expect(expiryStatus({}, NOW)).toMatchObject({ state: 'none', badge: 'badge-attention' });
  });

  it('ignores a non-numeric exp', () => {
    expect(expiryStatus({ exp: 'soon' }, NOW).state).toBe('none');
  });
});

describe('claim presentation', () => {
  it('warns loudly about alg: none', () => {
    expect(algorithmNote({ alg: 'none' })).toMatch(/unsigned and must never be trusted/);
  });

  it('never claims to have verified a signature', () => {
    const note = algorithmNote({ alg: 'RS256' });
    expect(note).toContain('RS256');
    expect(note).toMatch(/not done here/);
  });

  it('expands time claims into a readable date', () => {
    const formatted = formatClaim('iat', NOW);
    expect(formatted).toContain(String(NOW));
    expect(formatted).toContain('2023-11-14T22:13:20.000Z');
  });

  it('joins array claims and serialises objects', () => {
    expect(formatClaim('aud', ['a', 'b'])).toBe('a, b');
    expect(formatClaim('custom', { nested: true })).toBe('{"nested":true}');
    expect(formatClaim('sub', 42)).toBe('42');
  });
});
