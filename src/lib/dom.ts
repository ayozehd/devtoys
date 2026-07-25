/** Small client-side helpers shared by every tool page. */

export function $<T extends HTMLElement = HTMLElement>(selector: string, root: ParentNode = document): T {
  const el = root.querySelector<T>(selector);
  if (!el) throw new Error(`Element not found: ${selector}`);
  return el;
}

export function $$<T extends HTMLElement = HTMLElement>(
  selector: string,
  root: ParentNode = document,
): T[] {
  return Array.from(root.querySelectorAll<T>(selector));
}

export function on<K extends keyof HTMLElementEventMap>(
  el: HTMLElement | Document | Window,
  type: K,
  handler: (ev: HTMLElementEventMap[K]) => void,
): void {
  el.addEventListener(type, handler as EventListener);
}

/** Runs `fn` now and on every `input`/`change` of the given elements. */
export function live(els: HTMLElement[], fn: () => void): void {
  for (const el of els) {
    el.addEventListener('input', fn);
    el.addEventListener('change', fn);
  }
  fn();
}

export function debounce<A extends unknown[]>(fn: (...args: A) => void, ms = 180) {
  let timer: number | undefined;
  return (...args: A) => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => fn(...args), ms);
  };
}

export async function copyText(text: string): Promise<boolean> {
  if (!text) return false;
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Clipboard API needs a secure context; fall back to a hidden textarea.
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
      document.body.appendChild(ta);
      ta.select();
      // execCommand is deprecated but remains the only insecure-context fallback.
      const ok = document.execCommand('copy');
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

/** Briefly swaps a button's label to give copy feedback. */
export function flashButton(btn: HTMLElement, message = 'Copied', ms = 1400): void {
  const labelEl = btn.querySelector('span') ?? btn;
  const original = btn.dataset.copyLabel ?? labelEl.textContent ?? '';
  labelEl.textContent = message;
  btn.classList.add('copied');
  window.setTimeout(() => {
    labelEl.textContent = original;
    btn.classList.remove('copied');
  }, ms);
}

function readValue(el: Element): string {
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) return el.value;
  return el.textContent ?? '';
}

/** Delegated handler for every `[data-copy-target]` / `[data-copy-value]` button. */
export function initCopyButtons(): void {
  document.addEventListener('click', async (event) => {
    const btn = (event.target as HTMLElement | null)?.closest<HTMLElement>(
      '[data-copy-target],[data-copy-value]',
    );
    if (!btn) return;

    let text = btn.dataset.copyValue ?? '';
    if (!text && btn.dataset.copyTarget) {
      const source = document.getElementById(btn.dataset.copyTarget);
      text = source ? readValue(source) : '';
    }

    if (!text.trim()) {
      flashButton(btn, 'Nothing to copy');
      return;
    }
    flashButton(btn, (await copyText(text)) ? 'Copied' : 'Failed');
  });
}

/** Triggers a client-side file download. */
export function download(filename: string, content: BlobPart, type = 'text/plain'): void {
  const blob = content instanceof Blob ? content : new Blob([content], { type });
  const href = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(href), 1000);
}

/** Escapes text for safe interpolation into innerHTML. */
export function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes)) return '—';
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let value = bytes / 1024;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i++;
  }
  return `${value.toFixed(value < 10 ? 2 : 1)} ${units[i]}`;
}

/** Reads/writes a tool's persisted state (best-effort). */
export function store(key: string) {
  const full = `devtoys:${key}`;
  return {
    get(): string | null {
      try {
        return localStorage.getItem(full);
      } catch {
        return null;
      }
    },
    set(value: string): void {
      try {
        localStorage.setItem(full, value);
      } catch {
        /* ignore */
      }
    },
  };
}

/** Wires a `.segmented` group; calls `onChange` with the selected value. */
export function segmented(root: HTMLElement, onChange: (value: string) => void): void {
  root.addEventListener('click', (event) => {
    const btn = (event.target as HTMLElement).closest('button');
    if (!btn || !root.contains(btn)) return;
    for (const b of root.querySelectorAll('button')) {
      b.setAttribute('aria-selected', String(b === btn));
    }
    onChange(btn.dataset.value ?? btn.textContent ?? '');
  });
}
