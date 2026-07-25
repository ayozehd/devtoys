import { describe, expect, it } from 'vitest';
import { CASES, LINE_OPS, countStats, deaccent, upperFirst, words } from '../src/lib/text-case';

const convert = (name: string, input: string) => CASES.find((c) => c.name === name)!.fn(input);

describe('word splitting', () => {
  it('splits camelCase and PascalCase', () => {
    expect(words('helloWorldAgain')).toEqual(['hello', 'world', 'again']);
    expect(words('HelloWorld')).toEqual(['hello', 'world']);
  });

  it('keeps acronyms together but separates the next word', () => {
    expect(words('parseHTMLDocument')).toEqual(['parse', 'html', 'document']);
    expect(words('XMLHttpRequest')).toEqual(['xml', 'http', 'request']);
  });

  it('splits on any separator and drops empties', () => {
    expect(words('hello-world_again.now/here')).toEqual(['hello', 'world', 'again', 'now', 'here']);
    expect(words('  double   spaces  ')).toEqual(['double', 'spaces']);
    expect(words('')).toEqual([]);
  });

  it('keeps digits attached to the word they follow', () => {
    expect(words('version2Beta')).toEqual(['version2', 'beta']);
  });

  it('keeps non-Latin letters', () => {
    expect(words('cañón Grüße')).toEqual(['cañón', 'grüße']);
  });
});

describe('case conversions', () => {
  const input = 'hello world again';

  it.each([
    ['camelCase', 'helloWorldAgain'],
    ['PascalCase', 'HelloWorldAgain'],
    ['snake_case', 'hello_world_again'],
    ['CONSTANT_CASE', 'HELLO_WORLD_AGAIN'],
    ['kebab-case', 'hello-world-again'],
    ['dot.case', 'hello.world.again'],
    ['path/case', 'hello/world/again'],
    ['Train-Case', 'Hello-World-Again'],
    ['Title Case', 'Hello World Again'],
    ['Sentence case', 'Hello world again'],
  ])('converts to %s', (name, expected) => {
    expect(convert(name, input)).toBe(expected);
  });

  it('round-trips between conventions', () => {
    expect(convert('camelCase', convert('snake_case', 'Hello World'))).toBe('helloWorld');
    expect(convert('kebab-case', 'someHTTPServer')).toBe('some-http-server');
  });

  it('slugifies accents and punctuation', () => {
    expect(convert('slug', 'Café Münster — 2024!')).toBe('cafe-munster-2024');
    expect(convert('slug', '  leading and trailing  ')).toBe('leading-and-trailing');
  });

  it('alternates case character by character, including spaces', () => {
    expect(convert('aLtErNaTiNg', 'abcdef')).toBe('aBcDeF');
  });

  it('returns an empty string for empty input', () => {
    for (const { fn } of CASES) expect(fn('')).toBe('');
  });

  it('strips combining marks without touching plain ASCII', () => {
    expect(deaccent('Crème Brûlée')).toBe('Creme Brulee');
    expect(deaccent('plain')).toBe('plain');
    expect(upperFirst('word')).toBe('Word');
    expect(upperFirst('')).toBe('');
  });
});

describe('line operations', () => {
  const lines = ['pear', 'apple', 'pear', '', ' fig '];
  const run = (op: string, input = lines) => LINE_OPS[op]([...input], input.join('\n'));

  it('sorts ascending and descending', () => {
    expect(run('sort').split('\n')).toEqual(['', ' fig ', 'apple', 'pear', 'pear']);
    expect(run('sortdesc').split('\n')[0]).toBe('pear');
  });

  it('removes duplicates while keeping the first occurrence order', () => {
    expect(run('unique').split('\n')).toEqual(['pear', 'apple', '', ' fig ']);
  });

  it('reverses, trims and drops blanks', () => {
    expect(run('reverse').split('\n')[0]).toBe(' fig ');
    expect(run('trim').split('\n')[4]).toBe('fig');
    expect(run('dropblank').split('\n')).toHaveLength(4);
  });

  it('numbers lines with right-aligned padding', () => {
    const numbered = LINE_OPS.number(
      Array.from({ length: 10 }, (_, i) => `line${i}`),
      '',
    ).split('\n');
    expect(numbered[0]).toBe(' 1. line0');
    expect(numbered[9]).toBe('10. line9');
  });

  it('reverses characters across the whole text', () => {
    expect(LINE_OPS.reversechars([], 'abc')).toBe('cba');
  });

  it('collapses runs of spaces but keeps single newlines', () => {
    expect(LINE_OPS.dedupespace([], 'a   b\n\n\n\nc')).toBe('a b\n\nc');
  });

  it('keeps every line when shuffling', () => {
    const shuffled = run('shuffle').split('\n');
    expect(shuffled.sort()).toEqual([...lines].sort());
  });
});

describe('counters', () => {
  it('counts code points, words and lines', () => {
    expect(countStats('one two\nthree 🙂')).toEqual({ characters: 15, words: 4, lines: 2 });
  });

  it('reports zeroes for empty input and ignores stray whitespace', () => {
    expect(countStats('')).toEqual({ characters: 0, words: 0, lines: 0 });
    expect(countStats('   ')).toMatchObject({ words: 0, lines: 1 });
  });
});
