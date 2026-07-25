const BASE = import.meta.env.BASE_URL.replace(/\/+$/, '');

/** Build a site-absolute URL that respects the configured `base` path. */
export function url(path = '/'): string {
  const suffix = path.startsWith('/') ? path : `/${path}`;
  return `${BASE}${suffix}` || '/';
}
