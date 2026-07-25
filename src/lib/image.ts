/** Resize maths for the Image Tools page; the pixels themselves stay on canvas. */

export type ResizeMode = 'none' | 'scale' | 'fit' | 'exact';

export interface Size {
  width: number;
  height: number;
}

export interface ResizeOptions {
  /** Percentage, used by `scale`. */
  scale?: number;
  /** Target box, used by `fit` and `exact`. */
  width?: number;
  height?: number;
}

export const EXTENSIONS: Record<string, string> = {
  'image/webp': 'webp',
  'image/jpeg': 'jpg',
  'image/png': 'png',
};

/** Never returns a zero dimension — a 0×0 canvas throws in some browsers. */
export function targetSize(source: Size, mode: ResizeMode, options: ResizeOptions = {}): Size {
  const { width: w, height: h } = source;
  if (!w || !h) return { width: 0, height: 0 };

  if (mode === 'scale') {
    const factor = (options.scale ?? 100) / 100;
    return { width: Math.max(1, Math.round(w * factor)), height: Math.max(1, Math.round(h * factor)) };
  }

  if (mode === 'fit') {
    const boxW = Math.max(1, options.width || w);
    const boxH = Math.max(1, options.height || h);
    const factor = Math.min(boxW / w, boxH / h);
    return { width: Math.max(1, Math.round(w * factor)), height: Math.max(1, Math.round(h * factor)) };
  }

  if (mode === 'exact') {
    return {
      width: Math.max(1, options.width || w),
      height: Math.max(1, options.height || h),
    };
  }

  return { width: w, height: h };
}

/** Signed size change as a percentage; negative means the file shrank. */
export function sizeDelta(before: number, after: number): number {
  if (!before) return 0;
  return ((after - before) / before) * 100;
}

export function deltaLabel(delta: number): string {
  return delta <= 0 ? `${Math.abs(delta).toFixed(1)}% smaller` : `${delta.toFixed(1)}% larger`;
}
