// @vitest-environment jsdom
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import { describe, expect, it } from 'vitest';
import { fullDocument, readingStats } from '../src/lib/markdown';

/** Mirrors what the page does: render with marked, then sanitise. */
const render = (markdown: string) =>
  DOMPurify.sanitize(marked.parse(markdown, { async: false }) as string, {
    USE_PROFILES: { html: true },
    ADD_ATTR: ['target'],
  });

describe('markdown rendering', () => {
  it('renders the common block constructs', () => {
    expect(render('# Title')).toContain('<h1>Title</h1>');
    expect(render('- a\n- b')).toMatch(/<ul>[\s\S]*<li>a<\/li>/);
    expect(render('> quote')).toContain('<blockquote>');
    expect(render('```js\nconst a = 1;\n```')).toContain('<code class="language-js">');
  });

  it('renders GitHub-flavoured tables', () => {
    const html = render('| a | b |\n| - | - |\n| 1 | 2 |');
    expect(html).toContain('<table>');
    expect(html).toContain('<th>a</th>');
  });

  it('renders inline emphasis and links', () => {
    expect(render('**bold** and *italic*')).toContain('<strong>bold</strong>');
    expect(render('[x](https://example.com)')).toContain('href="https://example.com"');
  });

  it('strips script tags and inline handlers on the way out', () => {
    expect(render('<script>alert(1)</script>')).not.toContain('<script');
    expect(render('<img src=x onerror="alert(1)">')).not.toContain('onerror');
    expect(render('<a href="javascript:alert(1)">x</a>')).not.toContain('javascript:');
  });

  it('keeps the text content of stripped markup', () => {
    expect(render('<b>bold</b> stays')).toContain('bold');
  });
});

describe('reading stats', () => {
  it('counts words and lines', () => {
    expect(readingStats('one two three\nfour')).toMatchObject({ words: 4, lines: 2 });
  });

  it('never reports less than a one-minute read', () => {
    expect(readingStats('hi').minutes).toBe(1);
  });

  it('scales at roughly 220 words per minute', () => {
    const text = Array.from({ length: 660 }, () => 'word').join(' ');
    expect(readingStats(text).minutes).toBe(3);
  });

  it('reports zeroes for empty input', () => {
    expect(readingStats('')).toEqual({ words: 0, lines: 0, minutes: 1 });
  });
});

describe('HTML export', () => {
  const doc = fullDocument('<h1>Hi</h1>');

  it('produces a complete standalone document', () => {
    expect(doc.startsWith('<!doctype html>')).toBe(true);
    expect(doc).toContain('<meta charset="utf-8">');
    expect(doc).toContain('name="viewport"');
    expect(doc.trim().endsWith('</html>')).toBe(true);
  });

  it('embeds the body and the styles, with no external requests', () => {
    expect(doc).toContain('<h1>Hi</h1>');
    expect(doc).toContain('<style>');
    expect(doc).not.toMatch(/<link|<script|https?:\/\//);
  });

  it('parses as valid HTML with the body intact', () => {
    const parsed = new DOMParser().parseFromString(fullDocument(render('# Title')), 'text/html');
    expect(parsed.querySelector('h1')?.textContent).toBe('Title');
    expect(parsed.querySelector('title')?.textContent).toBe('Document');
  });
});
