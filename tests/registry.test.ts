import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { iconBody } from '../src/lib/icons';
import { url } from '../src/lib/paths';
import { CATEGORIES, TOOLS, TOOLS_BY_CATEGORY, getTool } from '../src/lib/tools';

const PAGES = path.join(process.cwd(), 'src/pages/tools');

describe('tool registry', () => {
  it('lists every tool the site promises', () => {
    expect(TOOLS).toHaveLength(19);
  });

  it('uses unique slugs and names', () => {
    expect(new Set(TOOLS.map((t) => t.slug)).size).toBe(TOOLS.length);
    expect(new Set(TOOLS.map((t) => t.name)).size).toBe(TOOLS.length);
  });

  it('uses URL-safe slugs', () => {
    for (const tool of TOOLS) expect(tool.slug).toMatch(/^[a-z][a-z0-9-]*$/);
  });

  it('fills in every field a card and a sidebar entry need', () => {
    for (const tool of TOOLS) {
      expect(tool.name.length).toBeGreaterThan(2);
      expect(tool.short.length).toBeGreaterThan(1);
      expect(tool.description.length).toBeGreaterThan(20);
      expect(tool.description.endsWith('.')).toBe(true);
      expect(tool.keywords.length).toBeGreaterThan(1);
      expect(CATEGORIES).toContain(tool.category);
    }
  });

  it('keeps keywords lowercase and free of duplicates', () => {
    for (const tool of TOOLS) {
      expect(tool.keywords).toEqual(tool.keywords.map((k) => k.toLowerCase()));
      expect(new Set(tool.keywords).size).toBe(tool.keywords.length);
    }
  });

  it('groups every tool into exactly one non-empty category', () => {
    const grouped = TOOLS_BY_CATEGORY.flatMap((g) => g.tools);
    expect(grouped).toHaveLength(TOOLS.length);
    expect(new Set(grouped.map((t) => t.slug)).size).toBe(TOOLS.length);
    for (const group of TOOLS_BY_CATEGORY) expect(group.tools.length).toBeGreaterThan(0);
  });

  it('looks a tool up by slug and fails loudly otherwise', () => {
    expect(getTool('json-formatter').name).toBe('JSON Formatter');
    expect(() => getTool('nope')).toThrow(/Unknown tool: nope/);
  });
});

describe('registry ↔ filesystem', () => {
  const files = fs
    .readdirSync(PAGES)
    .filter((f) => f.endsWith('.astro'))
    .map((f) => f.replace(/\.astro$/, ''));

  it('has a page for every registered tool', () => {
    for (const tool of TOOLS) expect(files).toContain(tool.slug);
  });

  it('has no orphan page missing from the registry', () => {
    const slugs = TOOLS.map((t) => t.slug);
    for (const file of files) expect(slugs).toContain(file);
  });

  it('wires each page to its own slug via ToolLayout', () => {
    for (const tool of TOOLS) {
      const source = fs.readFileSync(path.join(PAGES, `${tool.slug}.astro`), 'utf8');
      expect(source).toContain(`<ToolLayout slug="${tool.slug}">`);
    }
  });
});

describe('icons', () => {
  it('resolves every registered icon name to real SVG markup', () => {
    for (const tool of TOOLS) {
      const body = iconBody(tool.icon);
      expect(body).toContain('<path');
      expect(body).not.toContain('<svg');
    }
  });

  it('fails with an actionable message on an unknown name', () => {
    expect(() => iconBody('definitely-not-an-icon')).toThrow(/Unknown RemixIcon/);
  });
});

describe('base-path helper', () => {
  it('prefixes internal links with the configured base', () => {
    const base = import.meta.env.BASE_URL.replace(/\/+$/, '');
    expect(url('/tools/json-formatter')).toBe(`${base}/tools/json-formatter`);
  });

  it('normalises a missing leading slash', () => {
    expect(url('tools/x')).toBe(url('/tools/x'));
  });

  it('never returns an empty string for the site root', () => {
    expect(url('/')).not.toBe('');
    expect(url()).not.toBe('');
  });
});
