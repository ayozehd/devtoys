/** HTML entity encoding/decoding for the HTML Entities tool. */

export const NAMED: Record<string, string> = {
  '&': 'amp',
  '<': 'lt',
  '>': 'gt',
  '"': 'quot',
  "'": 'apos',
  '\u00a0': 'nbsp',
  '©': 'copy',
  '®': 'reg',
  '™': 'trade',
  '€': 'euro',
  '£': 'pound',
  '¥': 'yen',
  '¢': 'cent',
  '§': 'sect',
  '¶': 'para',
  '†': 'dagger',
  '•': 'bull',
  '…': 'hellip',
  '—': 'mdash',
  '–': 'ndash',
  '‘': 'lsquo',
  '’': 'rsquo',
  '“': 'ldquo',
  '”': 'rdquo',
  '«': 'laquo',
  '»': 'raquo',
  '×': 'times',
  '÷': 'divide',
  '±': 'plusmn',
  '°': 'deg',
  'µ': 'micro',
  '¼': 'frac14',
  '½': 'frac12',
  '¾': 'frac34',
  '←': 'larr',
  '→': 'rarr',
  '↑': 'uarr',
  '↓': 'darr',
  '⇒': 'rArr',
  '∞': 'infin',
  '≠': 'ne',
  '≤': 'le',
  '≥': 'ge',
  '≈': 'asymp',
  '√': 'radic',
  'α': 'alpha',
  'β': 'beta',
  'π': 'pi',
  'Ω': 'Omega',
};

export interface EncodeOptions {
  /** Escape every non-ASCII character, not just the markup-significant ones. */
  all?: boolean;
  /** Prefer `&copy;` over `&#169;` where a named entity exists. */
  named?: boolean;
}

export function encodeEntities(text: string, { all = false, named = true }: EncodeOptions = {}): string {
  return [...text]
    .map((ch) => {
      const code = ch.codePointAt(0)!;
      const name = named ? NAMED[ch] : undefined;
      const mustEscape = ch === '&' || ch === '<' || ch === '>' || ch === '"' || ch === "'";

      if (mustEscape) return name ? `&${name};` : `&#${code};`;
      if (all && code > 126) return name ? `&${name};` : `&#${code};`;
      if (name && code > 126) return `&${name};`;
      return ch;
    })
    .join('');
}

/**
 * Decoding goes through the HTML parser, so every named entity the browser
 * knows works — not just the table above.
 */
export function decodeEntities(text: string): string {
  const doc = new DOMParser().parseFromString(`<!doctype html><body>${text}`, 'text/html');
  return doc.body.textContent ?? '';
}
