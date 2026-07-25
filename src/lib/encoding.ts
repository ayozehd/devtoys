/**
 * Text ↔ binary conversions behind the Encoder / Decoder tool.
 *
 * Everything works on UTF-8 bytes, so multi-byte characters survive a
 * round trip through any of the modes.
 */

export type EncodingMode =
  | 'base64'
  | 'base64url'
  | 'hex'
  | 'url'
  | 'urlcomponent'
  | 'binary'
  | 'rot13';

export const MODE_LABELS: Record<EncodingMode, string> = {
  base64: 'Base64',
  base64url: 'Base64 URL-safe',
  hex: 'Hex',
  url: 'URL encoded',
  urlcomponent: 'URL component encoded',
  binary: 'Binary',
  rot13: 'ROT13',
};

const encoder = new TextEncoder();
const decoder = new TextDecoder('utf-8', { fatal: true });

export function toBase64(bytes: Uint8Array): string {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

/** Accepts standard and URL-safe alphabets, with or without padding. */
export function fromBase64(text: string): Uint8Array {
  const clean = text.replace(/\s/g, '').replace(/-/g, '+').replace(/_/g, '/');
  const padded = clean + '='.repeat((4 - (clean.length % 4)) % 4);
  const bin = atob(padded);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

export function rot13(text: string): string {
  return text.replace(/[a-z]/gi, (c) => {
    const base = c <= 'Z' ? 65 : 97;
    return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base);
  });
}

export function encode(text: string, mode: EncodingMode): string {
  const bytes = encoder.encode(text);
  switch (mode) {
    case 'base64':
      return toBase64(bytes);
    case 'base64url':
      return toBase64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    case 'hex':
      return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join(' ');
    case 'url':
      return encodeURI(text);
    case 'urlcomponent':
      return encodeURIComponent(text);
    case 'binary':
      return Array.from(bytes, (b) => b.toString(2).padStart(8, '0')).join(' ');
    case 'rot13':
      return rot13(text);
    default:
      return text;
  }
}

export function decode(text: string, mode: EncodingMode): string {
  switch (mode) {
    case 'base64':
    case 'base64url':
      return decoder.decode(fromBase64(text));
    case 'hex': {
      const clean = text.replace(/(0x|[\s,:-])/gi, '');
      if (clean.length % 2) throw new Error('Hex input needs an even number of digits.');
      if (/[^0-9a-f]/i.test(clean)) throw new Error('Hex input contains non-hex characters.');
      const bytes = new Uint8Array(clean.length / 2);
      for (let i = 0; i < bytes.length; i++) {
        bytes[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
      }
      return decoder.decode(bytes);
    }
    case 'url':
      return decodeURI(text);
    case 'urlcomponent':
      return decodeURIComponent(text);
    case 'binary': {
      const bits = text.replace(/[^01]/g, '');
      if (bits.length % 8) throw new Error('Binary input needs a multiple of 8 bits.');
      const bytes = new Uint8Array(bits.length / 8);
      for (let i = 0; i < bytes.length; i++) {
        bytes[i] = parseInt(bits.slice(i * 8, i * 8 + 8), 2);
      }
      return decoder.decode(bytes);
    }
    case 'rot13':
      return rot13(text);
    default:
      return text;
  }
}

/** Wraps long output at 76 characters, the MIME base64 convention. */
export function chunk(text: string, size = 76): string {
  return text.replace(new RegExp(`(.{${size}})`, 'g'), '$1\n');
}

export interface TextStats {
  characters: number;
  bytes: number;
  lines: number;
  words: number;
  base64Size: number;
  firstBytes: string;
}

export function inspect(text: string): TextStats {
  const bytes = encoder.encode(text);
  return {
    characters: [...text].length,
    bytes: bytes.length,
    lines: text === '' ? 0 : text.split('\n').length,
    words: text.trim() ? text.trim().split(/\s+/).length : 0,
    base64Size: Math.ceil(bytes.length / 3) * 4,
    firstBytes: Array.from(bytes.slice(0, 12), (b) => b.toString(16).padStart(2, '0')).join(' '),
  };
}
