/** Color maths shared by the picker, palette generator and contrast checker. */

export interface RGB {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface HSL {
  h: number;
  s: number;
  l: number;
  a: number;
}

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const round = (value: number, places = 2) => Number(value.toFixed(places));

/* -------------------------------------------------------------------------- */
/* Parsing                                                                     */
/* -------------------------------------------------------------------------- */

const NAMED: Record<string, string> = {
  black: '#000000',
  white: '#ffffff',
  red: '#ff0000',
  green: '#008000',
  blue: '#0000ff',
  yellow: '#ffff00',
  cyan: '#00ffff',
  magenta: '#ff00ff',
  gray: '#808080',
  grey: '#808080',
  orange: '#ffa500',
  purple: '#800080',
  pink: '#ffc0cb',
  brown: '#a52a2a',
  navy: '#000080',
  teal: '#008080',
  olive: '#808000',
  lime: '#00ff00',
  maroon: '#800000',
  silver: '#c0c0c0',
  transparent: '#00000000',
};

/** Parses hex, rgb(), rgba(), hsl(), hsla() and a handful of named colors. */
export function parseColor(input: string): RGB | null {
  const text = input.trim().toLowerCase();
  if (!text) return null;

  const named = NAMED[text];
  if (named) return parseColor(named);

  const hex = text.replace(/^#/, '');
  if (/^[0-9a-f]+$/.test(hex) && [3, 4, 6, 8].includes(hex.length)) {
    const expand = (s: string) => (s.length === 1 ? s + s : s);
    const size = hex.length <= 4 ? 1 : 2;
    const part = (i: number) => parseInt(expand(hex.slice(i * size, i * size + size)), 16);
    return {
      r: part(0),
      g: part(1),
      b: part(2),
      a: hex.length === 4 || hex.length === 8 ? round(part(3) / 255, 3) : 1,
    };
  }

  const rgb = /^rgba?\(([^)]+)\)$/.exec(text);
  if (rgb) {
    const parts = rgb[1].split(/[\s,/]+/).filter(Boolean);
    if (parts.length < 3) return null;
    const channel = (v: string) =>
      v.endsWith('%') ? Math.round((parseFloat(v) / 100) * 255) : Math.round(parseFloat(v));
    return {
      r: clamp(channel(parts[0]), 0, 255),
      g: clamp(channel(parts[1]), 0, 255),
      b: clamp(channel(parts[2]), 0, 255),
      a: parts[3] !== undefined ? clamp(alphaOf(parts[3])) : 1,
    };
  }

  const hsl = /^hsla?\(([^)]+)\)$/.exec(text);
  if (hsl) {
    const parts = hsl[1].split(/[\s,/]+/).filter(Boolean);
    if (parts.length < 3) return null;
    return hslToRgb({
      h: parseFloat(parts[0]),
      s: parseFloat(parts[1]),
      l: parseFloat(parts[2]),
      a: parts[3] !== undefined ? clamp(alphaOf(parts[3])) : 1,
    });
  }

  return null;
}

function alphaOf(value: string): number {
  return value.endsWith('%') ? parseFloat(value) / 100 : parseFloat(value);
}

/* -------------------------------------------------------------------------- */
/* Conversions                                                                 */
/* -------------------------------------------------------------------------- */

export function rgbToHex({ r, g, b, a }: RGB, withAlpha = false): string {
  const hex = (v: number) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0');
  const base = `#${hex(r)}${hex(g)}${hex(b)}`;
  return withAlpha && a < 1 ? `${base}${hex(a * 255)}` : base;
}

export function rgbToHsl({ r, g, b, a }: RGB): HSL {
  const rr = r / 255;
  const gg = g / 255;
  const bb = b / 255;
  const max = Math.max(rr, gg, bb);
  const min = Math.min(rr, gg, bb);
  const delta = max - min;
  const l = (max + min) / 2;

  let h = 0;
  let s = 0;

  if (delta !== 0) {
    s = delta / (1 - Math.abs(2 * l - 1));
    if (max === rr) h = ((gg - bb) / delta) % 6;
    else if (max === gg) h = (bb - rr) / delta + 2;
    else h = (rr - gg) / delta + 4;
    h *= 60;
    if (h < 0) h += 360;
  }

  return { h: round(h, 1), s: round(s * 100, 1), l: round(l * 100, 1), a };
}

export function hslToRgb({ h, s, l, a }: HSL): RGB {
  const hue = ((h % 360) + 360) % 360;
  const sat = clamp(s / 100);
  const light = clamp(l / 100);
  const c = (1 - Math.abs(2 * light - 1)) * sat;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = light - c / 2;

  const [r1, g1, b1] =
    hue < 60
      ? [c, x, 0]
      : hue < 120
        ? [x, c, 0]
        : hue < 180
          ? [0, c, x]
          : hue < 240
            ? [0, x, c]
            : hue < 300
              ? [x, 0, c]
              : [c, 0, x];

  return {
    r: Math.round((r1 + m) * 255),
    g: Math.round((g1 + m) * 255),
    b: Math.round((b1 + m) * 255),
    a,
  };
}

/** CMYK is handy for print-oriented work; derived from plain sRGB. */
export function rgbToCmyk({ r, g, b }: RGB) {
  const rr = r / 255;
  const gg = g / 255;
  const bb = b / 255;
  const k = 1 - Math.max(rr, gg, bb);
  if (k === 1) return { c: 0, m: 0, y: 0, k: 100 };
  return {
    c: round(((1 - rr - k) / (1 - k)) * 100, 1),
    m: round(((1 - gg - k) / (1 - k)) * 100, 1),
    y: round(((1 - bb - k) / (1 - k)) * 100, 1),
    k: round(k * 100, 1),
  };
}

const toLinear = (channel: number) => {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};

/** sRGB → OKLCH, following Björn Ottosson's reference implementation. */
export function rgbToOklch({ r, g, b }: RGB) {
  const lr = toLinear(r);
  const lg = toLinear(g);
  const lb = toLinear(b);

  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);

  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;

  const c = Math.sqrt(A * A + B * B);
  let h = (Math.atan2(B, A) * 180) / Math.PI;
  if (h < 0) h += 360;

  return { l: round(L * 100, 1), c: round(c, 3), h: round(h, 1) };
}

/* -------------------------------------------------------------------------- */
/* Contrast                                                                    */
/* -------------------------------------------------------------------------- */

export function relativeLuminance({ r, g, b }: RGB): number {
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

export function contrastRatio(a: RGB, b: RGB): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/** Flattens a translucent color over a background so contrast stays honest. */
export function flatten(color: RGB, background: RGB): RGB {
  if (color.a >= 1) return color;
  return {
    r: Math.round(color.r * color.a + background.r * (1 - color.a)),
    g: Math.round(color.g * color.a + background.g * (1 - color.a)),
    b: Math.round(color.b * color.a + background.b * (1 - color.a)),
    a: 1,
  };
}

/** Picks black or white text for the best contrast on `background`. */
export function readableOn(background: RGB): string {
  const white = contrastRatio(background, { r: 255, g: 255, b: 255, a: 1 });
  const black = contrastRatio(background, { r: 0, g: 0, b: 0, a: 1 });
  return white >= black ? '#ffffff' : '#000000';
}

/* -------------------------------------------------------------------------- */
/* Formatting                                                                  */
/* -------------------------------------------------------------------------- */

export function formatRgb(rgb: RGB): string {
  return rgb.a < 1
    ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${round(rgb.a, 3)})`
    : `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
}

export function formatHsl(rgb: RGB): string {
  const { h, s, l, a } = rgbToHsl(rgb);
  return a < 1 ? `hsla(${h}, ${s}%, ${l}%, ${round(a, 3)})` : `hsl(${h}, ${s}%, ${l}%)`;
}

export function formatOklch(rgb: RGB): string {
  const { l, c, h } = rgbToOklch(rgb);
  return `oklch(${l}% ${c} ${h})`;
}

/** Mixes two colors in sRGB space; `amount` is the weight of `b`. */
export function mix(a: RGB, b: RGB, amount: number): RGB {
  const t = clamp(amount);
  return {
    r: Math.round(a.r + (b.r - a.r) * t),
    g: Math.round(a.g + (b.g - a.g) * t),
    b: Math.round(a.b + (b.b - a.b) * t),
    a: a.a + (b.a - a.a) * t,
  };
}

export const WHITE: RGB = { r: 255, g: 255, b: 255, a: 1 };
export const BLACK: RGB = { r: 0, g: 0, b: 0, a: 1 };

/** The label/value rows shown by the Color Picker, in display order. */
export function formatRows(color: RGB): [string, string][] {
  const cmyk = rgbToCmyk(color);
  const hsl = rgbToHsl(color);
  return [
    ['HEX', rgbToHex(color).toUpperCase()],
    ['HEX + alpha', rgbToHex(color, true).toUpperCase()],
    ['RGB', formatRgb(color)],
    ['RGBA', `rgba(${color.r}, ${color.g}, ${color.b}, ${Number(color.a.toFixed(3))})`],
    ['HSL', formatHsl(color)],
    ['HSLA', `hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, ${Number(color.a.toFixed(3))})`],
    ['OKLCH', formatOklch(color)],
    ['CMYK', `cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)`],
    ['CSS variable', `--color: ${rgbToHex(color)};`],
    [
      'Swift',
      `UIColor(red: ${(color.r / 255).toFixed(3)}, green: ${(color.g / 255).toFixed(3)}, blue: ${(color.b / 255).toFixed(3)}, alpha: ${color.a})`,
    ],
    ['Android', `Color.parseColor("${rgbToHex(color, true).toUpperCase()}")`],
  ];
}
