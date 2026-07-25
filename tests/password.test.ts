import { describe, expect, it } from 'vitest';
import {
  AMBIGUOUS,
  ATTACKERS,
  SETS,
  analyse,
  guessesFor,
  humanTime,
  level,
  passphrase,
  pin,
  randomPassword,
} from '../src/lib/password';

const entropyOf = (password: string) => analyse(password).entropy;

describe('entropy estimation', () => {
  it('grows the pool as character classes are added', () => {
    expect(analyse('abcdefgh').pool).toBe(26);
    expect(analyse('abcdEFGH').pool).toBe(52);
    expect(analyse('abcdEF12').pool).toBe(62);
    expect(analyse('abcdEF1!').pool).toBe(95);
  });

  it('scores an empty password as zero', () => {
    expect(analyse('')).toMatchObject({ entropy: 0, pool: 0 });
  });

  it('rewards length more than exotic characters', () => {
    expect(entropyOf('kwmvptxzhrjbdgqf')).toBeGreaterThan(entropyOf('P@1z'));
  });

  it('caps well-known passwords regardless of their shape', () => {
    const result = analyse('Password'.toLowerCase());
    expect(result.entropy).toBeLessThanOrEqual(8);
    expect(result.penalties.join(' ')).toMatch(/breach list/);
  });

  it('discounts repeated characters', () => {
    expect(entropyOf('aaaaaaaaaaaa')).toBeLessThan(entropyOf('kwmvptxzhrjb'));
  });

  it('discounts numeric and alphabetic sequences', () => {
    expect(entropyOf('zqx12345tvb')).toBeLessThan(entropyOf('zqx19475tvb'));
    expect(analyse('zqxabcdetvb').penalties.join(' ')).toMatch(/alphabetic sequence/);
  });

  it('discounts keyboard walks', () => {
    expect(analyse('xqwertyz').penalties.join(' ')).toMatch(/keyboard walk/);
  });

  it('notices year-like digits', () => {
    expect(analyse('summer2019holiday').penalties.join(' ')).toMatch(/looks like a year/);
  });

  it('calls out PIN-style passwords', () => {
    expect(analyse('4821').penalties.join(' ')).toMatch(/PIN-style/);
  });

  it('never reports the same penalty twice', () => {
    const { penalties } = analyse('aaa111qwerty2019');
    expect(new Set(penalties).size).toBe(penalties.length);
  });

  it('reports the checklist a user can act on', () => {
    const { checks } = analyse('Str0ng-Passphrase!');
    const byLabel = Object.fromEntries(checks.map((c) => [c.label, c.pass]));
    expect(byLabel['At least 12 characters']).toBe(true);
    expect(byLabel['Symbols']).toBe(true);
    expect(byLabel['Uppercase letters']).toBe(true);
    expect(checks).toHaveLength(9);
  });
});

describe('strength levels', () => {
  it('maps entropy onto the labelled bands', () => {
    expect(level(10).label).toBe('Very weak');
    expect(level(30).label).toBe('Weak');
    expect(level(50).label).toBe('Reasonable');
    expect(level(70).label).toBe('Strong');
    expect(level(120).label).toBe('Very strong');
  });

  it('is monotonic — more entropy never means a weaker label', () => {
    const order = ['Very weak', 'Weak', 'Reasonable', 'Strong', 'Very strong'];
    let last = -1;
    for (let e = 0; e <= 140; e += 5) {
      const index = order.indexOf(level(e).label);
      expect(index).toBeGreaterThanOrEqual(last);
      last = index;
    }
  });
});

describe('crack time', () => {
  it('assumes half the keyspace on average', () => {
    expect(guessesFor(10)).toBe(512);
  });

  it('formats increasing durations with sensible units', () => {
    expect(humanTime(0.4)).toBe('instantly');
    expect(humanTime(30)).toMatch(/second/);
    expect(humanTime(90)).toMatch(/minute/);
    expect(humanTime(3600 * 5)).toMatch(/hour/);
    expect(humanTime(86_400 * 3)).toMatch(/day/);
    expect(humanTime(86_400 * 400)).toMatch(/year/);
    expect(humanTime(86_400 * 365.25 * 5000)).toMatch(/millennia/);
  });

  it('gives up gracefully on absurd numbers', () => {
    expect(humanTime(Infinity)).toMatch(/universe/);
    expect(humanTime(2 ** 128)).toBe('effectively forever');
  });

  it('gets slower as the attacker gets weaker', () => {
    const guesses = guessesFor(60);
    const times = ATTACKERS.map(([, rate]) => guesses / rate);
    expect([...times].sort((a, b) => b - a)).toEqual(times);
  });
});

describe('generators', () => {
  it('produces the requested length from the requested pool', () => {
    const value = randomPassword(32, SETS.digits);
    expect(value).toHaveLength(32);
    expect(value).toMatch(/^\d{32}$/);
  });

  it('falls back to lowercase when no set is selected', () => {
    expect(randomPassword(12, '')).toMatch(/^[a-z]{12}$/);
  });

  it('can exclude ambiguous glyphs', () => {
    const pool = (SETS.lower + SETS.upper + SETS.digits).replace(AMBIGUOUS, '');
    expect(randomPassword(200, pool)).not.toMatch(/[l1IO0oB8S5]/);
  });

  it('builds hyphenated passphrases with a digit and symbol suffix', () => {
    const phrase = passphrase(4);
    expect(phrase.split('-')).toHaveLength(5);
    expect(phrase).toMatch(/-\d[!@#$%&*]$/);
  });

  it('clamps PIN length to a sane range', () => {
    expect(pin(2)).toHaveLength(4);
    expect(pin(99)).toHaveLength(12);
    expect(pin(6)).toMatch(/^\d{6}$/);
  });

  it('does not repeat itself across calls', () => {
    const values = new Set(Array.from({ length: 50 }, () => randomPassword(16, SETS.lower)));
    expect(values.size).toBe(50);
  });

  it('scores its own generated passwords as strong', () => {
    const pool = SETS.lower + SETS.upper + SETS.digits + SETS.symbols;
    expect(entropyOf(randomPassword(20, pool))).toBeGreaterThan(80);
  });
});
