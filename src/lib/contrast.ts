/** WCAG verdicts and accessible-pair suggestions for the Contrast Checker. */

import { BLACK, WHITE, contrastRatio, hslToRgb, mix, rgbToHsl, type RGB } from './color';

export const THRESHOLDS: { label: string; aa: number; aaa: number }[] = [
  { label: 'Body text (< 18.66px bold / < 24px)', aa: 4.5, aaa: 7 },
  { label: 'Large text (≥ 18.66px bold / ≥ 24px)', aa: 3, aaa: 4.5 },
  { label: 'UI components & graphics', aa: 3, aaa: 3 },
];

export interface Verdict {
  label: string;
  threshold: number;
  pass: boolean;
}

export function verdicts(ratio: number): Verdict[] {
  return [
    { label: 'AA', threshold: 4.5, pass: ratio >= 4.5 },
    { label: 'AA large', threshold: 3, pass: ratio >= 3 },
    { label: 'AAA', threshold: 7, pass: ratio >= 7 },
    { label: 'AAA large', threshold: 4.5, pass: ratio >= 4.5 },
  ];
}

/**
 * Walks lightness up and down until the pair clears `target`, keeping the hue.
 * Falls back to the best ratio found when nothing reaches the target.
 */
export function findPassing(color: RGB, against: RGB, target = 4.5): RGB {
  const hsl = rgbToHsl(color);
  let best = color;
  let bestRatio = contrastRatio(color, against);

  // Already accessible: leave it exactly as the user chose it.
  if (bestRatio >= target) return color;

  for (let step = 1; step <= 100; step++) {
    for (const direction of [-1, 1]) {
      const l = hsl.l + direction * step;
      if (l < 0 || l > 100) continue;
      const candidate = hslToRgb({ ...hsl, l });
      const ratio = contrastRatio(candidate, against);
      if (ratio >= target) return candidate;
      if (ratio > bestRatio) {
        bestRatio = ratio;
        best = candidate;
      }
    }
  }
  return best;
}

export interface Suggestion {
  label: string;
  fg: RGB;
  bg: RGB;
}

export function suggestions(fg: RGB, bg: RGB): Suggestion[] {
  return [
    { label: 'Darkened text', fg: findPassing(fg, bg, 4.5), bg },
    { label: 'Lightened background', fg, bg: findPassing(bg, fg, 4.5) },
    { label: 'AAA text', fg: findPassing(fg, bg, 7), bg },
    { label: 'Black on background', fg: BLACK, bg },
    { label: 'White on foreground', fg: WHITE, bg: fg },
    { label: 'Tinted surface', fg, bg: mix(bg, fg, 0.08) },
  ];
}

export function ratioBadge(ratio: number): string {
  if (ratio >= 7) return 'badge-success';
  if (ratio >= 4.5) return 'badge-accent';
  if (ratio >= 3) return 'badge-attention';
  return 'badge-danger';
}
