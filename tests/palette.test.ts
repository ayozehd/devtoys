import { describe, expect, it } from 'vitest';
import { rgbToHex, rgbToHsl, type RGB } from '../src/lib/color';
import {
  HARMONY_HINTS,
  SHIFTS,
  STEPS,
  exportPalette,
  harmonyColors,
  scaleColors,
  type Harmony,
} from '../src/lib/palette';

const BASE: RGB = { r: 9, g: 105, b: 218, a: 1 };
const HARMONIES = Object.keys(SHIFTS) as Harmony[];

describe('harmonies', () => {
  it('rotates the hue by the documented angles', () => {
    const hue = rgbToHsl(BASE).h;
    const colors = harmonyColors(BASE, 'triadic');
    expect(colors.map((c) => c.label)).toEqual(['base', '+120°', '+240°']);
    expect(colors.map((c) => Math.round(rgbToHsl(c.color).h))).toEqual([
      Math.round(hue),
      Math.round((hue + 120) % 360),
      Math.round((hue + 240) % 360),
    ]);
  });

  it('wraps negative shifts back into range', () => {
    const [first] = harmonyColors({ r: 255, g: 0, b: 0, a: 1 }, 'analogous');
    expect(rgbToHsl(first.color).h).toBeGreaterThanOrEqual(0);
    expect(rgbToHsl(first.color).h).toBeLessThan(360);
  });

  it('keeps the base colour untouched in every harmony', () => {
    for (const harmony of HARMONIES) {
      const base = harmonyColors(BASE, harmony).find((c) => c.label === 'base')!;
      expect(rgbToHex(base.color)).toBe(rgbToHex(BASE));
    }
  });

  it('builds a light-to-dark ramp for the monochrome harmony', () => {
    const mono = harmonyColors(BASE, 'mono');
    expect(mono.map((c) => c.label)).toEqual(['light 3', 'light 2', 'light 1', 'base', 'dark 1', 'dark 2']);
    const luminance = mono.map((c) => c.color.r + c.color.g + c.color.b);
    expect([...luminance].sort((a, b) => b - a)).toEqual(luminance);
  });

  it('returns the documented number of swatches', () => {
    expect(HARMONIES.map((h) => harmonyColors(BASE, h).length)).toEqual([2, 3, 3, 4, 3, 6]);
  });

  it('has a hint for every harmony', () => {
    for (const harmony of HARMONIES) expect(HARMONY_HINTS[harmony]).toBeTruthy();
  });
});

describe('tonal scale', () => {
  const scale = scaleColors(BASE);

  it('covers every documented step', () => {
    expect(scale.map((s) => s.step)).toEqual(STEPS);
  });

  it('anchors step 500 to the base colour', () => {
    expect(rgbToHex(scale.find((s) => s.step === 500)!.color)).toBe(rgbToHex(BASE));
  });

  it('gets monotonically darker as the step rises', () => {
    const brightness = scale.map(({ color }) => color.r + color.g + color.b);
    expect([...brightness].sort((a, b) => b - a)).toEqual(brightness);
  });

  it('stays inside the sRGB gamut', () => {
    for (const { color } of scale) {
      for (const channel of [color.r, color.g, color.b]) {
        expect(channel).toBeGreaterThanOrEqual(0);
        expect(channel).toBeLessThanOrEqual(255);
      }
    }
  });
});

describe('exports', () => {
  const scale = scaleColors(BASE);
  const harmonies = harmonyColors(BASE, 'complementary');

  it('writes CSS custom properties for the scale and the accents', () => {
    const css = exportPalette('css', BASE, scale, harmonies);
    expect(css).toMatch(/^:root \{/);
    expect(css).toContain('--brand-500: #0969da;');
    expect(css).toContain('--accent-1: #0969da; /* base */');
    expect(css.trim().endsWith('}')).toBe(true);
  });

  it('writes SCSS variables', () => {
    expect(exportPalette('scss', BASE, scale, harmonies).split('\n')).toHaveLength(STEPS.length);
    expect(exportPalette('scss', BASE, scale, harmonies)).toContain('$brand-50: #');
  });

  it('writes a Tailwind colour object', () => {
    const tw = exportPalette('tailwind', BASE, scale, harmonies);
    expect(tw).toContain('brand: {');
    expect(tw).toContain("500: '#0969da',");
  });

  it('writes valid JSON with base, harmony and scale sections', () => {
    const json = JSON.parse(exportPalette('json', BASE, scale, harmonies));
    expect(json.base).toBe('#0969da');
    expect(json.scale['950']).toMatch(/^#[0-9a-f]{6}$/);
    expect(Object.keys(json.scale)).toHaveLength(STEPS.length);
    expect(json.harmony.base).toBe('#0969da');
  });
});
