// app/tailorCV/home/head.tsx
import type { ReactElement } from 'react'
import { crawljsonscript } from '@/lib/mdxSAs/crawljsonscript'
import { escapeForJsonLd, sanitizeEnvValue } from '@/lib/utils/sanitizeString'
import {
  TCV_SUBDOMAIN_TOOL_CV,
  TCV_BASE_DOMAIN,
  TCV_APP_NAME_HEADER,
  TCV_OPENGRAPH_IMG,
} from '@/lib/env.server'
import {resolveAbsoluteUrl} from '@/lib/utils/resolveAbsoluteUrl'

export default async function ScriptTailorCV(): Promise<ReactElement | null> {
  const data = await crawljsonscript('tailorCV')
  if (!data) return null

  // Use validated & sanitized env exports (from env.server)
  const toolUrlRaw = TCV_SUBDOMAIN_TOOL_CV
  const baseUrl = TCV_BASE_DOMAIN
  const appName = TCV_APP_NAME_HEADER
  const logoPath = TCV_OPENGRAPH_IMG // may be root-relative or absolute

  // Sanitize content fields from MDX source
  const title = sanitizeEnvValue(data.title ?? '')
  const excerpt = sanitizeEnvValue(data.excerpt ?? '')
  const safeOgImagePath = data.ogImage ? sanitizeEnvValue(data.ogImage) : null

  // Resolve tool URL (toolUrlRaw may be root-relative or absolute)
  const toolUrl = resolveAbsoluteUrl(baseUrl, toolUrlRaw)

  // Resolve logo URL (prefer explicit opengraph env if present)
  const logoCandidate = logoPath || '/logo.png'
  const logoUrl = resolveAbsoluteUrl(baseUrl, logoCandidate)

  // Build Product JSON-LD
  const productJsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: title,
    description: excerpt,
    url: toolUrl,
    brand: {
      '@type': 'Brand',
      name: appName,
      logo: {
        '@type': 'ImageObject',
        url: logoUrl,
        width: 600,
        height: 60,
      },
    },
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      url: toolUrl,
    },
  }

  // Build SoftwareApplication JSON-LD
  const softwareAppJsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: title,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'All',
    description: excerpt,
    url: toolUrl,
    publisher: {
      '@type': 'Organization',
      name: appName,
      url: baseUrl,
      logo: {
        '@type': 'ImageObject',
        url: logoUrl,
      },
    },
  }

  // Add optional images if the MDX provided one
  if (safeOgImagePath) {
    const ogImageUrl = resolveAbsoluteUrl(baseUrl, safeOgImagePath)
    const imageObj = {
      '@type': 'ImageObject',
      url: ogImageUrl,
      width: data.ogImageWidth ?? 1200,
      height: data.ogImageHeight ?? 630,
    }
    productJsonLd.image = [imageObj]
    softwareAppJsonLd.image = [imageObj]
  }

  // Escape for JSON-LD only once right before embedding
  const productStr = escapeForJsonLd(JSON.stringify(productJsonLd))
  const softwareAppStr = escapeForJsonLd(JSON.stringify(softwareAppJsonLd))

  return (
    <>
      <script id="ld-product" type="application/ld+json" dangerouslySetInnerHTML={{ __html: productStr }} />
      <script id="ld-softwareapp" type="application/ld+json" dangerouslySetInnerHTML={{ __html: softwareAppStr }} />
    </>
  )
}
