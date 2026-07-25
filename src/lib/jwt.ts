/**
 * JWT inspection. Decoding only — signatures are never verified here, since
 * that needs the issuer's key and would defeat the point of an offline tool.
 */

export interface DecodedJwt {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  signature: string;
  parts: [string, string, string];
}

export class JwtError extends Error {}

export interface ClaimInfo {
  name: string;
  meaning: string;
  time?: boolean;
}

export const CLAIMS: Record<string, ClaimInfo> = {
  iss: { name: 'Issuer', meaning: 'Who created and signed this token.' },
  sub: { name: 'Subject', meaning: 'Who the token is about — usually a user id.' },
  aud: { name: 'Audience', meaning: 'Who the token is intended for.' },
  exp: { name: 'Expires at', meaning: 'Must be rejected on or after this time.', time: true },
  nbf: { name: 'Not before', meaning: 'Must be rejected before this time.', time: true },
  iat: { name: 'Issued at', meaning: 'When the token was created.', time: true },
  jti: { name: 'JWT ID', meaning: 'Unique identifier, used to prevent replay.' },
  alg: { name: 'Algorithm', meaning: 'Signing algorithm used for the signature.' },
  typ: { name: 'Type', meaning: 'Media type of the token — normally JWT.' },
  kid: { name: 'Key ID', meaning: 'Which key from the key set signed this token.' },
  scope: { name: 'Scope', meaning: 'Granted OAuth scopes.' },
  azp: { name: 'Authorised party', meaning: 'The client the token was issued to.' },
};

export function decodeSegment(segment: string): unknown {
  const padded = segment.replace(/-/g, '+').replace(/_/g, '/');
  const full = padded + '='.repeat((4 - (padded.length % 4)) % 4);
  const bytes = Uint8Array.from(atob(full), (c) => c.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}

/** Strips an optional `Bearer ` prefix and surrounding whitespace. */
export function normalizeToken(raw: string): string {
  return raw.trim().replace(/^bearer\s+/i, '');
}

export function decodeJwt(raw: string): DecodedJwt {
  const token = normalizeToken(raw);
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new JwtError(`A JWT has three dot-separated parts; this one has ${parts.length}.`);
  }

  let header: Record<string, unknown>;
  let payload: Record<string, unknown>;

  try {
    header = decodeSegment(parts[0]) as Record<string, unknown>;
  } catch {
    throw new JwtError('The header is not valid base64url-encoded JSON.');
  }
  try {
    payload = decodeSegment(parts[1]) as Record<string, unknown>;
  } catch {
    throw new JwtError('The payload is not valid base64url-encoded JSON.');
  }

  return { header, payload, signature: parts[2], parts: parts as [string, string, string] };
}

export interface Expiry {
  state: 'none' | 'expired' | 'pending' | 'valid';
  label: string;
  badge: string;
}

/** Summarises `exp`/`nbf` relative to `now` (epoch seconds). */
export function expiryStatus(
  payload: Record<string, unknown>,
  now = Math.floor(Date.now() / 1000),
): Expiry {
  const exp = typeof payload.exp === 'number' ? payload.exp : null;
  const nbf = typeof payload.nbf === 'number' ? payload.nbf : null;
  const human = (minutes: number) =>
    minutes < 60 ? `${minutes} min` : `${Math.round(minutes / 60)} h`;

  if (exp === null) {
    return { state: 'none', label: 'No expiry claim', badge: 'badge-attention' };
  }
  if (exp < now) {
    return {
      state: 'expired',
      label: `Expired ${human(Math.round((now - exp) / 60))} ago`,
      badge: 'badge-danger',
    };
  }
  if (nbf !== null && nbf > now) {
    return { state: 'pending', label: 'Not valid yet', badge: 'badge-attention' };
  }
  return {
    state: 'valid',
    label: `Valid for ${human(Math.round((exp - now) / 60))}`,
    badge: 'badge-success',
  };
}

export function algorithmNote(header: Record<string, unknown>): string {
  const alg = String(header.alg ?? 'unknown');
  return alg === 'none'
    ? 'alg is "none" — this token is unsigned and must never be trusted.'
    : `Signed with ${alg}. Verification needs the issuer's secret or public key and is deliberately not done here.`;
}

export function formatClaim(key: string, value: unknown): string {
  if (CLAIMS[key]?.time && typeof value === 'number') {
    const date = new Date(value * 1000);
    return `${value} — ${date.toLocaleString()} (${date.toISOString()})`;
  }
  if (Array.isArray(value)) return value.join(', ');
  if (value && typeof value === 'object') return JSON.stringify(value);
  return String(value);
}
