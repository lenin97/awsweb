// lib/env.server.ts
// Server-only environment helper & validated + sanitized constants.

import { sanitizeEnvValue, sanitizeUrl } from './Utilsseoscripts'

function getRequiredEnv(name: string): string {
  const v = process.env[name]
  if (!v) {
    const runtime = process.env.NEXT_RUNTIME ?? 'unknown'
    throw new Error(`Missing env var: ${name} (runtime=${runtime})`)
  }
  return v
}

/**
 * Accepts either:
 *  - absolute URL (new URL succeeds), e.g. "https://example.com/path"
 *  - or a root-relative path starting with "/", e.g. "/images/logo.png"
 */
function validateUrlOrPath(value: string, name: string): string {
  // Allow root-relative paths
  if (value.startsWith('/')) return value

  try {
    // new URL will throw for invalid URLs
    new URL(value)
    return value
  } catch (err) {
    throw new Error(
      `Environment variable ${name} must be an absolute URL or a root-relative path. Got: ${value}`
    )
  }
}

/** Basic RFC-5322-light email check (sufficient for sanity validation). */
function validateEmail(value: string, name: string): string {
  const simpleEmailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!simpleEmailRe.test(value)) {
    throw new Error(`Environment variable ${name} must be a valid email address. Got: ${value}`)
  }
  return value
}

/* --- Read, validate, then sanitize env vars --- */

// Base domain (may be absolute or root-relative) — sanitizeUrl keeps root-relative as-is
export const TCV_BASE_DOMAIN = sanitizeUrl(
  validateUrlOrPath(getRequiredEnv('TCV_BASE_DOMAIN'), 'TCV_BASE_DOMAIN')
)

export const TCV_SUBDOMAIN_TOOL_CV = sanitizeUrl(
  validateUrlOrPath(getRequiredEnv('TCV_SUBDOMAIN_TOOL_CV'), 'TCV_SUBDOMAIN_TOOL_CV')
)

// App name (trim + remove control chars)
export const TCV_APP_NAME_HEADER = sanitizeEnvValue(getRequiredEnv('TCV_APP_NAME_HEADER'))//

// Opengraph: allow either a path like '/images/logo.png' or absolute URL
export const TCV_OPENGRAPH_IMG = sanitizeUrl(
  validateUrlOrPath(getRequiredEnv('TCV_OPENGRAPH_IMG'), 'TCV_OPENGRAPH_IMG')
)
export const TCV_OPENGRAPH_META_ROUTE = sanitizeUrl(
  validateUrlOrPath(getRequiredEnv('TCV_OPENGRAPH_META_ROUTE'), 'TCV_OPENGRAPH_META_ROUTE')
)

// Email (basic validation)
export const TCV_EMAIL_CONTACT = sanitizeEnvValue(
  validateEmail(getRequiredEnv('TCV_EMAIL_CONTACT'), 'TCV_EMAIL_CONTACT')
)

// Social/profile URLs (validated as absolute or root-relative)
export const TCV_INST_PROFILE = sanitizeUrl(
  validateUrlOrPath(getRequiredEnv('TCV_INST_PROFILE'), 'TCV_INST_PROFILE')
)
export const TCV_LINKEDIN_PROFILE = sanitizeUrl(
  validateUrlOrPath(getRequiredEnv('TCV_LINKEDIN_PROFILE'), 'TCV_LINKEDIN_PROFILE')
)
export const TCV_TIKTOK_PROFILE = sanitizeUrl(
  validateUrlOrPath(getRequiredEnv('TCV_TIKTOK_PROFILE'), 'TCV_TIKTOK_PROFILE')
)
export const TCV_X_PROFILE = sanitizeUrl(
  validateUrlOrPath(getRequiredEnv('TCV_X_PROFILE'), 'TCV_X_PROFILE')
)

export const TCV_CDN = sanitizeUrl(
  validateUrlOrPath(getRequiredEnv('TCV_CDN'), 'TCV_CDN')
)