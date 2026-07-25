/** Harmony, tonal scale and export generation for the Palette Generator. */

import { BLACK, WHITE, hslToRgb, mix, rgbToHex, rgbToHsl, type RGB } from './color';

export type Harmony = 'complementary' | 'analogous' | 'triadic' | 'tetradic' | 'split' | 'mono';

export const HARMONY_HINTS: Record<Harmony, string> = {
  complementary: 'Opposite hues — maximum separation, great for accents and alerts.',
  analogous: 'Neighbouring hues — calm, cohesive, good for backgrounds.',
  triadic: 'Three evenly spaced hues — vivid but balanced.',
  tetradic: 'Two complementary pairs — rich, needs one dominant colour.',
  split: 'Complement split in two — contrast without the tension.',
  mono: 'One hue, varying saturation and lightness — quiet and safe.',
};

export const SHIFTS: Record<Harmony, number[]> = {
  complementary: [0, 180],
  analogous: [-30, 0, 30],
  triadic: [0, 120, 240],
  tetradic: [0, 90, 180, 270],
  split: [0, 150, 210],
  mono: [0],
};

export const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

export interface Swatch {
  label: string;
  color: RGB;
}

export function harmonyColors(base: RGB, harmony: Harmony): Swatch[] {
  const hsl = rgbToHsl(base);

  if (harmony === 'mono') {
    return [0.85, 0.6, 0.35, 0, 0.25, 0.5].map((amount, i) => ({
      label: i === 3 ? 'base' : i < 3 ? `light ${3 - i}` : `dark ${i - 3}`,
      color: i < 3 ? mix(base, WHITE, amount) : i === 3 ? base : mix(base, BLACK, amount),
    }));
  }

  return SHIFTS[harmony].map((shift) => ({
    label: shift === 0 ? 'base' : `${shift > 0 ? '+' : ''}${shift}°`,
    color: hslToRgb({ ...hsl, h: (hsl.h + shift + 360) % 360 }),
  }));
}

/** Blends toward white/black so the ramp keeps the base hue at step 500. */
export function scaleColors(base: RGB): { step: number; color: RGB }[] {
  return STEPS.map((step) => {
    if (step === 500) return { step, color: base };
    const color =
      step < 500
        ? mix(base, WHITE, ((500 - step) / 500) * 0.95)
        : mix(base, BLACK, ((step - 500) / 450) * 0.82);
    return { step, color };
  });
}

export type ExportFormat = 'css' | 'scss' | 'tailwind' | 'json';

export function exportPalette(
  format: ExportFormat,
  base: RGB,
  scale: { step: number; color: RGB }[],
  harmonies: Swatch[],
): string {
  const hexes = scale.map(({ step, color }) => [String(step), rgbToHex(color)] as const);

  if (format === 'css') {
    return `:root {\n${hexes.map(([k, v]) => `  --brand-${k}: ${v};`).join('\n')}\n\n${harmonies
      .map((h, i) => `  --accent-${i + 1}: ${rgbToHex(h.color)}; /* ${h.label} */`)
      .join('\n')}\n}`;
  }

  if (format === 'scss') {
    return hexes.map(([k, v]) => `$brand-${k}: ${v};`).join('\n');
  }

  if (format === 'tailwind') {
    return `// tailwind.config.js\ncolors: {\n  brand: {\n${hexes
      .map(([k, v]) => `    ${k}: '${v}',`)
      .join('\n')}\n  },\n}`;
  }

  return JSON.stringify(
    {
      base: rgbToHex(base),
      harmony: Object.fromEntries(
        harmonies.map((h, i) => [h.label || `color-${i}`, rgbToHex(h.color)]),
      ),
      scale: Object.fromEntries(hexes),
    },
    null,
    2,
  );
}
