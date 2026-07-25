/** Helpers for the Markdown Preview tool (rendering itself uses marked). */

export interface ReadingStats {
  words: number;
  lines: number;
  minutes: number;
}

/** 220 words per minute is the usual reading-time convention. */
export function readingStats(markdown: string): ReadingStats {
  const words = markdown.trim() ? markdown.trim().split(/\s+/).length : 0;
  return {
    words,
    lines: markdown === '' ? 0 : markdown.split('\n').length,
    minutes: Math.max(1, Math.round(words / 220)),
  };
}

/** Wraps rendered HTML in a self-contained, styled document for export. */
export function fullDocument(body: string): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Document</title>
<style>
  body { max-width: 720px; margin: 40px auto; padding: 0 20px;
         font: 16px/1.6 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #1f2328; }
  pre { background: #f6f8fa; padding: 14px; border-radius: 8px; overflow-x: auto; }
  code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 0.9em; }
  table { border-collapse: collapse; width: 100%; }
  th, td { border: 1px solid #d1d9e0; padding: 6px 12px; text-align: left; }
  blockquote { margin: 0; padding-left: 16px; border-left: 4px solid #d1d9e0; color: #59636e; }
  img { max-width: 100%; }
</style>
</head>
<body>
${body}
</body>
</html>`;
}
