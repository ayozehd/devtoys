import { describe, expect, it } from 'vitest';
import {
  columnStats,
  detectDelimiter,
  isDateLike,
  isNumeric,
  parseCsv,
  readTable,
  toObjects,
  viewRows,
} from '../src/lib/csv';

describe('CSV parsing', () => {
  it('splits plain rows on the given delimiter', () => {
    expect(parseCsv('a,b\n1,2', ',')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ]);
  });

  it('keeps delimiters and newlines that sit inside quotes', () => {
    const rows = parseCsv('name,note\n"Ada","born 1815, London"\n"multi","line\nbreak"', ',');
    expect(rows[1]).toEqual(['Ada', 'born 1815, London']);
    expect(rows[2]).toEqual(['multi', 'line\nbreak']);
  });

  it('unescapes doubled quotes', () => {
    expect(parseCsv('a\n"she said ""hi"""', ',')[1]).toEqual(['she said "hi"']);
  });

  it('handles CRLF the same as LF', () => {
    expect(parseCsv('a,b\r\n1,2\r\n', ',')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ]);
  });

  it('drops trailing blank lines but keeps empty fields', () => {
    expect(parseCsv('a,b\n,\n\n', ',')).toEqual([
      ['a', 'b'],
      ['', ''],
    ]);
  });

  it('detects tabs, semicolons and pipes', () => {
    expect(detectDelimiter('a,b,c\n1,2,3')).toBe(',');
    expect(detectDelimiter('a\tb\tc')).toBe('\t');
    expect(detectDelimiter('a;b;c')).toBe(';');
    expect(detectDelimiter('a|b|c')).toBe('|');
  });

  it('ignores leading blank lines when detecting', () => {
    expect(detectDelimiter('\n\na;b;c')).toBe(';');
  });
});

describe('CSV tables', () => {
  const text = 'name,qty,when\nbolt,10,2024-01-02\nnut,5,2024-03-04\nwasher,,2024-05-06';

  it('uses the first row as headers by default', () => {
    const table = readTable(text);
    expect(table.headers).toEqual(['name', 'qty', 'when']);
    expect(table.rows).toHaveLength(3);
    expect(table.delimiter).toBe(',');
    expect(table.ragged).toBe(0);
  });

  it('generates column names when there is no header row', () => {
    const table = readTable('1,2\n3,4', 'auto', false);
    expect(table.headers).toEqual(['column_1', 'column_2']);
    expect(table.rows).toHaveLength(2);
  });

  it('names blank header cells rather than leaving them empty', () => {
    expect(readTable('a,,c\n1,2,3').headers).toEqual(['a', 'column_2', 'c']);
  });

  it('counts rows whose width does not match the header', () => {
    expect(readTable('a,b\n1,2\n3\n4,5,6').ragged).toBe(2);
  });

  it('returns an empty table for blank input', () => {
    expect(readTable('')).toMatchObject({ headers: [], rows: [] });
  });
});

describe('column analysis', () => {
  const { headers, rows } = readTable(
    'name,qty,when\nbolt,10,2024-01-02\nnut,5,2024-03-04\nwasher,,2024-05-06',
  );
  const stats = columnStats(headers, rows);

  it('classifies text, number and date columns', () => {
    expect(stats.map((s) => s.type)).toEqual(['text', 'number', 'date']);
  });

  it('sums and averages numeric columns, ignoring blanks', () => {
    expect(stats[1]).toMatchObject({ filled: 2, empty: 1, sum: '15', mean: '7.5', min: '5', max: '10' });
  });

  it('uses alphabetical extremes for text columns', () => {
    expect(stats[0]).toMatchObject({ min: 'bolt', max: 'washer', unique: 3 });
  });

  it('treats thousands separators as numbers', () => {
    expect(isNumeric('1,234')).toBe(true);
    expect(isNumeric('12 apples')).toBe(false);
    expect(isNumeric(' ')).toBe(false);
    expect(isDateLike('2024-01-02T10:00')).toBe(true);
    expect(isDateLike('02/01/2024')).toBe(false);
  });

  it('reports no type for an entirely empty column', () => {
    const [only] = columnStats(['x'], [[''], ['']]);
    expect(only).toMatchObject({ type: 'text', filled: 0, empty: 2, min: '—', sum: '—' });
  });
});

describe('grid view', () => {
  const rows = [
    ['bolt', '10'],
    ['nut', '5'],
    ['washer', '100'],
  ];

  it('filters case-insensitively across every cell', () => {
    expect(viewRows(rows, 'NUT')).toEqual([['nut', '5']]);
    expect(viewRows(rows, '100')).toEqual([['washer', '100']]);
    expect(viewRows(rows, '')).toHaveLength(3);
  });

  it('sorts numeric columns numerically, not lexically', () => {
    expect(viewRows(rows, '', 1, 1).map((r) => r[1])).toEqual(['5', '10', '100']);
    expect(viewRows(rows, '', 1, -1).map((r) => r[1])).toEqual(['100', '10', '5']);
  });

  it('sorts text columns alphabetically', () => {
    expect(viewRows(rows, '', 0, 1).map((r) => r[0])).toEqual(['bolt', 'nut', 'washer']);
  });

  it('does not mutate the source rows', () => {
    const source = [...rows];
    viewRows(rows, '', 1, -1);
    expect(rows).toEqual(source);
  });

  it('converts rows to objects for JSON export', () => {
    expect(toObjects(['a', 'b'], [['1', '2'], ['3']])).toEqual([
      { a: '1', b: '2' },
      { a: '3', b: '' },
    ]);
  });
});
