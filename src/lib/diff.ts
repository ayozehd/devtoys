/** Minimal LCS diff used by the Text Diff tool. */

export type OpType = 'equal' | 'del' | 'ins';

export interface Op<T> {
  type: OpType;
  value: T;
  /** Index in the left sequence, or -1 for insertions. */
  a: number;
  /** Index in the right sequence, or -1 for deletions. */
  b: number;
}

/** Cells of the LCS table we are willing to allocate before degrading. */
const MAX_CELLS = 4_000_000;

/**
 * Diffs two sequences. `key` maps an item to the string used for equality,
 * which lets callers ignore case or whitespace without mutating the output.
 */
export function diff<T>(a: T[], b: T[], key: (item: T) => string = String): Op<T>[] {
  const ka = a.map(key);
  const kb = b.map(key);

  // Trim the common head and tail — most real diffs are mostly identical.
  let head = 0;
  while (head < ka.length && head < kb.length && ka[head] === kb[head]) head++;

  let tail = 0;
  while (
    tail < ka.length - head &&
    tail < kb.length - head &&
    ka[ka.length - 1 - tail] === kb[kb.length - 1 - tail]
  ) {
    tail++;
  }

  const ops: Op<T>[] = [];
  for (let i = 0; i < head; i++) ops.push({ type: 'equal', value: a[i], a: i, b: i });

  const midA = ka.slice(head, ka.length - tail);
  const midB = kb.slice(head, kb.length - tail);
  ops.push(...core(midA, midB, a, b, head));

  for (let i = 0; i < tail; i++) {
    const ai = ka.length - tail + i;
    const bi = kb.length - tail + i;
    ops.push({ type: 'equal', value: a[ai], a: ai, b: bi });
  }

  return ops;
}

function core<T>(ka: string[], kb: string[], a: T[], b: T[], offset: number): Op<T>[] {
  const n = ka.length;
  const m = kb.length;

  if (n === 0 && m === 0) return [];

  // Degenerate or oversized cases: emit a plain delete-then-insert block.
  if (n === 0 || m === 0 || n * m > MAX_CELLS) {
    return [
      ...ka.map((_, i) => ({ type: 'del' as const, value: a[offset + i], a: offset + i, b: -1 })),
      ...kb.map((_, i) => ({ type: 'ins' as const, value: b[offset + i], a: -1, b: offset + i })),
    ];
  }

  // Classic LCS length table.
  const width = m + 1;
  const table = new Uint32Array((n + 1) * width);
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      table[i * width + j] =
        ka[i] === kb[j]
          ? table[(i + 1) * width + (j + 1)] + 1
          : Math.max(table[(i + 1) * width + j], table[i * width + (j + 1)]);
    }
  }

  const ops: Op<T>[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (ka[i] === kb[j]) {
      ops.push({ type: 'equal', value: a[offset + i], a: offset + i, b: offset + j });
      i++;
      j++;
    } else if (table[(i + 1) * width + j] >= table[i * width + (j + 1)]) {
      ops.push({ type: 'del', value: a[offset + i], a: offset + i, b: -1 });
      i++;
    } else {
      ops.push({ type: 'ins', value: b[offset + j], a: -1, b: offset + j });
      j++;
    }
  }
  while (i < n) {
    ops.push({ type: 'del', value: a[offset + i], a: offset + i, b: -1 });
    i++;
  }
  while (j < m) {
    ops.push({ type: 'ins', value: b[offset + j], a: -1, b: offset + j });
    j++;
  }

  return ops;
}

/** Splits a line into word-ish tokens so changed lines can be highlighted inline. */
export function tokenize(line: string): string[] {
  return line.match(/\s+|\w+|[^\s\w]/g) ?? [];
}
