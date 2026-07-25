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

Astro 5 with zero UI frameworks. Each tool is a static page whose logic lives in a plain
TypeScript `<script>` module, so a page only ships the code it needs. Shared logic sits in
`src/lib/` (`color`, `cron`, `diff`, `emoji`, `dom` helpers). The only runtime dependencies
are `marked` and `dompurify`, used by the Markdown and HTML tools.

```text
src/
├── components/    Icon, CopyButton, Sidebar
├── layouts/       BaseLayout (shell, theme, nav), ToolLayout
├── lib/           tools registry + shared logic
├── pages/
│   ├── index.astro
│   └── tools/     one page per tool
└── styles/global.css
```

## Commands

| Command | Action |
| :--- | :--- |
| `npm install` | Install dependencies |
| `npm run dev` | Dev server at http://localhost:4321/devtoys/ |
| `npm run build` | Build the static site to `./dist/` |
| `npm run preview` | Preview the build locally |
| `npm run check` | Type-check with `astro check` |

## Deployment

Pushing to `main` builds and publishes to GitHub Pages via
`.github/workflows/deploy.yml`. The `base` path is `/devtoys`, so use `url()` from
`src/lib/paths.ts` for any internal link rather than hard-coding a path.

## Adding a tool

1. Add an entry to `TOOLS` in `src/lib/tools.ts` (slug, name, description, category,
   keywords, and a RemixIcon name).
2. Create `src/pages/tools/<slug>.astro` wrapped in `<ToolLayout slug="<slug>">`.
3. Put the logic in a `<script>` block; import helpers from `src/lib/dom.ts`.

The sidebar, home page and search pick the tool up from the registry automatically.
