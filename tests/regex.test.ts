import { describe, expect, it } from 'vitest';
import { collectMatches, compile, replaceAll } from '../src/lib/regex';

describe('pattern compilation', () => {
  it('returns a usable regex for a valid pattern', () => {
    const result = compile('\\d+', 'g');
    expect('re' in result && result.re.source).toBe('\\d+');
  });

  it('returns the engine message instead of throwing', () => {
    const result = compile('(unclosed', 'g');
    expect('error' in result && result.error).toMatch(/group/i);
  });

  it('rejects flags the engine does not know', () => {
    expect('error' in compile('a', 'q')).toBe(true);
  });
});

describe('match collection', () => {
  const subject = 'ada@example.com and grace+dev@lovelace.io';

  it('finds every match when the global flag is set', () => {
    const hits = collectMatches(/\w+@[\w.]+/g, subject);
    expect(hits.map((h) => h.text)).toEqual(['ada@example.com', 'dev@lovelace.io']);
  });

  it('stops after the first match without the global flag', () => {
    expect(collectMatches(/\w+/, subject)).toHaveLength(1);
  });

  it('records the index of each match', () => {
    const hits = collectMatches(/and/g, subject);
    expect(hits[0].index).toBe(16);
  });

  it('captures numbered groups, using empty strings for optional ones', () => {
    const hits = collectMatches(/(\d{4})-(\d{2})(?:-(\d{2}))?/g, '2024-01-02 and 2025-03');
    expect(hits[0].groups).toEqual(['2024', '01', '02']);
    expect(hits[1].groups).toEqual(['2025', '03', '']);
  });

  it('captures named groups', () => {
    const [hit] = collectMatches(/(?<user>\w+)@(?<domain>[\w.]+)/g, 'ada@example.com');
    expect(hit.named).toEqual({ user: 'ada', domain: 'example.com' });
  });

  it('terminates on a zero-length global match', () => {
    const hits = collectMatches(/a*/g, 'bbb', 100);
    expect(hits.length).toBeLessThanOrEqual(100);
    expect(hits.every((h) => h.text === '')).toBe(true);
  });

  it('honours the hit limit on a pattern that matches everywhere', () => {
    expect(collectMatches(/x?/g, 'x'.repeat(500), 10)).toHaveLength(10);
  });

  it('resets lastIndex so repeated runs agree', () => {
    const re = /\w+/g;
    expect(collectMatches(re, subject)).toEqual(collectMatches(re, subject));
  });

  it('returns nothing when the pattern does not match', () => {
    expect(collectMatches(/zzz/g, subject)).toEqual([]);
  });

  it('respects the sticky flag', () => {
    expect(collectMatches(/\d/y, '12a3').map((h) => h.text)).toEqual(['1', '2']);
  });
});

describe('replacement', () => {
  it('expands numbered and named references', () => {
    expect(replaceAll(/(\w+)@([\w.]+)/g, 'ada@example.com', '$2/$1')).toBe('example.com/ada');
    expect(
      replaceAll(/(?<user>\w+)@(?<domain>[\w.]+)/g, 'ada@example.com', '$<user> at $<domain>'),
    ).toBe('ada at example.com');
  });

  it('supports the whole-match reference', () => {
    expect(replaceAll(/\d+/g, 'a1b22', '[$&]')).toBe('a[1]b[22]');
  });

  it('starts from the beginning even after a previous run', () => {
    const re = /a/g;
    collectMatches(re, 'aaa');
    expect(replaceAll(re, 'aaa', 'b')).toBe('bbb');
  });
});
