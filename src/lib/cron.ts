/**
 * A small standard-crontab (5 field) parser and scheduler.
 *
 * Supports `*`, `?`, lists, ranges, steps and the usual month/weekday names,
 * plus the `@hourly`-style macros. Quartz extensions (`L`, `W`, `#`) are
 * rejected with a clear message rather than silently mis-scheduling.
 */

export interface CronField {
  values: number[];
  wildcard: boolean;
  source: string;
}

export interface Cron {
  minute: CronField;
  hour: CronField;
  dayOfMonth: CronField;
  month: CronField;
  dayOfWeek: CronField;
}

export class CronError extends Error {}

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

export const MONTH_LABELS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export const DAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const MACROS: Record<string, string> = {
  '@yearly': '0 0 1 1 *',
  '@annually': '0 0 1 1 *',
  '@monthly': '0 0 1 * *',
  '@weekly': '0 0 * * 0',
  '@daily': '0 0 * * *',
  '@midnight': '0 0 * * *',
  '@hourly': '0 * * * *',
};

const SPECS = [
  { name: 'minute', min: 0, max: 59, names: [] as string[] },
  { name: 'hour', min: 0, max: 23, names: [] as string[] },
  { name: 'day of month', min: 1, max: 31, names: [] as string[] },
  { name: 'month', min: 1, max: 12, names: MONTHS },
  { name: 'day of week', min: 0, max: 6, names: DAYS },
];

function parseValue(token: string, spec: (typeof SPECS)[number]): number {
  const lower = token.toLowerCase();
  const named = spec.names.indexOf(lower);
  if (named >= 0) return named + spec.min;

  if (!/^\d+$/.test(token)) {
    throw new CronError(`"${token}" is not a valid ${spec.name} value.`);
  }

  let value = Number(token);
  // Both 0 and 7 mean Sunday in every crontab implementation.
  if (spec.name === 'day of week' && value === 7) value = 0;

  if (value < spec.min || value > spec.max) {
    throw new CronError(`${spec.name} must be between ${spec.min} and ${spec.max}, got ${value}.`);
  }
  return value;
}

function parseField(source: string, spec: (typeof SPECS)[number]): CronField {
  const raw = source.trim();
  if (!raw) throw new CronError(`Missing ${spec.name} field.`);

  if (/[LW#]/i.test(raw)) {
    throw new CronError(
      `The ${spec.name} field uses a Quartz extension (L, W or #), which standard cron does not support.`,
    );
  }

  const wildcard = raw === '*' || raw === '?';
  const values = new Set<number>();

  for (const part of raw.split(',')) {
    const [rangePart, stepPart] = part.split('/');
    const step = stepPart === undefined ? 1 : Number(stepPart);

    if (stepPart !== undefined && (!/^\d+$/.test(stepPart) || step < 1)) {
      throw new CronError(`"${part}" has an invalid step in the ${spec.name} field.`);
    }

    let start = spec.min;
    let end = spec.max;

    if (rangePart !== '*' && rangePart !== '?') {
      const bounds = rangePart.split('-');
      if (bounds.length > 2) throw new CronError(`"${part}" is not a valid ${spec.name} range.`);
      start = parseValue(bounds[0], spec);
      end = bounds.length === 2 ? parseValue(bounds[1], spec) : stepPart === undefined ? start : spec.max;
      if (end < start) {
        throw new CronError(`Range "${rangePart}" runs backwards in the ${spec.name} field.`);
      }
    }

    for (let v = start; v <= end; v += step) values.add(v);
  }

  if (!values.size) throw new CronError(`The ${spec.name} field matches nothing.`);
  return { values: [...values].sort((a, b) => a - b), wildcard, source: raw };
}

export function parseCron(expression: string): Cron {
  const trimmed = expression.trim();
  if (!trimmed) throw new CronError('Enter a cron expression.');

  const expanded = MACROS[trimmed.toLowerCase()] ?? trimmed;
  if (trimmed.startsWith('@') && !MACROS[trimmed.toLowerCase()]) {
    throw new CronError(`Unknown macro "${trimmed}". Try ${Object.keys(MACROS).join(', ')}.`);
  }

  const parts = expanded.split(/\s+/);
  if (parts.length === 6) {
    throw new CronError(
      'This looks like a 6-field expression (with seconds). DevToys uses the 5-field crontab format.',
    );
  }
  if (parts.length !== 5) {
    throw new CronError(`Expected 5 fields (minute hour day month weekday), got ${parts.length}.`);
  }

  return {
    minute: parseField(parts[0], SPECS[0]),
    hour: parseField(parts[1], SPECS[1]),
    dayOfMonth: parseField(parts[2], SPECS[2]),
    month: parseField(parts[3], SPECS[3]),
    dayOfWeek: parseField(parts[4], SPECS[4]),
  };
}

/**
 * When both day-of-month and day-of-week are restricted, cron matches a day if
 * *either* field matches — a long-standing quirk worth preserving.
 */
function matchesDate(cron: Cron, month: number, dom: number, dow: number): boolean {
  if (!cron.month.values.includes(month)) return false;

  const domRestricted = !cron.dayOfMonth.wildcard;
  const dowRestricted = !cron.dayOfWeek.wildcard;
  const domHit = cron.dayOfMonth.values.includes(dom);
  const dowHit = cron.dayOfWeek.values.includes(dow);

  if (domRestricted && dowRestricted) return domHit || dowHit;
  if (domRestricted) return domHit;
  if (dowRestricted) return dowHit;
  return true;
}

/** Returns the next `count` fire times at or after `from`. */
export function nextRuns(cron: Cron, from: Date, count = 10, utc = false): Date[] {
  const results: Date[] = [];

  const get = {
    year: (d: Date) => (utc ? d.getUTCFullYear() : d.getFullYear()),
    month: (d: Date) => (utc ? d.getUTCMonth() : d.getMonth()) + 1,
    date: (d: Date) => (utc ? d.getUTCDate() : d.getDate()),
    day: (d: Date) => (utc ? d.getUTCDay() : d.getDay()),
    hours: (d: Date) => (utc ? d.getUTCHours() : d.getHours()),
    minutes: (d: Date) => (utc ? d.getUTCMinutes() : d.getMinutes()),
  };

  const make = (y: number, mo: number, d: number, h: number, mi: number) =>
    utc ? new Date(Date.UTC(y, mo - 1, d, h, mi, 0, 0)) : new Date(y, mo - 1, d, h, mi, 0, 0);

  // Start from the next whole minute so "now" never counts as a run.
  let cursor = new Date(from.getTime() + 60_000);
  cursor.setSeconds(0, 0);

  // Four years of days is enough to cover 29 February schedules.
  for (let day = 0; day < 366 * 4 && results.length < count; day++) {
    const y = get.year(cursor);
    const mo = get.month(cursor);
    const d = get.date(cursor);
    const dow = get.day(cursor);

    if (matchesDate(cron, mo, d, dow)) {
      const fromHour = day === 0 ? get.hours(cursor) : 0;
      const fromMinute = day === 0 ? get.minutes(cursor) : 0;

      for (const h of cron.hour.values) {
        if (h < fromHour) continue;
        for (const mi of cron.minute.values) {
          if (h === fromHour && mi < fromMinute) continue;
          results.push(make(y, mo, d, h, mi));
          if (results.length >= count) break;
        }
        if (results.length >= count) break;
      }
    }

    // Jump to 00:00 of the following day. Adding 26h then flooring keeps this
    // correct across daylight-saving transitions.
    const nextDay = new Date(cursor.getTime() + 26 * 3600_000);
    cursor = make(
      get.year(nextDay),
      get.month(nextDay),
      get.date(nextDay),
      0,
      0,
    );
  }

  return results;
}

const list = (items: string[]): string =>
  items.length <= 1
    ? items.join('')
    : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;

function describeField(
  field: CronField,
  unit: string,
  format: (value: number) => string = String,
): string {
  if (field.wildcard) return `every ${unit}`;

  const stepMatch = /^(\*|\d+-\d+)\/(\d+)$/.exec(field.source);
  if (stepMatch) {
    const every = Number(stepMatch[2]);
    const scope = stepMatch[1] === '*' ? '' : ` from ${stepMatch[1].replace('-', ' through ')}`;
    return `every ${every} ${unit}s${scope}`;
  }

  if (field.values.length > 8) return `${field.values.length} selected ${unit}s`;
  return `${unit} ${list(field.values.map(format))}`;
}

/** Plain-English summary of a parsed expression. */
export function describe(cron: Cron): string {
  const minute = cron.minute;
  const hour = cron.hour;

  let time: string;
  if (minute.wildcard && hour.wildcard) {
    time = 'Every minute';
  } else if (hour.wildcard && !minute.wildcard) {
    time = `At ${describeField(minute, 'minute')} of every hour`;
  } else if (minute.values.length === 1 && hour.values.length <= 6 && !hour.wildcard) {
    const times = hour.values.map(
      (h) => `${String(h).padStart(2, '0')}:${String(minute.values[0]).padStart(2, '0')}`,
    );
    time = `At ${list(times)}`;
  } else {
    time = `At ${describeField(minute, 'minute')}, ${describeField(hour, 'hour')}`;
  }

  const parts: string[] = [time];

  if (!cron.dayOfWeek.wildcard) {
    parts.push(`on ${describeField(cron.dayOfWeek, 'day', (v) => DAY_LABELS[Number(v)])}`);
  }
  if (!cron.dayOfMonth.wildcard) {
    parts.push(`on day-of-month ${describeField(cron.dayOfMonth, 'day').replace('day ', '')}`);
  }
  if (!cron.month.wildcard) {
    parts.push(`in ${describeField(cron.month, 'month', (v) => MONTH_LABELS[Number(v) - 1])}`);
  }
  if (cron.dayOfMonth.wildcard && cron.dayOfWeek.wildcard && cron.month.wildcard) {
    parts.push('every day');
  }

  return `${parts.join(', ')}.`;
}
