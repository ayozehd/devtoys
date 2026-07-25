/** CSV/TSV parsing and column analysis for the CSV Viewer. */

export interface Table {
  headers: string[];
  rows: string[][];
  delimiter: string;
  /** Rows whose column count differs from the header. */
  ragged: number;
}

export interface ColumnStats {
  name: string;
  type: 'number' | 'date' | 'text';
  filled: number;
  empty: number;
  unique: number;
  min: string;
  max: string;
  sum: string;
  mean: string;
}

/** RFC 4180-ish parser: handles quotes, escaped quotes and CRLF. */
export function parseCsv(text: string, delim: string): string[][] {
  const out: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];

    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          quoted = false;
        }
      } else {
        field += c;
      }
      continue;
    }

    if (c === '"' && field === '') {
      quoted = true;
    } else if (c === delim) {
      row.push(field);
      field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      out.push(row);
      row = [];
      field = '';
    } else {
      field += c;
    }
  }

  if (field !== '' || row.length) {
    row.push(field);
    out.push(row);
  }
  return out.filter((r) => r.length > 1 || r[0] !== '');
}

/** Picks whichever candidate separates the first non-empty line the most. */
export function detectDelimiter(text: string): string {
  const line = text.split(/\r?\n/).find((l) => l.trim()) ?? '';
  const candidates = [',', '\t', ';', '|'];
  let best = ',';
  let bestCount = 0;
  for (const c of candidates) {
    const count = line.split(c).length - 1;
    if (count > bestCount) {
      best = c;
      bestCount = count;
    }
  }
  return best;
}

export const isNumeric = (v: string) =>
  v.trim() !== '' && Number.isFinite(Number(v.replace(/,/g, '')));

export const toNumber = (v: string) => Number(v.replace(/,/g, ''));

export const isDateLike = (v: string) => /^\d{4}-\d{2}-\d{2}/.test(v.trim());

/** Parses `text` into a header + rows table, generating names when needed. */
export function readTable(text: string, delimiter = 'auto', hasHeader = true): Table {
  const delim = delimiter === 'auto' ? detectDelimiter(text) : delimiter;
  const parsed = parseCsv(text, delim);
  if (!parsed.length) return { headers: [], rows: [], delimiter: delim, ragged: 0 };

  let headers: string[];
  let rows: string[][];

  if (hasHeader) {
    headers = parsed[0].map((h, i) => h.trim() || `column_${i + 1}`);
    rows = parsed.slice(1);
  } else {
    const width = Math.max(...parsed.map((r) => r.length));
    headers = Array.from({ length: width }, (_, i) => `column_${i + 1}`);
    rows = parsed;
  }

  return {
    headers,
    rows,
    delimiter: delim,
    ragged: rows.filter((r) => r.length !== headers.length).length,
  };
}

export function columnStats(headers: string[], rows: string[][]): ColumnStats[] {
  return headers.map((name, col) => {
    const values = rows.map((r) => (r[col] ?? '').trim());
    const filled = values.filter((v) => v !== '');
    const numbers = filled.filter(isNumeric).map(toNumber);
    const allNumeric = filled.length > 0 && numbers.length === filled.length;
    const allDates = filled.length > 0 && filled.every(isDateLike);

    let min = '—';
    let max = '—';
    let sum = '—';
    let mean = '—';

    if (allNumeric) {
      const total = numbers.reduce((a, b) => a + b, 0);
      min = String(Math.min(...numbers));
      max = String(Math.max(...numbers));
      sum = total.toLocaleString(undefined, { maximumFractionDigits: 4 });
      mean = (total / numbers.length).toLocaleString(undefined, { maximumFractionDigits: 4 });
    } else if (filled.length) {
      const sorted = [...filled].sort((a, b) => a.localeCompare(b));
      min = sorted[0];
      max = sorted[sorted.length - 1];
    }

    return {
      name,
      type: allNumeric ? 'number' : allDates ? 'date' : 'text',
      filled: filled.length,
      empty: values.length - filled.length,
      unique: new Set(filled).size,
      min,
      max,
      sum,
      mean,
    };
  });
}

/** Filters by a case-insensitive substring, then sorts by one column. */
export function viewRows(
  rows: string[][],
  query = '',
  sortCol = -1,
  sortDir: 1 | -1 = 1,
): string[][] {
  const q = query.trim().toLowerCase();
  let visible = rows.filter((r) => !q || r.some((c) => c.toLowerCase().includes(q)));

  if (sortCol >= 0) {
    const numericCol = visible.every((r) => !r[sortCol] || isNumeric(r[sortCol]));
    visible = [...visible].sort((a, b) => {
      const x = a[sortCol] ?? '';
      const y = b[sortCol] ?? '';
      const cmp = numericCol ? toNumber(x || '0') - toNumber(y || '0') : x.localeCompare(y);
      return cmp * sortDir;
    });
  }
  return visible;
}

export function toObjects(headers: string[], rows: string[][]): Record<string, string>[] {
  return rows.map((r) => Object.fromEntries(headers.map((h, i) => [h, r[i] ?? ''])));
}
