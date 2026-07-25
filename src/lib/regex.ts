/** Match collection for the Regex Tester. */

export interface Hit {
  index: number;
  text: string;
  groups: string[];
  named: Record<string, string | undefined>;
}

/** Stops well before a pathological pattern can hang the page. */
export const MAX_HITS = 5000;

/**
 * Runs `re` over `subject`, advancing past zero-length matches so a pattern
 * like `/a*\/g` cannot loop forever.
 */
export function collectMatches(re: RegExp, subject: string, limit = MAX_HITS): Hit[] {
  const hits: Hit[] = [];
  const global = re.global || re.sticky;
  re.lastIndex = 0;

  for (let i = 0; i < limit; i++) {
    const m = re.exec(subject);
    if (!m) break;
    hits.push({
      index: m.index,
      text: m[0],
      groups: m.slice(1).map((g) => g ?? ''),
      named: m.groups ?? {},
    });
    if (!global) break;
    if (m[0] === '') re.lastIndex++;
  }
  return hits;
}

/** Compiles a pattern, returning the error message instead of throwing. */
export function compile(source: string, flags: string): { re: RegExp } | { error: string } {
  try {
    return { re: new RegExp(source, flags) };
  } catch (err) {
    return { error: (err as Error).message };
  }
}

export function replaceAll(re: RegExp, subject: string, replacement: string): string {
  re.lastIndex = 0;
  return subject.replace(re, replacement);
}
