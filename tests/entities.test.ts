// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { NAMED, decodeEntities, encodeEntities } from '../src/lib/entities';

describe('entity encoding', () => {
  it('always escapes the five markup-significant characters', () => {
    expect(encodeEntities(`<a href="x">&'`)).toBe('&lt;a href=&quot;x&quot;&gt;&amp;&apos;');
  });

  it('falls back to numeric references when named output is off', () => {
    expect(encodeEntities('<&>', { named: false })).toBe('&#60;&#38;&#62;');
  });

  it('leaves ordinary ASCII untouched', () => {
    expect(encodeEntities('Hello, world 123')).toBe('Hello, world 123');
  });

  it('names well-known symbols above ASCII', () => {
    expect(encodeEntities('© 2024 — π')).toBe('&copy; 2024 &mdash; &pi;');
  });

  it('escapes every non-ASCII character in "encode all" mode', () => {
    expect(encodeEntities('café', { all: true })).toBe('caf&#233;');
    expect(encodeEntities('café')).toBe('café');
  });

  it('uses numeric references for unnamed characters in "encode all" mode', () => {
    expect(encodeEntities('日', { all: true })).toBe('&#26085;');
  });

  it('encodes astral characters as a single code point', () => {
    expect(encodeEntities('🙂', { all: true })).toBe('&#128578;');
  });
});

describe('entity decoding', () => {
  it('resolves named, decimal and hex references', () => {
    expect(decodeEntities('&amp; &#169; &#x1F642;')).toBe('& © 🙂');
  });

  it('knows entities beyond the built-in table', () => {
    expect(decodeEntities('&hearts;&spades;')).toBe('♥♠');
  });

  it('leaves text that only looks like an entity alone', () => {
    expect(decodeEntities('5 &notanentity; 6')).toBe('5 ¬anentity; 6');
    expect(decodeEntities('plain text')).toBe('plain text');
  });

  it('strips markup rather than rendering it, since it returns text', () => {
    expect(decodeEntities('&lt;b&gt;bold&lt;/b&gt;')).toBe('<b>bold</b>');
  });

  it('round-trips the characters it encodes', () => {
    const text = `<script>alert("x & y")</script> © — π 🙂`;
    expect(decodeEntities(encodeEntities(text, { all: true }))).toBe(text);
  });

  it('maps every table entry back to its own character', () => {
    for (const [char, name] of Object.entries(NAMED)) {
      expect(decodeEntities(`&${name};`)).toBe(char);
    }
  });
});
