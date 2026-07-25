# DevToys

A collection of developer and sysadmin utilities that run entirely in the browser.
No backend, no accounts, no uploads — every tool computes locally, and the site keeps
working offline once it has loaded.

**Live:** https://ayozehd.github.io/devtoys/

## Tools

| Category | Tool | What it does |
| --- | --- | --- |
| Text | Regex Tester | Live match highlighting, capture/named groups, replace preview, preset patterns |
| Text | Text Diff | Side-by-side, unified and `diff -u` patch output with word-level highlighting |
| Text | Case Converter | camelCase, snake_case, kebab-case, slugs, plus line operations |
| Text | Markdown Preview | Live GFM preview with sanitised HTML export |
| Data | JSON Formatter | Format, minify, validate with line/column errors, tree view, path list, stats |
| Data | Encoder / Decoder | Base64, Base64URL, hex, URL, binary and ROT13 in both directions |
| Data | CSV Viewer | Auto-delimiter parsing, sortable table, per-column type and statistics, JSON export |
| Web | URL Parser | Component breakdown, path segments, editable query string |
| Web | HTML Entities | Encode, decode and sanitise untrusted markup (DOMPurify) |
| Web | JWT Decoder | Header and claim inspection, expiry status — decode only, never verified |
| Color | Color Picker | HEX/RGB/HSL/OKLCH/CMYK, contrast table, tint and shade ramp |
| Color | Palette Generator | Harmonies, 50→950 tonal scale, gradients, CSS/SCSS/Tailwind/JSON export |
| Color | Contrast Checker | WCAG AA/AAA verdicts, live previews, automatic accessible suggestions |
| Time | Cron Builder | 5-field crontab parser, plain-English description, next 10 runs in any timezone |
| Time | Timestamp Converter | Unix ↔ ISO ↔ local, date parts, ISO week, world clock |
| Generate | UUID & Random | UUID v4/v7, ULID, Nano ID, random strings, numbers, colors, lorem ipsum |
| Generate | Password Strength | Entropy estimate, crack-time table, generator (random, passphrase, PIN) |
| Media | Emoji Picker | 700+ emoji and technical symbols, copy as glyph, code point, entity or escape |
| Media | Image Tools | Resize, compress and convert to WebP/JPEG/PNG on a canvas |

## Design

GitHub-inspired: minimal surfaces, rounded borders, light and dark themes driven by CSS
custom properties in `src/styles/global.css`. The theme follows the system preference and
is overridable from the top bar; the choice persists in `localStorage`.

The left sidebar collapses to an icon rail on desktop and becomes an off-canvas drawer
below 900px. Press <kbd>/</kbd> anywhere to jump to the tool filter.

Icons come from [RemixIcon](https://github.com/Remix-Design/RemixIcon) and are inlined as
SVG at build time by `src/lib/icons.ts` — no icon font, no runtime requests.

## Stack

Astro 5 with zero UI frameworks. Each tool is a static page whose `<script>` module only
wires the DOM — every piece of logic worth trusting lives in a plain TypeScript module
under `src/lib/`, which is what the test suite exercises. The only runtime dependencies are
`marked` and `dompurify`, used by the Markdown and HTML tools.

```text
src/
├── components/    Icon, CopyButton, Sidebar
├── layouts/       BaseLayout (shell, theme, nav), ToolLayout
├── lib/           tools registry + one module per tool's logic
├── pages/
│   ├── index.astro
│   └── tools/     one page per tool (DOM wiring only)
└── styles/global.css
tests/             one spec per lib module
```

## Tests

`npm test` runs 347 Vitest specs over `src/lib/` — the parsers, converters and generators
behind every tool. Pages themselves are deliberately thin, so a green suite means the tool
behaviour is intact.

The specs pin down the things that are easy to break silently: UTF-8 round trips through
every encoder, RFC 4180 quoting, the crontab "day-of-month **or** day-of-week" quirk, ISO
week numbers at year boundaries, WCAG ratios and thresholds, LCS diff output and `diff -u`
hunk headers, UUID version/variant bits, and the entropy penalties. `tests/registry.test.ts`
also checks the registry against the filesystem: every tool has a page, every page is
registered, and every RemixIcon name actually resolves.

Dates are asserted in UTC (`vitest.config.ts` pins `TZ`), so the suite gives the same result
on any machine. `npm run test:watch` reruns on save.

Pushing to `main` runs `npm run check` and `npm test` before anything is built or published
— see `.github/workflows/deploy.yml`.

## Commands

| Command | Action |
| :--- | :--- |
| `npm install` | Install dependencies |
| `npm run dev` | Dev server at http://localhost:4321/devtoys/ |
| `npm run build` | Build the static site to `./dist/` |
| `npm run preview` | Preview the build locally |
| `npm run check` | Type-check with `astro check` |
| `npm test` | Run the unit tests once |
| `npm run test:watch` | Run the unit tests in watch mode |

## Deployment

Pushing to `main` builds and publishes to GitHub Pages via
`.github/workflows/deploy.yml`. The `base` path is `/devtoys`, so use `url()` from
`src/lib/paths.ts` for any internal link rather than hard-coding a path.

## Adding a tool

1. Add an entry to `TOOLS` in `src/lib/tools.ts` (slug, name, description, category,
   keywords, and a RemixIcon name).
2. Put the logic in `src/lib/<tool>.ts` as pure functions, and cover it in
   `tests/<tool>.test.ts`.
3. Create `src/pages/tools/<slug>.astro` wrapped in `<ToolLayout slug="<slug>">`, with a
   `<script>` block that only reads inputs, calls the module and writes the DOM. Import
   helpers from `src/lib/dom.ts`.

The sidebar, home page and search pick the tool up from the registry automatically, and
`tests/registry.test.ts` fails if the entry and the page ever drift apart.
