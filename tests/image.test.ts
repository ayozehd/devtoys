import { describe, expect, it } from 'vitest';
import { EXTENSIONS, deltaLabel, sizeDelta, targetSize } from '../src/lib/image';

const SOURCE = { width: 1600, height: 900 };

describe('resize maths', () => {
  it('leaves the image alone in "none" mode', () => {
    expect(targetSize(SOURCE, 'none')).toEqual(SOURCE);
  });

  it('scales by a percentage', () => {
    expect(targetSize(SOURCE, 'scale', { scale: 50 })).toEqual({ width: 800, height: 450 });
    expect(targetSize(SOURCE, 'scale', { scale: 200 })).toEqual({ width: 3200, height: 1800 });
  });

  it('rounds scaled dimensions to whole pixels', () => {
    expect(targetSize({ width: 101, height: 33 }, 'scale', { scale: 33 })).toEqual({
      width: 33,
      height: 11,
    });
  });

  it('never scales below one pixel', () => {
    expect(targetSize(SOURCE, 'scale', { scale: 0.01 })).toEqual({ width: 1, height: 1 });
  });

  it('fits inside a box while preserving the aspect ratio', () => {
    const fitted = targetSize(SOURCE, 'fit', { width: 800, height: 800 });
    expect(fitted).toEqual({ width: 800, height: 450 });
    expect(fitted.width / fitted.height).toBeCloseTo(SOURCE.width / SOURCE.height, 2);
  });

  it('fits against whichever edge is tighter', () => {
    expect(targetSize(SOURCE, 'fit', { width: 4000, height: 450 })).toEqual({ width: 800, height: 450 });
  });

  it('enlarges when the box is bigger than the source', () => {
    expect(targetSize(SOURCE, 'fit', { width: 3200, height: 3200 })).toEqual({
      width: 3200,
      height: 1800,
    });
  });

  it('ignores the aspect ratio in "exact" mode', () => {
    expect(targetSize(SOURCE, 'exact', { width: 300, height: 300 })).toEqual({
      width: 300,
      height: 300,
    });
  });

  it('falls back to the source dimension when a field is blank', () => {
    expect(targetSize(SOURCE, 'exact', { width: 0, height: 400 })).toEqual({
      width: 1600,
      height: 400,
    });
    expect(targetSize(SOURCE, 'fit', {})).toEqual(SOURCE);
  });

  it('returns zeroes when there is no source image yet', () => {
    expect(targetSize({ width: 0, height: 0 }, 'scale', { scale: 50 })).toEqual({
      width: 0,
      height: 0,
    });
  });
});

describe('size reporting', () => {
  it('reports a shrink as a negative percentage', () => {
    expect(sizeDelta(1000, 250)).toBe(-75);
    expect(deltaLabel(sizeDelta(1000, 250))).toBe('75.0% smaller');
  });

  it('reports growth as a positive percentage', () => {
    expect(sizeDelta(1000, 1500)).toBe(50);
    expect(deltaLabel(sizeDelta(1000, 1500))).toBe('50.0% larger');
  });

  it('calls an unchanged size "smaller" rather than dividing by zero', () => {
    expect(deltaLabel(sizeDelta(1000, 1000))).toBe('0.0% smaller');
    expect(sizeDelta(0, 500)).toBe(0);
  });

  it('maps each output MIME type to a file extension', () => {
    expect(EXTENSIONS['image/webp']).toBe('webp');
    expect(EXTENSIONS['image/jpeg']).toBe('jpg');
    expect(EXTENSIONS['image/png']).toBe('png');
  });
});
