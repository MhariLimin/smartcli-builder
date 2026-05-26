// Share-by-link encode/decode. Pure client-side — no backend round-trip — so
// the feature is deployable independently of the API. URL shape is
// `/c/<base64url-encoded JSON>`; payload keys are kept short ({ c, k }) to
// trim base64's ~33% overhead so more commands fit under the URL ceiling.

/** Maximum length of the generated `/c/<...>` URL fragment we'll emit. */
export const MAX_URL_LEN = 1900;

/** What `encode()` emits and `decode()` returns when the payload is valid. */
export interface SharePayload {
  cmd: string;
  cat?: string;
}

/** Reasons the caller may want to refuse turning a command into a share link. */
export type ShareRefusal =
  | { kind: 'empty' }
  | { kind: 'too-long'; length: number }
  | { kind: 'contains-secret'; reason: string };

export type EncodeResult =
  | { ok: true; path: string; url: string }
  | { ok: false; refusal: ShareRefusal };

// Patterns that almost certainly indicate a credential the user shouldn't
// be putting in a URL. False positives are acceptable — better to warn
// loudly than leak a token to Slack's link-preview cache. Matched
// case-insensitively against the full command.
const SECRET_PATTERNS: { re: RegExp; reason: string }[] = [
  { re: /--?password[=\s]\S+/i, reason: 'looks like a --password flag' },
  { re: /--?token[=\s]\S+/i, reason: 'looks like a --token flag' },
  { re: /--?api[-_]?key[=\s]\S+/i, reason: 'looks like an --api-key flag' },
  { re: /--?secret[=\s]\S+/i, reason: 'looks like a --secret flag' },
  { re: /\bbearer\s+[A-Za-z0-9._\-]+/i, reason: 'looks like a Bearer token' },
  { re: /\bauthorization\s*[:=]\s*\S+/i, reason: 'looks like an Authorization header' },
  { re: /\b(password|token|api[-_]?key|secret)\s*=\s*\S+/i, reason: 'looks like a credential assignment' }
];

/** Detect the first matching secret pattern, if any. Returns the reason or null. */
export function detectSecret(command: string): string | null {
  for (const p of SECRET_PATTERNS) {
    if (p.re.test(command)) return p.reason;
  }
  return null;
}

// Browser btoa/atob are byte-based and choke on non-ASCII; round-trip through
// TextEncoder/TextDecoder so emoji, accents, and UTF-8 in commands survive.
function bytesToBase64Url(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToBytes(input: string): Uint8Array {
  // Normalize back to standard base64 + padding before decoding.
  let s = input.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4 !== 0) s += '=';
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/** Build the `/c/<...>` path (and full URL) for a command, or refuse. */
export function encode(command: string, category?: string): EncodeResult {
  const cmd = (command ?? '').trim();
  if (!cmd) return { ok: false, refusal: { kind: 'empty' } };
  const secret = detectSecret(cmd);
  if (secret) return { ok: false, refusal: { kind: 'contains-secret', reason: secret } };

  const payload: SharePayload = { cmd };
  if (category && category.trim()) payload.cat = category.trim();

  const json = JSON.stringify(payload);
  const enc = new TextEncoder().encode(json);
  const b64 = bytesToBase64Url(enc);
  const path = '/c/' + b64;

  // Origin may not be available (SSR-style guard). Fall back to '' so callers
  // get just the path; absolute URL is for copy-to-clipboard.
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const url = origin + path;
  if (url.length > MAX_URL_LEN) {
    return { ok: false, refusal: { kind: 'too-long', length: url.length } };
  }
  return { ok: true, path, url };
}

/**
 * Decode a base64url payload back into { cmd, cat? }. Returns null for any
 * malformed input — invalid base64, non-JSON contents, missing `cmd`. The
 * caller should route the user to the Builder with an inline error toast
 * when this happens.
 */
export function decode(payload: string): SharePayload | null {
  if (!payload) return null;
  try {
    const json = new TextDecoder().decode(base64UrlToBytes(payload));
    const obj = JSON.parse(json) as Partial<SharePayload>;
    if (typeof obj?.cmd !== 'string' || !obj.cmd.trim()) return null;
    const out: SharePayload = { cmd: obj.cmd };
    if (typeof obj.cat === 'string' && obj.cat.trim()) out.cat = obj.cat;
    return out;
  } catch {
    return null;
  }
}

/** Human-readable explanation of an encode() refusal — surfaced in toasts. */
export function describeRefusal(r: ShareRefusal): string {
  switch (r.kind) {
    case 'empty':
      return 'Nothing to share — type a command first.';
    case 'too-long':
      return `Command is too long for a share link (${r.length} chars > ${MAX_URL_LEN}). Copy the command instead.`;
    case 'contains-secret':
      return `Refused to share: ${r.reason}. Strip the credential and try again.`;
  }
}

/**
 * Convenience for per-row Share buttons (History / Saved / Catalog rows).
 * Encodes the command, copies the URL to the clipboard, and returns a
 * message the caller can drop into a brief inline flash. `ok` is true on
 * the green-path "link copied" branch and false for both refusals and
 * clipboard failures, so a single flash slot can render both states.
 */
export async function shareCommandToClipboard(
  command: string,
  category?: string
): Promise<{ ok: boolean; message: string }> {
  const result = encode(command, category);
  if (!result.ok) return { ok: false, message: describeRefusal(result.refusal) };
  try {
    await navigator.clipboard.writeText(result.url);
    return { ok: true, message: 'link copied — anyone with it can read the command' };
  } catch {
    return { ok: false, message: 'Clipboard blocked. Link: ' + result.url };
  }
}
