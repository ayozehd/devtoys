import { describe, expect, it } from 'vitest';
import { dayOfYear, isLeap, isoWeek, localIso, parseInput, relative, sqlDatetime } from '../src/lib/time';

// vitest.config.ts pins TZ=UTC, so local and UTC assertions agree here.
const NOW = Date.UTC(2024, 0, 15, 12, 0, 0);

describe('timestamp parsing', () => {
  it('detects the unit from the number of digits', () => {
    expect(parseInput('1700000000')).toMatchObject({ kind: 'Unix seconds' });
    expect(parseInput('1700000000000')).toMatchObject({ kind: 'Unix milliseconds' });
    expect(parseInput('1700000000000000')).toMatchObject({ kind: 'Unix microseconds' });
    expect(parseInput('1700000000000000000')).toMatchObject({ kind: 'Unix nanoseconds' });
  });

  it('resolves every unit to the same instant', () => {
    const expected = 1_700_000_000_000;
    expect(parseInput('1700000000')!.date.getTime()).toBe(expected);
    expect(parseInput('1700000000000')!.date.getTime()).toBe(expected);
    expect(parseInput('1700000000000000')!.date.getTime()).toBe(expected);
    expect(parseInput('1700000000000000000')!.date.getTime()).toBe(expected);
  });

  it('handles the epoch and negative timestamps', () => {
    expect(parseInput('0')!.date.toISOString()).toBe('1970-01-01T00:00:00.000Z');
    expect(parseInput('-86400')!.date.toISOString()).toBe('1969-12-31T00:00:00.000Z');
  });

  it('accepts fractional seconds', () => {
    const parsed = parseInput('1700000000.5')!;
    expect(parsed.kind).toBe('Unix seconds (fractional)');
    expect(parsed.date.getTime()).toBe(1_700_000_000_500);
  });

  it('parses ISO strings and labels them', () => {
    expect(parseInput('2024-03-01T10:30:00Z')).toMatchObject({ kind: 'ISO 8601' });
    expect(parseInput('2024-03-01T10:30:00Z')!.date.toISOString()).toBe('2024-03-01T10:30:00.000Z');
    expect(parseInput('March 1, 2024')).toMatchObject({ kind: 'date string' });
  });

  it('understands a few relative keywords', () => {
    expect(parseInput('now', NOW)!.date.getTime()).toBe(NOW);
    expect(parseInput('TOMORROW', NOW)!.date.getTime()).toBe(NOW + 86_400_000);
    expect(parseInput('yesterday', NOW)!.date.getTime()).toBe(NOW - 86_400_000);
    expect(parseInput('now', NOW)!.kind).toBe('relative keyword');
  });

  it('returns null for blank or unrecognisable input', () => {
    expect(parseInput('')).toBeNull();
    expect(parseInput('   ')).toBeNull();
    expect(parseInput('not a date')).toBeNull();
  });
});

describe('calendar maths', () => {
  it('applies the full leap-year rule', () => {
    expect([2024, 2000, 1996].map(isLeap)).toEqual([true, true, true]);
    expect([2023, 1900, 2100].map(isLeap)).toEqual([false, false, false]);
  });

  it('counts the day of the year across a leap day', () => {
    expect(dayOfYear(new Date('2024-01-01T00:00:00Z'))).toBe(1);
    expect(dayOfYear(new Date('2024-03-01T00:00:00Z'))).toBe(61);
    expect(dayOfYear(new Date('2023-03-01T00:00:00Z'))).toBe(60);
    expect(dayOfYear(new Date('2024-12-31T00:00:00Z'))).toBe(366);
  });

  it('computes ISO weeks, including the year-boundary cases', () => {
    expect(isoWeek(new Date('2024-01-04T00:00:00Z'))).toEqual({ year: 2024, week: 1 });
    // 1 Jan 2021 is a Friday, so it belongs to week 53 of 2020.
    expect(isoWeek(new Date('2021-01-01T00:00:00Z'))).toEqual({ year: 2020, week: 53 });
    // 31 Dec 2019 is a Tuesday, already week 1 of 2020.
    expect(isoWeek(new Date('2019-12-31T00:00:00Z'))).toEqual({ year: 2020, week: 1 });
    expect(isoWeek(new Date('2024-12-30T00:00:00Z'))).toEqual({ year: 2025, week: 1 });
  });
});

describe('formatting', () => {
  it('writes local ISO with an explicit offset', () => {
    expect(localIso(new Date('2024-06-01T09:05:03Z'))).toBe('2024-06-01T09:05:03+00:00');
  });

  it('writes SQL DATETIME without the T or the milliseconds', () => {
    expect(sqlDatetime(new Date('2024-06-01T09:05:03.123Z'))).toBe('2024-06-01 09:05:03');
  });

  it('describes distances using the largest unit that fits', () => {
    expect(relative(new Date(NOW + 45_000), NOW)).toMatch(/second/);
    expect(relative(new Date(NOW + 5 * 60_000), NOW)).toMatch(/minute/);
    expect(relative(new Date(NOW + 3 * 3_600_000), NOW)).toMatch(/hour/);
    expect(relative(new Date(NOW + 3 * 86_400_000), NOW)).toMatch(/day/);
    expect(relative(new Date(NOW + 400 * 86_400_000), NOW)).toMatch(/year/);
  });

  it('distinguishes past from future', () => {
    expect(relative(new Date(NOW - 3 * 86_400_000), NOW)).toMatch(/ago/);
    expect(relative(new Date(NOW + 3 * 86_400_000), NOW)).toMatch(/^in /);
  });
});
