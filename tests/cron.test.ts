import { describe, expect, it } from 'vitest';
import { CronError, MACROS, describe as describeCron, nextRuns, parseCron } from '../src/lib/cron';

const iso = (dates: Date[]) => dates.map((d) => d.toISOString());
const FROM = new Date('2024-01-15T12:00:00Z');

describe('cron parsing', () => {
  it('expands wildcards to the full range', () => {
    const cron = parseCron('* * * * *');
    expect(cron.minute.values).toHaveLength(60);
    expect(cron.hour.values).toHaveLength(24);
    expect(cron.dayOfMonth.values).toHaveLength(31);
    expect(cron.month.values).toHaveLength(12);
    expect(cron.dayOfWeek.values).toHaveLength(7);
    expect(cron.minute.wildcard).toBe(true);
  });

  it('parses lists, ranges and steps', () => {
    expect(parseCron('0,15,30 * * * *').minute.values).toEqual([0, 15, 30]);
    expect(parseCron('0 9-17 * * *').hour.values).toEqual([9, 10, 11, 12, 13, 14, 15, 16, 17]);
    expect(parseCron('*/15 * * * *').minute.values).toEqual([0, 15, 30, 45]);
    expect(parseCron('0 0-12/6 * * *').hour.values).toEqual([0, 6, 12]);
    expect(parseCron('0 5/6 * * *').hour.values).toEqual([5, 11, 17, 23]);
  });

  it('accepts month and weekday names', () => {
    expect(parseCron('0 0 * JAN,dec *').month.values).toEqual([1, 12]);
    expect(parseCron('0 0 * * mon-fri').dayOfWeek.values).toEqual([1, 2, 3, 4, 5]);
  });

  it('treats 7 and 0 as Sunday', () => {
    expect(parseCron('0 0 * * 7').dayOfWeek.values).toEqual([0]);
  });

  it('treats ? as a wildcard', () => {
    expect(parseCron('0 0 ? * *').dayOfMonth.wildcard).toBe(true);
  });

  it('expands the standard macros', () => {
    for (const [macro, expansion] of Object.entries(MACROS)) {
      expect(parseCron(macro)).toEqual(parseCron(expansion));
    }
  });

  it('rejects out-of-range values with the field name', () => {
    expect(() => parseCron('60 * * * *')).toThrow(/minute must be between 0 and 59/);
    expect(() => parseCron('0 24 * * *')).toThrow(/hour must be between/);
    expect(() => parseCron('0 0 32 * *')).toThrow(/day of month/);
    expect(() => parseCron('0 0 * 13 *')).toThrow(/month/);
  });

  it('rejects backwards ranges and bad steps', () => {
    expect(() => parseCron('0 17-9 * * *')).toThrow(/runs backwards/);
    expect(() => parseCron('*/0 * * * *')).toThrow(/invalid step/);
    expect(() => parseCron('1-2-3 * * * *')).toThrow(/not a valid/);
  });

  it('explains the 6-field and Quartz cases rather than mis-scheduling', () => {
    expect(() => parseCron('0 0 12 * * ?')).toThrow(/6-field expression/);
    expect(() => parseCron('0 0 L * *')).toThrow(/Quartz extension/);
    expect(() => parseCron('0 0 * * 5#2')).toThrow(/Quartz extension/);
  });

  it('reports the field count when it is simply wrong', () => {
    expect(() => parseCron('* * *')).toThrow(/Expected 5 fields/);
    expect(() => parseCron('')).toThrow(CronError);
    expect(() => parseCron('@never')).toThrow(/Unknown macro/);
  });
});

describe('next runs', () => {
  it('never returns the starting minute itself', () => {
    const runs = nextRuns(parseCron('* * * * *'), FROM, 2, true);
    expect(iso(runs)).toEqual(['2024-01-15T12:01:00.000Z', '2024-01-15T12:02:00.000Z']);
  });

  it('returns exactly the requested count', () => {
    expect(nextRuns(parseCron('0 * * * *'), FROM, 5, true)).toHaveLength(5);
  });

  it('schedules a daily job at the right hour', () => {
    expect(iso(nextRuns(parseCron('30 3 * * *'), FROM, 2, true))).toEqual([
      '2024-01-16T03:30:00.000Z',
      '2024-01-17T03:30:00.000Z',
    ]);
  });

  it('handles weekday-only schedules', () => {
    // 2024-01-15 is a Monday; the next Saturday 09:00 is the 20th.
    expect(iso(nextRuns(parseCron('0 9 * * 6'), FROM, 2, true))).toEqual([
      '2024-01-20T09:00:00.000Z',
      '2024-01-27T09:00:00.000Z',
    ]);
  });

  it('matches either field when both day-of-month and day-of-week are set', () => {
    // "1st of the month OR any Monday" — the classic crontab quirk.
    const runs = nextRuns(parseCron('0 0 1 * 1'), FROM, 4, true);
    expect(iso(runs)).toEqual([
      '2024-01-22T00:00:00.000Z',
      '2024-01-29T00:00:00.000Z',
      '2024-02-01T00:00:00.000Z',
      '2024-02-05T00:00:00.000Z',
    ]);
  });

  it('finds 29 February across leap years', () => {
    const runs = nextRuns(parseCron('0 0 29 2 *'), new Date('2024-03-01T00:00:00Z'), 1, true);
    expect(iso(runs)).toEqual(['2028-02-29T00:00:00.000Z']);
  });

  it('rolls over month and year boundaries', () => {
    const runs = nextRuns(parseCron('0 0 1 1 *'), new Date('2024-12-31T23:59:00Z'), 1, true);
    expect(iso(runs)).toEqual(['2025-01-01T00:00:00.000Z']);
  });

  it('returns nothing for a schedule with no reachable date', () => {
    // 30 February never happens.
    expect(nextRuns(parseCron('0 0 30 2 *'), FROM, 3, true)).toEqual([]);
  });

  it('produces strictly increasing times', () => {
    const runs = nextRuns(parseCron('*/7 9-17 * * 1-5'), FROM, 40, true);
    const times = runs.map((d) => d.getTime());
    expect([...times].sort((a, b) => a - b)).toEqual(times);
    expect(new Set(times).size).toBe(times.length);
  });
});

describe('plain-English descriptions', () => {
  it('describes the common schedules', () => {
    expect(describeCron(parseCron('* * * * *'))).toMatch(/^Every minute/);
    expect(describeCron(parseCron('*/5 * * * *'))).toMatch(/every 5 minutes/);
    expect(describeCron(parseCron('0 9 * * *'))).toMatch(/At 09:00/);
    expect(describeCron(parseCron('0 9 * * 1'))).toMatch(/on day Monday/);
    expect(describeCron(parseCron('0 0 1 1 *'))).toMatch(/in month January/);
  });

  it('lists multiple times rather than repeating the fields', () => {
    expect(describeCron(parseCron('0 9,17 * * *'))).toMatch(/At 09:00 and 17:00/);
  });

  it('summarises long value lists instead of enumerating them', () => {
    expect(describeCron(parseCron('0 0-23/2 * * *'))).toMatch(/every 2 hours/);
    expect(describeCron(parseCron('1,2,3,4,5,6,7,8,9,10 * * * *'))).toMatch(/10 selected minutes/);
  });

  it('says "every day" when no date field is restricted', () => {
    expect(describeCron(parseCron('0 12 * * *'))).toMatch(/every day/);
  });

  it('always ends in a full stop', () => {
    for (const expr of ['* * * * *', '0 9 * * 1-5', '@daily', '*/10 * 1 * *']) {
      expect(describeCron(parseCron(expr)).endsWith('.')).toBe(true);
    }
  });
});
