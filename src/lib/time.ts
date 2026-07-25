/** Timestamp parsing and calendar maths for the Timestamp Converter. */

export interface ParsedTime {
  date: Date;
  kind: string;
}

/** Accepts epoch seconds/millis/micros/nanos, ISO strings and a few keywords. */
export function parseInput(raw: string, now = Date.now()): ParsedTime | null {
  const text = raw.trim();
  if (!text) return null;

  const lower = text.toLowerCase();
  const WORDS: Record<string, number> = {
    now: 0,
    today: 0,
    tomorrow: 86_400_000,
    yesterday: -86_400_000,
  };
  if (lower in WORDS) return { date: new Date(now + WORDS[lower]), kind: 'relative keyword' };

  if (/^-?\d+$/.test(text)) {
    const value = Number(text);
    const digits = text.replace('-', '').length;
    if (digits <= 10) return { date: new Date(value * 1000), kind: 'Unix seconds' };
    if (digits <= 13) return { date: new Date(value), kind: 'Unix milliseconds' };
    if (digits <= 16) return { date: new Date(value / 1000), kind: 'Unix microseconds' };
    return { date: new Date(value / 1_000_000), kind: 'Unix nanoseconds' };
  }

  if (/^-?\d+\.\d+$/.test(text)) {
    return { date: new Date(Number(text) * 1000), kind: 'Unix seconds (fractional)' };
  }

  const parsed = new Date(text);
  if (!Number.isNaN(parsed.getTime())) {
    return { date: parsed, kind: /^\d{4}-\d{2}-\d{2}/.test(text) ? 'ISO 8601' : 'date string' };
  }

  return null;
}

export const isLeap = (year: number) =>
  (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;

export function dayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  return Math.floor((date.getTime() - start.getTime()) / 86_400_000);
}

export function isoWeek(date: Date): { year: number; week: number } {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
  return { year: d.getUTCFullYear(), week };
}

/** ISO 8601 in local time, keeping the offset rather than shifting to UTC. */
export function localIso(date: Date): string {
  const pad = (n: number, size = 2) => String(Math.abs(n)).padStart(size, '0');
  const offset = -date.getTimezoneOffset();
  const sign = offset >= 0 ? '+' : '-';
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}:${pad(date.getSeconds())}${sign}${pad(
    Math.floor(Math.abs(offset) / 60),
  )}:${pad(Math.abs(offset) % 60)}`;
}

const RELATIVE_UNITS: [number, Intl.RelativeTimeFormatUnit][] = [
  [1000, 'second'],
  [60_000, 'minute'],
  [3_600_000, 'hour'],
  [86_400_000, 'day'],
  [604_800_000, 'week'],
  [2_629_800_000, 'month'],
  [31_557_600_000, 'year'],
];

/** Picks the largest unit that fits, then formats with `Intl`. */
export function relative(date: Date, now = Date.now()): string {
  const diff = date.getTime() - now;
  const abs = Math.abs(diff);
  let chosen = RELATIVE_UNITS[0];
  for (const unit of RELATIVE_UNITS) {
    if (abs >= unit[0]) chosen = unit;
  }
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
  return rtf.format(Math.round(diff / chosen[0]), chosen[1]);
}

export const sqlDatetime = (date: Date) => date.toISOString().slice(0, 19).replace('T', ' ');
