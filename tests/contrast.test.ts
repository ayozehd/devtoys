import { describe, expect, it } from 'vitest';
import { BLACK, WHITE, contrastRatio, rgbToHsl, type RGB } from '../src/lib/color';
import { THRESHOLDS, findPassing, ratioBadge, suggestions, verdicts } from '../src/lib/contrast';

const GREY: RGB = { r: 150, g: 150, b: 150, a: 1 };

describe('WCAG verdicts', () => {
  it('applies the AA and AAA thresholds', () => {
    const byLabel = (ratio: number) =>
      Object.fromEntries(verdicts(ratio).map((v) => [v.label, v.pass]));

    expect(byLabel(21)).toEqual({ AA: true, 'AA large': true, AAA: true, 'AAA large': true });
    expect(byLabel(4.5)).toMatchObject({ AA: true, AAA: false });
    expect(byLabel(4.49)).toMatchObject({ AA: false, 'AA large': true });
    expect(byLabel(2.9)).toEqual({ AA: false, 'AA large': false, AAA: false, 'AAA large': false });
  });

  it('passes exactly at the threshold, not just above it', () => {
    expect(verdicts(7).find((v) => v.label === 'AAA')!.pass).toBe(true);
    expect(verdicts(6.999).find((v) => v.label === 'AAA')!.pass).toBe(false);
  });

  it('publishes a threshold table for the three content sizes', () => {
    expect(THRESHOLDS.map((t) => [t.aa, t.aaa])).toEqual([
      [4.5, 7],
      [3, 4.5],
      [3, 3],
    ]);
  });

  it('grades a ratio into the badge the UI uses', () => {
    expect(ratioBadge(8)).toBe('badge-success');
    expect(ratioBadge(5)).toBe('badge-accent');
    expect(ratioBadge(3.5)).toBe('badge-attention');
    expect(ratioBadge(2)).toBe('badge-danger');
  });
});

describe('finding an accessible colour', () => {
  it('reaches the requested ratio', () => {
    const fixed = findPassing(GREY, WHITE, 4.5);
    expect(contrastRatio(fixed, WHITE)).toBeGreaterThanOrEqual(4.5);
  });

  it('can reach AAA when asked', () => {
    const fixed = findPassing(GREY, WHITE, 7);
    expect(contrastRatio(fixed, WHITE)).toBeGreaterThanOrEqual(7);
  });

  it('keeps the hue and saturation, changing only lightness', () => {
    const source: RGB = { r: 235, g: 120, b: 120, a: 1 };
    const fixed = findPassing(source, WHITE, 4.5);
    expect(Math.round(rgbToHsl(fixed).h)).toBe(Math.round(rgbToHsl(source).h));
    expect(rgbToHsl(fixed).l).not.toBe(rgbToHsl(source).l);
  });

  it('leaves a pair that already passes alone', () => {
    const already = findPassing(BLACK, WHITE, 4.5);
    expect(already).toEqual(BLACK);
  });

  it('darkens against a light background and lightens against a dark one', () => {
    const dark: RGB = { r: 60, g: 60, b: 60, a: 1 };
    expect(rgbToHsl(findPassing(GREY, WHITE, 4.5)).l).toBeLessThan(rgbToHsl(GREY).l);
    expect(rgbToHsl(findPassing(dark, BLACK, 4.5)).l).toBeGreaterThan(rgbToHsl(dark).l);
  });

  it('returns the best it found when the target is unreachable', () => {
    // Nothing can reach 21:1 against mid-grey.
    const best = findPassing(GREY, GREY, 21);
    expect(contrastRatio(best, GREY)).toBeGreaterThan(1);
    expect(contrastRatio(best, GREY)).toBeLessThan(21);
  });
});

describe('suggestions', () => {
  const options = suggestions(GREY, WHITE);

  it('offers one option per documented strategy', () => {
    expect(options.map((o) => o.label)).toEqual([
      'Darkened text',
      'Lightened background',
      'AAA text',
      'Black on background',
      'White on foreground',
      'Tinted surface',
    ]);
  });

  it('improves on the original pair for the accessibility-focused options', () => {
    const original = contrastRatio(GREY, WHITE);
    for (const label of ['Darkened text', 'Lightened background', 'AAA text', 'Black on background']) {
      const option = options.find((o) => o.label === label)!;
      expect(contrastRatio(option.fg, option.bg)).toBeGreaterThan(original);
    }
  });

  it('meets AA on the options that promise it', () => {
    for (const label of ['Darkened text', 'Lightened background', 'AAA text']) {
      const option = options.find((o) => o.label === label)!;
      expect(contrastRatio(option.fg, option.bg)).toBeGreaterThanOrEqual(4.5);
    }
    const aaa = options.find((o) => o.label === 'AAA text')!;
    expect(contrastRatio(aaa.fg, aaa.bg)).toBeGreaterThanOrEqual(7);
  });

  it('returns opaque colours the UI can render directly', () => {
    for (const { fg, bg } of options) {
      expect(fg.a).toBe(1);
      expect(bg.a).toBe(1);
    }
  });
});
