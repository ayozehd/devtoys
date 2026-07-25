export interface Tool {
  slug: string;
  name: string;
  short: string;
  description: string;
  category: Category;
  keywords: string[];
  /** RemixIcon name, inlined at build time (see `lib/icons.ts`). */
  icon: string;
}

export type Category = 'Text' | 'Data' | 'Web' | 'Color' | 'Time' | 'Generate' | 'Media';

export const CATEGORIES: Category[] = [
  'Text',
  'Data',
  'Web',
  'Color',
  'Time',
  'Generate',
  'Media',
];


export const TOOLS: Tool[] = [
  {
    slug: 'regex-tester',
    name: 'Regex Tester',
    short: 'Regex',
    description: 'Test and visualise regular expressions with live match highlighting.',
    category: 'Text',
    keywords: ['regexp', 'pattern', 'match', 'capture', 'group'],
    icon: 'find-replace-line',
  },
  {
    slug: 'cron-builder',
    name: 'Cron Builder',
    short: 'Cron',
    description: 'Build cron expressions in plain English and preview the next runs.',
    category: 'Time',
    keywords: ['crontab', 'schedule', 'job', 'timer'],
    icon: 'calendar-schedule-line',
  },
  {
    slug: 'timestamp-converter',
    name: 'Timestamp Converter',
    short: 'Timestamp',
    description: 'Convert between Unix timestamps, ISO 8601 dates and timezones.',
    category: 'Time',
    keywords: ['unix', 'epoch', 'date', 'iso', 'utc', 'timezone'],
    icon: 'time-line',
  },
  {
    slug: 'json-formatter',
    name: 'JSON Formatter',
    short: 'JSON',
    description: 'Format, validate, minify and explore JSON as an interactive tree.',
    category: 'Data',
    keywords: ['pretty', 'beautify', 'minify', 'validate', 'tree'],
    icon: 'braces-line',
  },
  {
    slug: 'text-diff',
    name: 'Text Diff',
    short: 'Diff',
    description: 'Compare two texts side-by-side or as a unified patch.',
    category: 'Text',
    keywords: ['compare', 'patch', 'changes', 'merge'],
    icon: 'git-pull-request-line',
  },
  {
    slug: 'encoder-decoder',
    name: 'Encoder / Decoder',
    short: 'Encode',
    description: 'Base64, hex, URL, binary and ROT13 conversions in both directions.',
    category: 'Data',
    keywords: ['base64', 'hex', 'url', 'binary', 'rot13', 'escape'],
    icon: 'code-s-slash-line',
  },
  {
    slug: 'csv-viewer',
    name: 'CSV Viewer',
    short: 'CSV',
    description: 'View CSV/TSV as a sortable table with per-column statistics.',
    category: 'Data',
    keywords: ['tsv', 'spreadsheet', 'table', 'analyze', 'sum', 'json'],
    icon: 'table-line',
  },
  {
    slug: 'url-parser',
    name: 'URL Parser',
    short: 'URL',
    description: 'Break a URL into parts and edit its query string visually.',
    category: 'Web',
    keywords: ['query', 'params', 'querystring', 'uri', 'link'],
    icon: 'links-line',
  },
  {
    slug: 'html-entities',
    name: 'HTML Entities',
    short: 'Entities',
    description: 'Encode/decode HTML entities and sanitise untrusted markup.',
    category: 'Web',
    keywords: ['escape', 'xss', 'sanitize', 'markup', 'amp'],
    icon: 'window-line',
  },
  {
    slug: 'jwt-decoder',
    name: 'JWT Decoder',
    short: 'JWT',
    description: 'Decode JSON Web Token headers and claims — entirely offline.',
    category: 'Web',
    keywords: ['token', 'jose', 'claims', 'bearer', 'auth'],
    icon: 'shield-keyhole-line',
  },
  {
    slug: 'color-picker',
    name: 'Color Picker',
    short: 'Color',
    description: 'Pick a color and convert between HEX, RGB, HSL and OKLCH.',
    category: 'Color',
    keywords: ['hex', 'rgb', 'hsl', 'hsla', 'oklch', 'convert'],
    icon: 'drop-line',
  },
  {
    slug: 'palette-generator',
    name: 'Palette Generator',
    short: 'Palette',
    description: 'Generate harmonies, tints, shades and CSS gradients from one color.',
    category: 'Color',
    keywords: ['analogous', 'complementary', 'triadic', 'gradient', 'scale'],
    icon: 'palette-line',
  },
  {
    slug: 'contrast-checker',
    name: 'Contrast Checker',
    short: 'Contrast',
    description: 'Check WCAG AA/AAA contrast ratios with live text previews.',
    category: 'Color',
    keywords: ['wcag', 'a11y', 'accessibility', 'ratio', 'aa', 'aaa'],
    icon: 'accessibility-line',
  },
  {
    slug: 'case-converter',
    name: 'Case Converter',
    short: 'Case',
    description: 'Slugify and convert to camelCase, snake_case, kebab-case and more.',
    category: 'Text',
    keywords: ['slug', 'camel', 'snake', 'kebab', 'pascal', 'title', 'transform'],
    icon: 'font-size',
  },
  {
    slug: 'markdown-preview',
    name: 'Markdown Preview',
    short: 'Markdown',
    description: 'Live Markdown preview with sanitised HTML export.',
    category: 'Text',
    keywords: ['md', 'gfm', 'html', 'export', 'preview'],
    icon: 'markdown-line',
  },
  {
    slug: 'uuid-generator',
    name: 'UUID & Random',
    short: 'UUID',
    description: 'Generate UUIDs, ULID-like ids, random strings, numbers and colors.',
    category: 'Generate',
    keywords: ['guid', 'nanoid', 'random', 'id', 'token', 'lorem'],
    icon: 'dice-line',
  },
  {
    slug: 'password-strength',
    name: 'Password Strength',
    short: 'Password',
    description: 'Estimate entropy and crack time, and generate strong passwords.',
    category: 'Generate',
    keywords: ['entropy', 'bits', 'secure', 'passphrase', 'strength'],
    icon: 'key-2-line',
  },
  {
    slug: 'emoji-picker',
    name: 'Emoji Picker',
    short: 'Emoji',
    description: 'Search emoji and symbols, copy the glyph or its code point.',
    category: 'Media',
    keywords: ['unicode', 'symbol', 'glyph', 'copy', 'icon'],
    icon: 'emotion-line',
  },
  {
    slug: 'image-tools',
    name: 'Image Tools',
    short: 'Image',
    description: 'Resize, compress and convert images to WebP/JPEG/PNG in-browser.',
    category: 'Media',
    keywords: ['resize', 'compress', 'webp', 'jpeg', 'png', 'convert', 'optimize'],
    icon: 'image-edit-line',
  },
];

export const TOOLS_BY_CATEGORY = CATEGORIES.map((category) => ({
  category,
  tools: TOOLS.filter((t) => t.category === category),
})).filter((g) => g.tools.length > 0);

export function getTool(slug: string): Tool {
  const tool = TOOLS.find((t) => t.slug === slug);
  if (!tool) throw new Error(`Unknown tool: ${slug}`);
  return tool;
}
