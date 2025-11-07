// utils/safeRedirect.ts

/**
 * Ensures a redirect path is safe:
 * - Must be a relative path starting with `/`
 * - Must not start with `//` (no protocol-relative URLs)
 * - Must not contain `http://` or `https://`
 */
export function getSafeRedirectPath(path: string | null | undefined, fallback = '/dashboard'): string {
  if (
    typeof path !== 'string' ||
    !path.startsWith('/') ||
    path.startsWith('//') ||
    path.includes('http://') ||
    path.includes('https://')
  ) {
    return fallback
  }

  return path
}
