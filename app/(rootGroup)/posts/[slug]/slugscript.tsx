// app/posts/[slug]/head.tsx 
import type { ReactElement } from 'react'
import { getCachePostSlug } from '@/lib/mdxSAs/getCachePostSlug'
import { notFound } from 'next/navigation'
import { escapeForJsonLd, sanitizeEnvValue } from '@/lib/utils/sanitizeString'
import { TCV_BASE_DOMAIN, TCV_APP_NAME_HEADER, TCV_OPENGRAPH_IMG } from '@/lib/env.server'
import {resolveAbsoluteUrl} from '@/lib/utils/resolveAbsoluteUrl'

interface HeadProps {
  slug: string
}

export async function SlugScript({ slug }: HeadProps): Promise<ReactElement | null> {
  // Fetch post + meta
  const result = await getCachePostSlug(slug)
  if (!result) return notFound()
  const { post, articleMeta } = result
  if (!post) return null

  // Use validated & sanitized env exports
  const domain = TCV_BASE_DOMAIN
  const siteName = TCV_APP_NAME_HEADER
  const logoPath = TCV_OPENGRAPH_IMG

  // Lightweight sanitization of dynamic content (trim + remove control chars)
  const title = sanitizeEnvValue(post.title ?? '')
  const description = sanitizeEnvValue(post.description ?? '')

  // Normalize authors: articleMeta.authors may be string or array
  let rawAuthors = articleMeta?.authors || siteName
  if (Array.isArray(rawAuthors)) rawAuthors = rawAuthors.join(', ')
  const authorName = rawAuthors // already expected to be safe; keep as-is

  // Canonical URL for this post (prefer absolute if base is absolute)
  const path = `/posts/${encodeURIComponent(slug)}`
  const canonicalUrl = resolveAbsoluteUrl(domain, path)

  // Logo / image resolution
  const logoUrl = resolveAbsoluteUrl(domain, logoPath || '/logo.png')

  // Build JSON-LD Article object
  const now = new Date()
  const publishedISO = articleMeta?.publishedTime
    ? new Date(articleMeta.publishedTime).toISOString()
    : now.toISOString()
  const modifiedISO = articleMeta?.modifiedTime
    ? new Date(articleMeta.modifiedTime).toISOString()
    : publishedISO

  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    url: canonicalUrl,
    datePublished: publishedISO,
    dateModified: modifiedISO,
    author: { '@type': 'Person', name: authorName },
    publisher: {
      '@type': 'Organization',
      name: siteName,
      logo: { '@type': 'ImageObject', url: logoUrl },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonicalUrl },
  }

  if (post.image) {
    const imageUrl = resolveAbsoluteUrl(domain, sanitizeEnvValue(post.image))
    jsonLd.image = [
      {
        '@type': 'ImageObject',
        url: imageUrl,
        width: 1200,
        height: 630,
      },
    ]
  }

  // --- New: BreadcrumbList with two items (Home + current post) ---
  // Home item: use the validated base domain; label 'Home'
  const homeUrl = typeof domain === 'string' && domain ? domain : resolveAbsoluteUrl(domain, '/')
  const breadcrumbJson: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        item: {
          '@id': homeUrl,
          name: 'Home',
        },
      },
      {
        '@type': 'ListItem',
        position: 2,
        item: {
          '@id': canonicalUrl,
          name: title || canonicalUrl,
        },
      },
    ],
  }

  // Compose final JSON-LD payload as a single array so crawlers see both Article + BreadcrumbList
  const finalJsonLdPayload = [jsonLd, breadcrumbJson]

  // Escape for JSON-LD only once before injecting into the HTML head
  const jsonLdStr = escapeForJsonLd(JSON.stringify(finalJsonLdPayload))

  return (
    <>
      {/* Server-rendered JSON-LD: Article + BreadcrumbList (single script) */}
      <script id="posts-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdStr }} />
    </>
  )
}
