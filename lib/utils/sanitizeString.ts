// lib/utils/sanitizeString.ts
// Lightweight and contextual sanitizers. Do NOT use the JSON-LD escaper for URLs/attributes.

export function sanitizeEnvValue(input: unknown): string {
  // trims and removes control characters; safe for env values used programmatically
  const s = String(input ?? '')
  return s.trim().replace(/[\u0000-\u001F\u007F]+/g, '')
}

/**
 * Escape text specifically for embedding into an inline JSON-LD <script> block.
 * This produces the \u00xx escapes used to avoid closing </script> or introducing HTML.
 * Use ONLY when injecting raw JSON into HTML (i.e. dangerouslySetInnerHTML for JSON-LD).
 */
export function escapeForJsonLd(input: string): string {
  return input
    .replace(/&/g, '\\u0026')
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    // defensively escape sequence that could close a script tag
    .replace(/<\/script/gi, '<\\/script')
}

/**
 * Sanitize/normalize URL-like values.
 * - If root-relative ("/...") returns as-is.
 * - If absolute, returns canonical `new URL(...).toString()`.
 * - If invalid absolute, falls back to encodeURI or the original string.
 */
export function sanitizeUrl(input: unknown): string {
  const s = String(input ?? '').trim()
  if (!s) return s
  if (s.startsWith('/')) return s
  try {
    const u = new URL(s)
    return u.toString()
  } catch {
    try {
      return encodeURI(s)
    } catch {
      return s
    }
  }
}
