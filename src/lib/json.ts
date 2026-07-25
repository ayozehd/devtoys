/** JSON formatting, inspection and path extraction. */

export type Json = null | boolean | number | string | Json[] | { [k: string]: Json };

export function sortDeep(value: Json): Json {
  if (Array.isArray(value)) return value.map(sortDeep);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((k) => [k, sortDeep((value as Record<string, Json>)[k])]),
    );
  }
  return value;
}

/** Turns V8's `position N` into a line/column the user can act on. */
export function locate(text: string, message: string): string {
  const match = /position (\d+)/.exec(message);
  if (!match) return message;
  const pos = Number(match[1]);
  const before = text.slice(0, pos);
  const line = before.split('\n').length;
  const col = pos - before.lastIndexOf('\n');
  return `${message} (line ${line}, column ${col})`;
}

export function typeOf(value: Json): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

export function preview(value: Json): string {
  if (Array.isArray(value)) return `Array(${value.length})`;
  if (value && typeof value === 'object') return `Object{${Object.keys(value).length}}`;
  if (typeof value === 'string') return `"${value}"`;
  return String(value);
}

/** Flattens to `$.a.b[0] = value` lines, capped so huge documents stay usable. */
export function collectPaths(value: Json, path = '$', out: string[] = []): string[] {
  if (out.length > 3000) return out;
  const kind = typeOf(value);
  if (kind === 'array') {
    (value as Json[]).forEach((v, i) => collectPaths(v, `${path}[${i}]`, out));
  } else if (kind === 'object') {
    for (const [k, v] of Object.entries(value as Record<string, Json>)) {
      const seg = /^[A-Za-z_$][\w$]*$/.test(k) ? `.${k}` : `[${JSON.stringify(k)}]`;
      collectPaths(v, `${path}${seg}`, out);
    }
  } else {
    out.push(`${path} = ${preview(value)}`);
  }
  return out;
}

export interface JsonStats {
  nodes: number;
  keys: number;
  arrays: number;
  objects: number;
  maxDepth: number;
}

export function analyse(value: Json): JsonStats {
  let nodes = 0;
  let keys = 0;
  let arrays = 0;
  let objects = 0;
  let maxDepth = 0;

  const walk = (v: Json, depth: number) => {
    nodes++;
    maxDepth = Math.max(maxDepth, depth);
    if (Array.isArray(v)) {
      arrays++;
      v.forEach((child) => walk(child, depth + 1));
    } else if (v && typeof v === 'object') {
      objects++;
      for (const [, child] of Object.entries(v)) {
        keys++;
        walk(child as Json, depth + 1);
      }
    }
  };
  walk(value, 1);
  return { nodes, keys, arrays, objects, maxDepth };
}

/** `indent` is a space count, or `'tab'`; `0` minifies. */
export function format(value: Json, indent: number | 'tab' = 2): string {
  return JSON.stringify(value, null, indent === 'tab' ? '\t' : indent);
}
