/** URL breakdown and query-string editing. */

export const PART_LABELS: [keyof URL, string][] = [
  ['origin', 'Origin'],
  ['protocol', 'Protocol'],
  ['username', 'Username'],
  ['password', 'Password'],
  ['host', 'Host (with port)'],
  ['hostname', 'Hostname'],
  ['port', 'Port'],
  ['pathname', 'Path'],
  ['search', 'Query string'],
  ['hash', 'Fragment'],
];

/** Parses `raw`, retrying with an https:// prefix so "example.com/x" works. */
export function parseUrl(raw: string): URL {
  const text = raw.trim();
  try {
    return new URL(text);
  } catch {
    return new URL(`https://${text}`);
  }
}

/** `decodeURIComponent` that leaves malformed input alone instead of throwing. */
export function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function pathSegments(url: URL): string[] {
  return url.pathname.split('/').filter(Boolean).map(safeDecode);
}

export function queryParams(url: URL): [string, string][] {
  return [...url.searchParams.entries()];
}

/**
 * Rebuilds a URL from its parsed form plus an edited parameter list.
 * Credentials are preserved and the fragment stays after the query.
 */
export function rebuildUrl(url: URL, params: [string, string][]): string {
  const sp = new URLSearchParams();
  for (const [k, v] of params) {
    if (k) sp.append(k, v);
  }
  const query = sp.toString();
  const credentials = url.username
    ? `${url.username}${url.password ? `:${url.password}` : ''}@`
    : '';
  const base = `${url.protocol}//${credentials}${url.host}${url.pathname}`;
  return `${base}${query ? `?${query}` : ''}${url.hash}`;
}
