// app/(marketing)/head.tsx
import type { ReactElement } from 'react'
import { crawljsonscript } from '@/lib/mdxSAs/crawljsonscript'
import { escapeForJsonLd, sanitizeEnvValue } from '@/lib/utils/sanitizeString'
import { TCV_BASE_DOMAIN, TCV_APP_NAME_HEADER, TCV_OPENGRAPH_IMG } from '@/lib/env.server'
import {resolveAbsoluteUrl} from '@/lib/utils/resolveAbsoluteUrl'
import {ItemListPosts} from '@/lib/mdxSAs/ItemListPosts'

export async function ScriptHome(): Promise<ReactElement | null> {
  const data = await crawljsonscript('home')
  if (!data) return null

  // Use validated & sanitized env exports (from env.server)
  const domain = TCV_BASE_DOMAIN
  const siteName = TCV_APP_NAME_HEADER
  const logoRelative = TCV_OPENGRAPH_IMG

  // Sanitize content fields returned by crawljsonscript (trim + remove control chars)
  const headline = sanitizeEnvValue(data.title ?? '')
  const description = sanitizeEnvValue(data.excerpt ?? '')
  const authorName = sanitizeEnvValue(data.authorName ?? siteName)

  // Logo URL (resolve env-provided opengraph path against base if possible)
  const logoUrl = resolveAbsoluteUrl(domain, sanitizeEnvValue(logoRelative ?? ''))

  const published = new Date(data.createdAt ?? Date.now()).toISOString()
  const modified = data.updatedAt ? new Date(data.updatedAt).toISOString() : published

  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline,
    description,
    url: domain,
    datePublished: published,
    dateModified: modified,
    author: { '@type': 'Person', name: authorName },
    publisher: {
      '@type': 'Organization',
      name: siteName,
      logo: { '@type': 'ImageObject', url: logoUrl },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': domain },
  }

  // add image only if present (resolve relative/absolute)
  if (data.ogImage) {
    const safeOgImagePath = sanitizeEnvValue(data.ogImage)
    const ogImageUrl = resolveAbsoluteUrl(domain, safeOgImagePath)
    jsonLd.image = [
      {
        '@type': 'ImageObject',
        url: ogImageUrl,
        width: data.ogImageWidth ?? 1200,
        height: data.ogImageHeight ?? 630,
      },
    ]
  }

   // --- New: attempt to fetch the ItemList generated server-side ---
  let itemListObject: Record<string, unknown> | null = null
  try {
    const maybeItemList = await ItemListPosts()
    if (maybeItemList && typeof maybeItemList === 'object') {
      itemListObject = maybeItemList
    }
  } catch (err) {
    // Non-fatal: log and continue with Article only
    // Keep logs minimal to avoid noisy server logs in production; this is helpful during development.
    // eslint-disable-next-line no-console
    console.warn('[ScriptHome] ItemListPosts failed to return ItemList:', err)
  }

  // Compose final JSON-LD payload. If we have an ItemList, include both objects in an array so crawlers
  // can consume both the Article metadata and the collection metadata for the landing page.
  const finalJsonLdPayload = itemListObject ? [jsonLd, itemListObject] : jsonLd

  // Escape for JSON-LD only once, right before injecting into the HTML head.
  const jsonLdStr = escapeForJsonLd(JSON.stringify(finalJsonLdPayload))

  return (
    <>
      <script
        id="homepage-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdStr }}
      />
    </>
  )
}
