/** Naming-convention conversions and line operations for the Case Converter. */

export const deaccent = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

/** Splits any casing convention into lowercase words. */
export function words(input: string): string[] {
  return input
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean)
    .map((w) => w.toLowerCase());
}

export const upperFirst = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export interface CaseDef {
  name: string;
  hint: string;
  fn: (s: string) => string;
}

export const CASES: CaseDef[] = [
  {
    name: 'camelCase',
    hint: 'JS variables',
    fn: (s) =>
      words(s)
        .map((w, i) => (i ? upperFirst(w) : w))
        .join(''),
  },
  { name: 'PascalCase', hint: 'Classes, types', fn: (s) => words(s).map(upperFirst).join('') },
  { name: 'snake_case', hint: 'Python, SQL', fn: (s) => words(s).join('_') },
  { name: 'CONSTANT_CASE', hint: 'Env vars', fn: (s) => words(s).join('_').toUpperCase() },
  { name: 'kebab-case', hint: 'CSS, CLI flags', fn: (s) => words(s).join('-') },
  { name: 'dot.case', hint: 'Config keys', fn: (s) => words(s).join('.') },
  { name: 'path/case', hint: 'Routes', fn: (s) => words(s).join('/') },
  { name: 'Train-Case', hint: 'HTTP headers', fn: (s) => words(s).map(upperFirst).join('-') },
  { name: 'Title Case', hint: 'Headings', fn: (s) => words(s).map(upperFirst).join(' ') },
  { name: 'Sentence case', hint: 'Prose', fn: (s) => upperFirst(words(s).join(' ')) },
  { name: 'lower case', hint: '', fn: (s) => s.toLowerCase() },
  { name: 'UPPER CASE', hint: '', fn: (s) => s.toUpperCase() },
  {
    name: 'slug',
    hint: 'URLs, filenames',
    fn: (s) =>
      deaccent(s)
        .toLowerCase()
        .replace(/[^\p{L}\p{N}]+/gu, '-')
        .replace(/^-+|-+$/g, ''),
  },
  {
    name: 'aLtErNaTiNg',
    hint: '',
    fn: (s) => [...s].map((c, i) => (i % 2 ? c.toUpperCase() : c.toLowerCase())).join(''),
  },
];

/** Line-oriented operations. Each receives the split lines and the raw text. */
export const LINE_OPS: Record<string, (lines: string[], raw: string) => string> = {
  sort: (l) => l.sort((a, b) => a.localeCompare(b)).join('\n'),
  sortdesc: (l) => l.sort((a, b) => b.localeCompare(a)).join('\n'),
  unique: (l) => [...new Set(l)].join('\n'),
  reverse: (l) => l.reverse().join('\n'),
  shuffle: (l) => {
    for (let i = l.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [l[i], l[j]] = [l[j], l[i]];
    }
    return l.join('\n');
  },
  trim: (l) => l.map((s) => s.trim()).join('\n'),
  dropblank: (l) => l.filter((s) => s.trim()).join('\n'),
  number: (l) =>
    l.map((s, i) => `${String(i + 1).padStart(String(l.length).length, ' ')}. ${s}`).join('\n'),
  reversechars: (_l, raw) => [...raw].reverse().join(''),
  dedupespace: (_l, raw) => raw.replace(/[^\S\n]+/g, ' ').replace(/\n{3,}/g, '\n\n'),
};

export interface CountStats {
  characters: number;
  words: number;
  lines: number;
}

export function countStats(raw: string): CountStats {
  return {
    characters: [...raw].length,
    words: raw.trim() ? raw.trim().split(/\s+/).length : 0,
    lines: raw === '' ? 0 : raw.split('\n').length,
  };
}
