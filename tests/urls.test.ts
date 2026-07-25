import { describe, expect, it } from 'vitest';
import { PART_LABELS, parseUrl, pathSegments, queryParams, rebuildUrl, safeDecode } from '../src/lib/urls';

describe('URL parsing', () => {
  it('breaks a full URL into its components', () => {
    const url = parseUrl('https://user:pw@example.com:8443/a/b?x=1&y=2#frag');
    expect(url.protocol).toBe('https:');
    expect(url.username).toBe('user');
    expect(url.password).toBe('pw');
    expect(url.hostname).toBe('example.com');
    expect(url.port).toBe('8443');
    expect(url.pathname).toBe('/a/b');
    expect(url.search).toBe('?x=1&y=2');
    expect(url.hash).toBe('#frag');
  });

  it('assumes https when no scheme is given', () => {
    expect(parseUrl('example.com/path').href).toBe('https://example.com/path');
  });

  it('keeps non-http schemes intact', () => {
    expect(parseUrl('ftp://files.example.com/pub').protocol).toBe('ftp:');
    expect(parseUrl('mailto:ada@example.com').protocol).toBe('mailto:');
  });

  it('throws on input that cannot be a URL either way', () => {
    expect(() => parseUrl('foo bar')).toThrow();
    expect(() => parseUrl('://x')).toThrow();
  });

  it('labels every part the UI shows', () => {
    expect(PART_LABELS.map(([key]) => key)).toContain('origin');
    expect(PART_LABELS).toHaveLength(10);
  });
});

describe('path segments', () => {
  it('drops empty segments and percent-decodes the rest', () => {
    expect(pathSegments(parseUrl('https://e.com//a//b%20c/'))).toEqual(['a', 'b c']);
  });

  it('returns nothing for a root path', () => {
    expect(pathSegments(parseUrl('https://e.com/'))).toEqual([]);
  });

  it('leaves malformed escapes alone instead of throwing', () => {
    expect(safeDecode('100%')).toBe('100%');
    expect(safeDecode('a%2Fb')).toBe('a/b');
  });
});

describe('query strings', () => {
  it('reads repeated keys as separate entries', () => {
    expect(queryParams(parseUrl('https://e.com?tag=a&tag=b&q='))).toEqual([
      ['tag', 'a'],
      ['tag', 'b'],
      ['q', ''],
    ]);
  });

  it('decodes values on the way in and re-encodes on the way out', () => {
    const url = parseUrl('https://e.com/s?q=hello%20world');
    expect(queryParams(url)).toEqual([['q', 'hello world']]);
    expect(rebuildUrl(url, queryParams(url))).toBe('https://e.com/s?q=hello+world');
  });

  it('rebuilds without a question mark when every parameter is gone', () => {
    const url = parseUrl('https://e.com/p?a=1#top');
    expect(rebuildUrl(url, [])).toBe('https://e.com/p#top');
  });

  it('skips parameters whose name was cleared', () => {
    const url = parseUrl('https://e.com/p');
    expect(rebuildUrl(url, [['', 'orphan'], ['keep', '1']])).toBe('https://e.com/p?keep=1');
  });

  it('preserves credentials, port and fragment', () => {
    const url = parseUrl('https://user:pw@e.com:8443/p?a=1#frag');
    expect(rebuildUrl(url, [['a', '2']])).toBe('https://user:pw@e.com:8443/p?a=2#frag');
  });

  it('keeps a username that has no password', () => {
    const url = parseUrl('https://user@e.com/p');
    expect(rebuildUrl(url, [])).toBe('https://user@e.com/p');
  });

  it('escapes characters that need it', () => {
    const url = parseUrl('https://e.com/p');
    expect(rebuildUrl(url, [['redirect', 'https://x.example/?a=b&c=d']])).toContain(
      'redirect=https%3A%2F%2Fx.example%2F%3Fa%3Db%26c%3Dd',
    );
  });
});
