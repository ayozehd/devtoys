/**
 * Build-time RemixIcon loader.
 *
 * RemixIcon ships one flat SVG per icon under `remixicon/icons/<Category>/`.
 * We index them once and inline the markup during the build, so pages ship no
 * icon font and make no network requests. Server-side only — never import this
 * from a client `<script>`.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ICONS_DIR = path.join(path.dirname(require.resolve('remixicon/package.json')), 'icons');

const index = new Map<string, string>();

for (const group of fs.readdirSync(ICONS_DIR)) {
  const dir = path.join(ICONS_DIR, group);
  if (!fs.statSync(dir).isDirectory()) continue;
  for (const file of fs.readdirSync(dir)) {
    if (file.endsWith('.svg')) index.set(file.slice(0, -4), path.join(dir, file));
  }
}

const cache = new Map<string, string>();

/** Returns the inner markup of a RemixIcon, e.g. `braces-line`. */
export function iconBody(name: string): string {
  const cached = cache.get(name);
  if (cached) return cached;

  const file = index.get(name);
  if (!file) {
    throw new Error(
      `Unknown RemixIcon "${name}". Check the name against node_modules/remixicon/icons.`,
    );
  }

  // Strip the wrapper <svg> so the caller controls size, colour and a11y.
  const body = fs
    .readFileSync(file, 'utf8')
    .replace(/^[\s\S]*?<svg[^>]*>/, '')
    .replace(/<\/svg>\s*$/, '')
    .trim();

  cache.set(name, body);
  return body;
}
