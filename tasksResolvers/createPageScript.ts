import {
  TCV_APP_NAME_HEADER,
  TCV_BASE_DOMAIN,
  TCV_OPENGRAPH_IMG,
  TCV_EMAIL_CONTACT,
  TCV_X_PROFILE,
  TCV_LINKEDIN_PROFILE,
  TCV_INST_PROFILE,
  TCV_TIKTOK_PROFILE,
  TCV_SUBDOMAIN_TOOL_CV,
  TCV_CDN
} from './envvar'
import {escapeForJsonLd,resolveAbsoluteUrl,sanitizeEnvValue} from './Utilsseoscripts'
import {Metacustom,ArticleMeta,Post} from './Utilsseometa'

export function ItemListPosts(messagemdx: string, messagetitle: string) {

  if (!messagemdx || messagemdx.trim().length === 0) {
    console.log('[ItemListPosts] messagemdx empty -> returning null')
    return null
  }

  const parts = messagemdx.split('|').map(p => p.trim()).filter(Boolean)

  // Parse messagetitle into a map: idNum -> title
  const titleMap = new Map<number, string>()
  if (messagetitle && messagetitle.trim().length > 0) {
    const tparts = messagetitle.split('|').map(p => p.trim()).filter(Boolean)
    for (const tp of tparts) {
      const tm = tp.match(/^news(\d+):::(.*)$/)
      if (!tm) continue
      const idx = Number(tm[1])
      const titleRaw = tm[2].trim()
      if (!Number.isNaN(idx) && titleRaw.length > 0) {
        titleMap.set(idx, titleRaw)
      }
    }
  }

  const listItems: Array<Record<string, unknown>> = []

  for (const part of parts) {
    const m = part.match(/^news(\d+):(.+)$/)
    if (!m) continue

    const position = Number(m[1])
    const slugRaw = m[2].trim()
    if (!slugRaw) continue

    // Build URL as requested: new URL(`/posts/${slug}`, TCV_BASE_DOMAIN).toString();
    // To avoid issues with spaces or unsafe characters, encode the slug when inserting into the path.
    const encodedSlug = encodeURIComponent(slugRaw)
    let itemUrl: string
    try {
      itemUrl = new URL(`/posts/${encodedSlug}`, TCV_BASE_DOMAIN).toString()
    } catch (err) {
      const base = (TCV_BASE_DOMAIN || '').replace(/\/+$/, '')
      itemUrl = `${base}/posts/${encodedSlug}`
    }

    // Prefer title from messagetitle map; fall back to slug if missing
    const name = titleMap.get(position) ?? slugRaw

    listItems.push({
      '@type': 'ListItem',
      position,
      item: {
        '@id': itemUrl,
        name,
      },
    })
  }

  // Sort by position (newsX number) to ensure correct order in the final ItemList
  listItems.sort((a, b) => {
    const pa = (a.position as number) || 0
    const pb = (b.position as number) || 0
    return pa - pb
  })

  const numberOfItems = listItems.length

  const itemListJson = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: listItems,
    numberOfItems,
    itemListOrder: 'Unordered',
  }

  console.log('[ItemListPosts] Built ItemList with items:', numberOfItems)
  return itemListJson
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
export function scriptlayout(): string {
  const nameApp = TCV_APP_NAME_HEADER
  const baseUrl = TCV_BASE_DOMAIN
  const logoRelativeURL = TCV_OPENGRAPH_IMG
  const contactEmail = TCV_EMAIL_CONTACT

  const logoUrl = resolveAbsoluteUrl(TCV_CDN, logoRelativeURL)

  const sameAs = [TCV_X_PROFILE, TCV_LINKEDIN_PROFILE, TCV_INST_PROFILE, TCV_TIKTOK_PROFILE].filter(Boolean)

  const orgJsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: nameApp,
    url: baseUrl,
    logo: { '@type': 'ImageObject', url: logoUrl },
    contactPoint: {
      '@type': 'ContactPoint',
      email: contactEmail,
      contactType: 'Customer Support',
    },
    sameAs,
    "inLanguage": "en"
  }

  const siteJsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    url: baseUrl,
    name: nameApp,
    publisher: {
      '@type': 'Organization',
      name: nameApp,
      logo: { '@type': 'ImageObject', url: logoUrl },
    },
    "inLanguage": "en"
  }

  // Use escapeForJsonLd at the last moment when embedding JSON into the HTML head.
  //const orgJsonStr = escapeForJsonLd(JSON.stringify(orgJsonLd))
  //const siteJsonStr = escapeForJsonLd(JSON.stringify(siteJsonLd))
  const full_json=[orgJsonLd,siteJsonLd]

  return escapeForJsonLd(JSON.stringify(full_json))

  
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function scriptHome(data: Metacustom, messagemdx: string, messagetitle: string): string|null {
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
  const logoUrl = resolveAbsoluteUrl(TCV_CDN, sanitizeEnvValue(logoRelative ?? ''))

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
    "inLanguage": "en"
  }

  // add image only if present (resolve relative/absolute)
  if (data.ogImage) {
    const safeOgImagePath = sanitizeEnvValue(data.ogImage)
    const ogImageUrl = resolveAbsoluteUrl(TCV_CDN, safeOgImagePath)
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
    const maybeItemList = ItemListPosts(messagemdx,messagetitle)
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
  return escapeForJsonLd(JSON.stringify(finalJsonLdPayload))

}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function scriptTailorCV(data:Metacustom): string|null{
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
  const logoUrl = resolveAbsoluteUrl(TCV_CDN, logoCandidate)
  
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
    "inLanguage": "en"
  }

  // Add optional images if the MDX provided one
  if (safeOgImagePath) {
    const ogImageUrl = resolveAbsoluteUrl(TCV_CDN, safeOgImagePath)
    const imageObj = {
      '@type': 'ImageObject',
      url: ogImageUrl,
      width: data.ogImageWidth ?? 1200,
      height: data.ogImageHeight ?? 630,
    }
    //productJsonLd.image = [imageObj]
    softwareAppJsonLd.image = [imageObj]
  }

  // Escape for JSON-LD only once right before embedding
  //const productStr = escapeForJsonLd(JSON.stringify(productJsonLd))
  return escapeForJsonLd(JSON.stringify(softwareAppJsonLd))

}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
export async function slugScript(post:Post,articleMeta:ArticleMeta,slug: string ): Promise<string|null> {
  // Fetch post + meta
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
  const logoUrl = resolveAbsoluteUrl(TCV_CDN, logoPath || '/logo.png')

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
    "inLanguage": "en"
  }

  if (post.image) {
    const imageUrl = resolveAbsoluteUrl(TCV_CDN, sanitizeEnvValue(post.image))
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
  return escapeForJsonLd(JSON.stringify(finalJsonLdPayload))

}
