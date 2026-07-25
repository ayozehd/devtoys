/**
 * Password entropy estimation.
 *
 * The base figure is `length × log2(pool)`, then discounted for the patterns a
 * real cracker exploits: breach lists, repeats, sequences and keyboard walks.
 */

export interface Analysis {
  entropy: number;
  pool: number;
  penalties: string[];
  checks: { label: string; pass: boolean }[];
}

export const SETS: Record<string, string> = {
  lower: 'abcdefghijklmnopqrstuvwxyz',
  upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  digits: '0123456789',
  symbols: '!@#$%^&*()-_=+[]{}<>?,.;:/|~',
};

export const COMMON = new Set([
  'password', 'passw0rd', '123456', '12345678', '123456789', 'qwerty', 'abc123', 'letmein',
  'monkey', 'dragon', 'football', 'iloveyou', 'admin', 'welcome', 'login', 'master', 'sunshine',
  'princess', 'qwertyuiop', 'trustno1', 'baseball', 'superman', 'starwars', 'whatever',
]);

const KEYBOARD = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm', '1234567890'];

export function analyse(password: string): Analysis {
  const lower = password.toLowerCase();
  let pool = 0;
  if (/[a-z]/.test(password)) pool += 26;
  if (/[A-Z]/.test(password)) pool += 26;
  if (/\d/.test(password)) pool += 10;
  if (/[^A-Za-z0-9]/.test(password)) pool += 33;

  let entropy = password.length ? password.length * Math.log2(pool || 1) : 0;
  const penalties: string[] = [];

  if (COMMON.has(lower)) {
    entropy = Math.min(entropy, 8);
    penalties.push('This is one of the most-guessed passwords in every breach list.');
  }

  // Repeated characters carry far less information than the formula assumes.
  const unique = new Set(password).size;
  if (password.length > 3 && unique / password.length < 0.6) {
    entropy *= 0.7;
    penalties.push('Many characters repeat, which shrinks the real search space.');
  }

  if (/(.)\1{2,}/.test(password)) {
    entropy *= 0.85;
    penalties.push('Contains a run of three or more identical characters.');
  }

  if (/(?:012|123|234|345|456|567|678|789|890)/.test(password)) {
    entropy *= 0.85;
    penalties.push('Contains a numeric sequence.');
  }

  if (/(?:abc|bcd|cde|def|efg|xyz)/i.test(password)) {
    entropy *= 0.85;
    penalties.push('Contains an alphabetic sequence.');
  }

  for (const row of KEYBOARD) {
    for (let i = 0; i + 4 <= row.length; i++) {
      if (lower.includes(row.slice(i, i + 4))) {
        entropy *= 0.8;
        penalties.push('Contains a keyboard walk such as “qwer” or “asdf”.');
        i = row.length;
        break;
      }
    }
  }

  if (/^\d{4,8}$/.test(password)) {
    penalties.push('Digits only — a PIN-style password falls in seconds.');
  }

  if (/(19|20)\d{2}/.test(password)) {
    entropy *= 0.9;
    penalties.push('Contains something that looks like a year.');
  }

  const checks = [
    { label: 'At least 12 characters', pass: password.length >= 12 },
    { label: 'At least 16 characters (recommended)', pass: password.length >= 16 },
    { label: 'Lowercase letters', pass: /[a-z]/.test(password) },
    { label: 'Uppercase letters', pass: /[A-Z]/.test(password) },
    { label: 'Digits', pass: /\d/.test(password) },
    { label: 'Symbols', pass: /[^A-Za-z0-9]/.test(password) },
    { label: 'Not a well-known password', pass: !COMMON.has(lower) },
    { label: 'No character repeated three times', pass: !/(.)\1{2,}/.test(password) },
    {
      label: 'No obvious sequence',
      pass: !/(?:012|123|234|345|456|567|678|789|abc|xyz)/i.test(password),
    },
  ];

  return { entropy: Math.round(entropy * 10) / 10, pool, penalties: [...new Set(penalties)], checks };
}

export const ATTACKERS: [string, number][] = [
  ['Online, rate-limited (100/s)', 1e2],
  ['Online, unthrottled (10k/s)', 1e4],
  ['Offline, bcrypt cost 12 (20k/s)', 2e4],
  ['Offline, slow hash (1M/s)', 1e6],
  ['Offline, fast GPU MD5 (100G/s)', 1e11],
  ['Nation state (100T/s)', 1e14],
];

export const LEVELS: { max: number; label: string; badge: string }[] = [
  { max: 28, label: 'Very weak', badge: 'badge-danger' },
  { max: 36, label: 'Weak', badge: 'badge-danger' },
  { max: 60, label: 'Reasonable', badge: 'badge-attention' },
  { max: 80, label: 'Strong', badge: 'badge-success' },
  { max: Infinity, label: 'Very strong', badge: 'badge-success' },
];

export function level(entropy: number) {
  return LEVELS.find((l) => entropy < l.max)!;
}

export function humanTime(seconds: number): string {
  if (!Number.isFinite(seconds)) return 'longer than the universe has existed';
  if (seconds < 1) return 'instantly';
  const units: [number, string][] = [
    [60, 'second'],
    [60, 'minute'],
    [24, 'hour'],
    [365.25, 'day'],
    [1000, 'year'],
    [1000, 'millennium'],
  ];
  let value = seconds;
  let unit = 'second';
  for (const [size, name] of units) {
    unit = name;
    if (value < size) break;
    value /= size;
  }
  if (unit === 'millennium' && value > 1e6) return 'effectively forever';
  const rounded = value >= 100 ? Math.round(value) : Math.round(value * 10) / 10;
  const plural = unit === 'millennium' ? 'millennia' : `${unit}s`;
  return `${rounded.toLocaleString()} ${rounded === 1 ? unit : plural}`;
}

/** Average case is half the keyspace. */
export const guessesFor = (entropy: number) => 2 ** entropy / 2;

export const WORDLIST =
  'anchor amber bison cactus cedar cobalt coral delta ember falcon fjord garnet harbor indigo ivory jasper kelp lagoon lantern maple meadow nimbus onyx opal orbit pebble quartz quill raven ripple saffron summit thistle timber umber valley velvet walnut willow zephyr zenith badger bramble canyon cinder dawn drift elm flint grove hollow juniper lichen marble nectar oakum pine prairie quiver reef sage shale spruce tundra vale wisp yarrow'.split(
    ' ',
  );

export const AMBIGUOUS = /[l1IO0oB8S5]/g;

const pick = (pool: string) => pool[crypto.getRandomValues(new Uint32Array(1))[0] % pool.length];

export function randomPassword(length: number, pool: string): string {
  const chars = pool || SETS.lower;
  let value = '';
  for (let i = 0; i < length; i++) value += pick(chars);
  return value;
}

export function passphrase(count: number): string {
  const chosen = Array.from(
    { length: count },
    () => WORDLIST[crypto.getRandomValues(new Uint32Array(1))[0] % WORDLIST.length],
  );
  return `${chosen.join('-')}-${pick('0123456789')}${pick('!@#$%&*')}`;
}

export function pin(length: number): string {
  const size = Math.max(4, Math.min(12, length));
  return Array.from({ length: size }, () => pick('0123456789')).join('');
}
