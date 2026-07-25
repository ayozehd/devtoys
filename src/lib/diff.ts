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

/* -------------------------------------------------------------------------- */
/* Presentation                                                                */
/* -------------------------------------------------------------------------- */

export interface Row {
  left: string | null;
  right: string | null;
  leftNo: number | null;
  rightNo: number | null;
  kind: 'equal' | 'change' | 'del' | 'ins';
}

/** Pairs runs of deletions with insertions so they sit on the same row. */
export function pairRows(ops: Op<string>[]): Row[] {
  const rows: Row[] = [];
  let i = 0;

  while (i < ops.length) {
    const op = ops[i];
    if (op.type === 'equal') {
      rows.push({
        left: op.value,
        right: op.value,
        leftNo: op.a + 1,
        rightNo: op.b + 1,
        kind: 'equal',
      });
      i++;
      continue;
    }

    const dels: Op<string>[] = [];
    const ins: Op<string>[] = [];
    while (i < ops.length && ops[i].type === 'del') dels.push(ops[i++]);
    while (i < ops.length && ops[i].type === 'ins') ins.push(ops[i++]);

    const max = Math.max(dels.length, ins.length);
    for (let k = 0; k < max; k++) {
      const d = dels[k];
      const n = ins[k];
      rows.push({
        left: d ? d.value : null,
        right: n ? n.value : null,
        leftNo: d ? d.a + 1 : null,
        rightNo: n ? n.b + 1 : null,
        kind: d && n ? 'change' : d ? 'del' : 'ins',
      });
    }
  }
  return rows;
}

/** Unified diff text with N lines of context, close enough to `diff -u`. */
export function unifiedPatch(ops: Op<string>[], context = 3): string {
  const keep = new Set<number>();
  ops.forEach((op, i) => {
    if (op.type === 'equal') return;
    for (let k = Math.max(0, i - context); k <= Math.min(ops.length - 1, i + context); k++) {
      keep.add(k);
    }
  });

  const lines: string[] = ['--- original', '+++ changed'];
  let i = 0;
  while (i < ops.length) {
    if (!keep.has(i)) {
      i++;
      continue;
    }
    let j = i;
    while (j < ops.length && keep.has(j)) j++;
    const chunk = ops.slice(i, j);
    const aStart = chunk.find((o) => o.a >= 0)?.a ?? 0;
    const bStart = chunk.find((o) => o.b >= 0)?.b ?? 0;
    const aLen = chunk.filter((o) => o.type !== 'ins').length;
    const bLen = chunk.filter((o) => o.type !== 'del').length;
    lines.push(`@@ -${aStart + 1},${aLen} +${bStart + 1},${bLen} @@`);
    for (const op of chunk) {
      lines.push(`${op.type === 'del' ? '-' : op.type === 'ins' ? '+' : ' '}${op.value}`);
    }
    i = j;
  }
  return lines.length > 2 ? lines.join('\n') : 'No differences.';
}

export interface DiffCounts {
  added: number;
  removed: number;
  unchanged: number;
}

export function counts(ops: Op<string>[]): DiffCounts {
  return {
    added: ops.filter((o) => o.type === 'ins').length,
    removed: ops.filter((o) => o.type === 'del').length,
    unchanged: ops.filter((o) => o.type === 'equal').length,
  };
}
