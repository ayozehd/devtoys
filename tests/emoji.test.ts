import { describe, expect, it } from 'vitest';
import { GLYPHS, GROUPS, codePoints, formatGlyph, searchGlyphs, type GlyphFormat } from '../src/lib/emoji';

describe('glyph data', () => {
  it('ships a substantial, well-formed set', () => {
    expect(GLYPHS.length).toBeGreaterThan(600);
    expect(GROUPS.length).toBeGreaterThan(5);
    for (const glyph of GLYPHS) {
      expect(glyph.char).not.toBe('');
      expect(glyph.name).not.toBe('');
      expect(GROUPS).toContain(glyph.group);
    }
  });

  it('has no duplicate characters', () => {
    const seen = new Set(GLYPHS.map((g) => g.char));
    expect(seen.size).toBe(GLYPHS.length);
  });

  it('never leaks the field separator into a name', () => {
    expect(GLYPHS.some((g) => g.name.includes('|'))).toBe(false);
  });

  it('searches on a lowercased haystack, whatever case the name uses', () => {
    const upper = GLYPHS.find((g) => g.name !== g.name.toLowerCase())!;
    expect(searchGlyphs(upper.name.toLowerCase())).toContain(upper);
  });

  it('puts every group to use', () => {
    for (const group of GROUPS) {
      expect(GLYPHS.some((g) => g.group === group)).toBe(true);
    }
  });
});

describe('search', () => {
  it('matches on the name', () => {
    expect(searchGlyphs('rocket').map((g) => g.char)).toContain('🚀');
  });

  it('matches on keywords that are not in the name', () => {
    const results = searchGlyphs('lol');
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((g) => !g.name.includes('lol'))).toBe(true);
  });

  it('ignores case and surrounding whitespace', () => {
    expect(searchGlyphs('  ROCKET ')).toEqual(searchGlyphs('rocket'));
  });

  it('returns everything for an empty query', () => {
    expect(searchGlyphs('')).toHaveLength(GLYPHS.length);
  });

  it('restricts results to a group when one is given', () => {
    const group = GROUPS[0];
    const results = searchGlyphs('', group);
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((g) => g.group === group)).toBe(true);
  });

  it('combines query and group', () => {
    const results = searchGlyphs('face', GROUPS[0]);
    expect(results.every((g) => g.group === GROUPS[0])).toBe(true);
  });

  it('returns nothing for a query that matches nothing', () => {
    expect(searchGlyphs('zzzznotaglyph')).toEqual([]);
  });
});

describe('glyph formatting', () => {
  it('lists code points in U+ notation', () => {
    expect(codePoints('A')).toEqual(['U+0041']);
    expect(codePoints('🙂')).toEqual(['U+1F642']);
    expect(codePoints('👍🏽')).toHaveLength(2);
  });

  it('renders every copy format', () => {
    expect(formatGlyph('🙂', 'char')).toBe('🙂');
    expect(formatGlyph('🙂', 'codepoint')).toBe('U+1F642');
    expect(formatGlyph('🙂', 'entity')).toBe('&#128578;');
    expect(formatGlyph('🙂', 'js')).toBe('\\u{1f642}');
    expect(formatGlyph('🙂', 'css')).toBe('\\1f642');
  });

  it('handles multi-code-point glyphs', () => {
    expect(formatGlyph('👍🏽', 'entity').match(/&#/g)).toHaveLength(2);
  });

  it('produces JavaScript escapes that evaluate back to the glyph', () => {
    for (const char of ['🙂', '©', '→']) {
      // eslint-disable-next-line no-eval
      expect(eval(`"${formatGlyph(char, 'js')}"`)).toBe(char);
    }
  });

  it('never returns an empty string for a known glyph', () => {
    const formats: GlyphFormat[] = ['char', 'codepoint', 'entity', 'js', 'css'];
    for (const format of formats) {
      expect(formatGlyph(GLYPHS[0].char, format)).not.toBe('');
    }
  });
});
