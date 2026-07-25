import { describe, expect, it } from 'vitest';
import { counts, diff, pairRows, tokenize, unifiedPatch, type Op } from '../src/lib/diff';

const lines = (text: string) => (text === '' ? [] : text.split('\n'));
const shape = (ops: Op<string>[]) => ops.map((o) => `${o.type}:${o.value}`);

describe('line diff', () => {
  it('reports identical input as all equal', () => {
    const ops = diff(lines('a\nb\nc'), lines('a\nb\nc'));
    expect(ops.every((o) => o.type === 'equal')).toBe(true);
    expect(counts(ops)).toEqual({ added: 0, removed: 0, unchanged: 3 });
  });

  it('detects a single inserted line', () => {
    expect(shape(diff(lines('a\nc'), lines('a\nb\nc')))).toEqual(['equal:a', 'ins:b', 'equal:c']);
  });

  it('detects a single deleted line', () => {
    expect(shape(diff(lines('a\nb\nc'), lines('a\nc')))).toEqual(['equal:a', 'del:b', 'equal:c']);
  });

  it('pairs a modified line as a delete plus an insert', () => {
    expect(shape(diff(lines('a\nb'), lines('a\nB')))).toEqual(['equal:a', 'del:b', 'ins:B']);
  });

  it('handles an empty side', () => {
    expect(counts(diff(lines(''), lines('a\nb')))).toEqual({ added: 2, removed: 0, unchanged: 0 });
    expect(counts(diff(lines('a\nb'), lines('')))).toEqual({ added: 0, removed: 2, unchanged: 0 });
    expect(diff([], [])).toEqual([]);
  });

  it('records source indices for every operation', () => {
    const ops = diff(lines('a\nb'), lines('a\nB'));
    expect(ops.map((o) => [o.a, o.b])).toEqual([
      [0, 0],
      [1, -1],
      [-1, 1],
    ]);
  });

  it('finds the longest common subsequence, not just a prefix', () => {
    const ops = diff(lines('a\nb\nc\nd\ne'), lines('a\nx\nc\ny\ne'));
    expect(counts(ops)).toEqual({ added: 2, removed: 2, unchanged: 3 });
  });

  it('honours a normalising key so case or whitespace can be ignored', () => {
    const ci = (s: string) => s.toLowerCase();
    expect(counts(diff(lines('Hello'), lines('HELLO'), ci))).toMatchObject({ unchanged: 1 });
    const ws = (s: string) => s.replace(/\s+/g, ' ').trim();
    expect(counts(diff(lines('a   b'), lines(' a b '), ws))).toMatchObject({ unchanged: 1 });
  });

  it('reports the original text, not the normalised key', () => {
    const [op] = diff(lines('Hello'), lines('HELLO'), (s) => s.toLowerCase());
    expect(op.value).toBe('Hello');
  });

  it('stays fast on large mostly-identical inputs', () => {
    const a = Array.from({ length: 5000 }, (_, i) => `line ${i}`);
    const b = [...a];
    b[2500] = 'changed';
    const started = Date.now();
    expect(counts(diff(a, b))).toEqual({ added: 1, removed: 1, unchanged: 4999 });
    expect(Date.now() - started).toBeLessThan(1000);
  });
});

describe('word tokenising', () => {
  it('keeps words, punctuation and whitespace as separate tokens', () => {
    expect(tokenize('a b, c')).toEqual(['a', ' ', 'b', ',', ' ', 'c']);
  });

  it('rejoins to the original string', () => {
    const line = '  const x = f(y);  ';
    expect(tokenize(line).join('')).toBe(line);
  });

  it('returns nothing for an empty line', () => {
    expect(tokenize('')).toEqual([]);
  });
});

describe('side-by-side rows', () => {
  it('lines a deletion up with its replacement', () => {
    const rows = pairRows(diff(lines('a\nb'), lines('a\nB')));
    expect(rows[1]).toMatchObject({ left: 'b', right: 'B', kind: 'change', leftNo: 2, rightNo: 2 });
  });

  it('leaves a gap when one side has no counterpart', () => {
    const rows = pairRows(diff(lines('a'), lines('a\nb\nc')));
    expect(rows.slice(1)).toEqual([
      { left: null, right: 'b', leftNo: null, rightNo: 2, kind: 'ins' },
      { left: null, right: 'c', leftNo: null, rightNo: 3, kind: 'ins' },
    ]);
  });

  it('numbers unchanged rows on both sides', () => {
    const [row] = pairRows(diff(lines('a\nb'), lines('a\nB')));
    expect(row).toMatchObject({ kind: 'equal', leftNo: 1, rightNo: 1 });
  });
});

describe('unified patch', () => {
  it('says so when there is nothing to report', () => {
    expect(unifiedPatch(diff(lines('a\nb'), lines('a\nb')))).toBe('No differences.');
  });

  it('emits headers, a hunk range and signed lines', () => {
    const patch = unifiedPatch(diff(lines('a\nb\nc'), lines('a\nB\nc')));
    const rows = patch.split('\n');
    expect(rows[0]).toBe('--- original');
    expect(rows[1]).toBe('+++ changed');
    expect(rows[2]).toMatch(/^@@ -1,3 \+1,3 @@$/);
    expect(rows).toContain('-b');
    expect(rows).toContain('+B');
    expect(rows).toContain(' a');
  });

  it('keeps only the requested lines of context', () => {
    const a = Array.from({ length: 30 }, (_, i) => `line ${i}`);
    const b = [...a];
    b[15] = 'changed';
    const patch = unifiedPatch(diff(a, b), 2);
    expect(patch.split('\n').filter((l) => l.startsWith(' '))).toHaveLength(4);
  });

  it('splits distant changes into separate hunks', () => {
    const a = Array.from({ length: 40 }, (_, i) => `line ${i}`);
    const b = [...a];
    b[2] = 'x';
    b[35] = 'y';
    const hunks = unifiedPatch(diff(a, b)).split('\n').filter((l) => l.startsWith('@@'));
    expect(hunks).toHaveLength(2);
  });
});
