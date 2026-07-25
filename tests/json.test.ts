import { describe, expect, it } from 'vitest';
import {
  analyse,
  collectPaths,
  format,
  locate,
  preview,
  sortDeep,
  typeOf,
  type Json,
} from '../src/lib/json';

const DOC: Json = {
  service: 'devtoys',
  replicas: 3,
  enabled: true,
  tags: ['a', 'b'],
  limits: { cpu: '500m' },
  deprecatedAt: null,
};

describe('JSON formatting', () => {
  it('indents with spaces or tabs and minifies at 0', () => {
    expect(format({ a: 1 }, 2)).toBe('{\n  "a": 1\n}');
    expect(format({ a: 1 }, 'tab')).toBe('{\n\t"a": 1\n}');
    expect(format({ a: 1 }, 0)).toBe('{"a":1}');
  });

  it('sorts keys at every depth without reordering arrays', () => {
    const sorted = sortDeep({ b: 1, a: { d: 2, c: [3, 1, 2] } }) as Record<string, Json>;
    expect(Object.keys(sorted)).toEqual(['a', 'b']);
    expect(Object.keys(sorted.a as object)).toEqual(['c', 'd']);
    expect((sorted.a as Record<string, Json>).c).toEqual([3, 1, 2]);
  });

  it('adds a line and column to parser errors that report a position', () => {
    const text = '{\n  "a": 1,\n  bad\n}';
    let message = '';
    try {
      JSON.parse(text);
    } catch (err) {
      message = locate(text, (err as Error).message);
    }
    expect(message).toMatch(/line 3, column \d+/);
  });

  it('leaves errors without a position untouched', () => {
    expect(locate('{}', 'Unexpected end of JSON input')).toBe('Unexpected end of JSON input');
  });
});

describe('JSON inspection', () => {
  it('distinguishes null and arrays from plain objects', () => {
    expect(typeOf(null)).toBe('null');
    expect(typeOf([])).toBe('array');
    expect(typeOf({})).toBe('object');
    expect(typeOf('x')).toBe('string');
    expect(typeOf(1)).toBe('number');
  });

  it('previews containers by size and quotes strings', () => {
    expect(preview([1, 2, 3])).toBe('Array(3)');
    expect(preview({ a: 1 })).toBe('Object{1}');
    expect(preview('hi')).toBe('"hi"');
    expect(preview(null)).toBe('null');
  });

  it('builds dotted paths, bracketing keys that need it', () => {
    const paths = collectPaths({ a: { 'needs-quotes': 1 }, list: [true] });
    expect(paths).toEqual(['$.a["needs-quotes"] = 1', '$.list[0] = true']);
  });

  it('walks the whole document exactly once', () => {
    const stats = analyse(DOC);
    expect(stats).toMatchObject({ objects: 2, arrays: 1, maxDepth: 3 });
    expect(stats.keys).toBe(7);
    expect(stats.nodes).toBe(10);
  });

  it('counts a scalar document as a single node', () => {
    expect(analyse(42)).toMatchObject({ nodes: 1, keys: 0, maxDepth: 1 });
  });

  it('stops collecting paths once the cap is passed', () => {
    const big = Array.from({ length: 5000 }, (_, i) => i);
    expect(collectPaths(big).length).toBeLessThan(5000);
  });
});
