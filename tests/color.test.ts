import { describe, expect, it } from 'vitest';
import {
  BLACK,
  WHITE,
  contrastRatio,
  flatten,
  formatHsl,
  formatOklch,
  formatRgb,
  formatRows,
  hslToRgb,
  mix,
  parseColor,
  readableOn,
  relativeLuminance,
  rgbToCmyk,
  rgbToHex,
  rgbToHsl,
  rgbToOklch,
  type RGB,
} from '../src/lib/color';

const BLUE: RGB = { r: 9, g: 105, b: 218, a: 1 };

describe('color parsing', () => {
  it('reads 3, 4, 6 and 8 digit hex', () => {
    expect(parseColor('#0969da')).toEqual({ r: 9, g: 105, b: 218, a: 1 });
    expect(parseColor('#f00')).toEqual({ r: 255, g: 0, b: 0, a: 1 });
    expect(parseColor('#f008')).toMatchObject({ r: 255, g: 0, b: 0 });
    expect(parseColor('#0969da80')!.a).toBeCloseTo(0.502, 2);
  });

  it('does not require the leading hash and ignores case or padding', () => {
    expect(parseColor('  0969DA  ')).toEqual(parseColor('#0969da'));
  });

  it('reads rgb() and rgba() with commas, spaces or slashes', () => {
    expect(parseColor('rgb(9, 105, 218)')).toEqual(BLUE);
    expect(parseColor('rgb(9 105 218)')).toEqual(BLUE);
    expect(parseColor('rgba(9, 105, 218, 0.5)')!.a).toBe(0.5);
    expect(parseColor('rgb(9 105 218 / 50%)')!.a).toBe(0.5);
  });

  it('reads percentage channels', () => {
    expect(parseColor('rgb(100%, 0%, 0%)')).toEqual({ r: 255, g: 0, b: 0, a: 1 });
  });

  it('reads hsl() and hsla()', () => {
    expect(parseColor('hsl(0, 100%, 50%)')).toEqual({ r: 255, g: 0, b: 0, a: 1 });
    expect(parseColor('hsla(120, 100%, 50%, 0.25)')).toEqual({ r: 0, g: 255, b: 0, a: 0.25 });
  });

  it('knows a handful of named colors', () => {
    expect(parseColor('white')).toEqual(WHITE);
    expect(parseColor('BLACK')).toEqual(BLACK);
    expect(parseColor('transparent')!.a).toBe(0);
  });

  it('rejects nonsense instead of guessing', () => {
    expect(parseColor('')).toBeNull();
    expect(parseColor('#12345')).toBeNull();
    expect(parseColor('not-a-color')).toBeNull();
    expect(parseColor('rgb(1, 2)')).toBeNull();
  });

  it('clamps out-of-range channels', () => {
    expect(parseColor('rgb(300, -20, 0)')).toMatchObject({ r: 255, g: 0, b: 0 });
  });
});

describe('conversions', () => {
  it('round-trips RGB → hex → RGB', () => {
    for (const hex of ['#000000', '#ffffff', '#0969da', '#123456']) {
      expect(rgbToHex(parseColor(hex)!)).toBe(hex);
    }
  });

  it('appends the alpha byte only when the color is translucent', () => {
    expect(rgbToHex({ ...BLUE, a: 0.5 }, true)).toBe('#0969da80');
    expect(rgbToHex(BLUE, true)).toBe('#0969da');
  });

  it('round-trips RGB → HSL → RGB within rounding error', () => {
    for (const color of [BLUE, { r: 200, g: 30, b: 90, a: 1 }, { r: 12, g: 240, b: 100, a: 1 }]) {
      const back = hslToRgb(rgbToHsl(color));
      expect(Math.abs(back.r - color.r)).toBeLessThanOrEqual(1);
      expect(Math.abs(back.g - color.g)).toBeLessThanOrEqual(1);
      expect(Math.abs(back.b - color.b)).toBeLessThanOrEqual(1);
    }
  });

  it('reports greys as having no hue or saturation', () => {
    expect(rgbToHsl({ r: 128, g: 128, b: 128, a: 1 })).toMatchObject({ h: 0, s: 0, l: 50.2 });
  });

  it('normalises hue outside 0–360', () => {
    expect(hslToRgb({ h: 480, s: 100, l: 50, a: 1 })).toEqual(hslToRgb({ h: 120, s: 100, l: 50, a: 1 }));
    expect(hslToRgb({ h: -120, s: 100, l: 50, a: 1 })).toEqual(hslToRgb({ h: 240, s: 100, l: 50, a: 1 }));
  });

  it('converts to CMYK, treating black as pure K', () => {
    expect(rgbToCmyk(BLACK)).toEqual({ c: 0, m: 0, y: 0, k: 100 });
    expect(rgbToCmyk(WHITE)).toEqual({ c: 0, m: 0, y: 0, k: 0 });
    expect(rgbToCmyk({ r: 255, g: 0, b: 0, a: 1 })).toEqual({ c: 0, m: 100, y: 100, k: 0 });
  });

  it('converts to OKLCH with the expected anchors', () => {
    expect(rgbToOklch(WHITE)).toMatchObject({ l: 100, c: 0 });
    expect(rgbToOklch(BLACK).l).toBe(0);
    const blue = rgbToOklch(BLUE);
    expect(blue.l).toBeGreaterThan(40);
    expect(blue.h).toBeGreaterThan(240);
    expect(blue.h).toBeLessThan(270);
  });
});

describe('contrast', () => {
  it('anchors relative luminance at 0 and 1', () => {
    expect(relativeLuminance(BLACK)).toBe(0);
    expect(relativeLuminance(WHITE)).toBeCloseTo(1, 5);
  });

  it('gives black on white the maximum 21:1', () => {
    expect(contrastRatio(BLACK, WHITE)).toBeCloseTo(21, 5);
    expect(contrastRatio(WHITE, WHITE)).toBe(1);
  });

  it('is symmetric', () => {
    expect(contrastRatio(BLUE, WHITE)).toBe(contrastRatio(WHITE, BLUE));
  });

  it('matches the WCAG figure for GitHub blue on white', () => {
    expect(contrastRatio(BLUE, WHITE)).toBeCloseTo(5.19, 2);
    expect(contrastRatio({ r: 89, g: 99, b: 110, a: 1 }, WHITE)).toBeCloseTo(6.11, 2);
  });

  it('flattens translucent colors over their backdrop', () => {
    expect(flatten({ r: 0, g: 0, b: 0, a: 0.5 }, WHITE)).toEqual({ r: 128, g: 128, b: 128, a: 1 });
    expect(flatten(BLUE, WHITE)).toBe(BLUE);
  });

  it('picks the more readable of black and white', () => {
    expect(readableOn(WHITE)).toBe('#000000');
    expect(readableOn(BLACK)).toBe('#ffffff');
    expect(readableOn(BLUE)).toBe('#ffffff');
  });
});

describe('formatting and mixing', () => {
  it('omits the alpha channel when the color is opaque', () => {
    expect(formatRgb(BLUE)).toBe('rgb(9, 105, 218)');
    expect(formatRgb({ ...BLUE, a: 0.5 })).toBe('rgba(9, 105, 218, 0.5)');
    expect(formatHsl(BLUE)).toMatch(/^hsl\(/);
    expect(formatHsl({ ...BLUE, a: 0.5 })).toMatch(/^hsla\(/);
    expect(formatOklch(BLUE)).toMatch(/^oklch\(\d/);
  });

  it('mixes proportionally and clamps the amount', () => {
    expect(mix(BLACK, WHITE, 0.5)).toMatchObject({ r: 128, g: 128, b: 128 });
    expect(mix(BLACK, WHITE, 0)).toMatchObject({ r: 0 });
    expect(mix(BLACK, WHITE, 2)).toMatchObject({ r: 255 });
  });

  it('lists every format row the picker shows', () => {
    const rows = formatRows({ ...BLUE, a: 0.5 });
    const byLabel = Object.fromEntries(rows);
    expect(byLabel.HEX).toBe('#0969DA');
    expect(byLabel['HEX + alpha']).toBe('#0969DA80');
    expect(byLabel.RGB).toBe('rgba(9, 105, 218, 0.5)');
    expect(byLabel.CMYK).toMatch(/^cmyk\(/);
    expect(byLabel.Swift).toContain('UIColor(red: 0.035');
    expect(rows).toHaveLength(11);
  });
});
