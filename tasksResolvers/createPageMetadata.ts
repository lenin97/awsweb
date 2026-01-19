import type { Metadata } from 'next';
import {ArticleMeta,getOgImageUrl,getImageUrl} from './Utilsseometa'
import {
  TCV_APP_NAME_HEADER,
  TCV_BASE_DOMAIN,
} from './envvar'

/**
 * Article-specific metadata fields for `og:type = 'article'`.
 */
export type OpenGraphType = 'website' | 'article';

export type Options = {
  title: string;
  description: string;
  url: string;                // full canonical URL

  openGraphTitle?: string;
  openGraphDescription?: string;
  openGraphType?: OpenGraphType;
  articleMeta?: ArticleMeta;

  twitterTitle?: string;
  twitterDescription?: string;

  image?: {
    url: string;
    width?: number;
    height?: number;
    alt?: string;
  };

  baseUrl?: string;
  languageAlternates?: Record<string, string>;
};

export function createPageMetadata({
  title,
  description,
  url,
  openGraphTitle,
  openGraphDescription,
  openGraphType = 'website',
  articleMeta,
  twitterTitle,
  twitterDescription,
  image = {
    url,
    width: 1200,
    height: 630,
    alt: `${TCV_APP_NAME_HEADER} preview`,
  },
  baseUrl = TCV_BASE_DOMAIN!,/*
  languageAlternates = {
    'en-US': '/en-US',
    'es-PE': '/es-PE',
  },*/
}: Options): Metadata {
  // Try to construct a metadataBase URL; if baseUrl is not an absolute URL we fall back to undefined.
  let metadataBase: URL | undefined
  try {
    metadataBase = new URL(baseUrl)
  } catch {
    metadataBase = undefined
  }

  // Small resolver: leave absolute/protocol-relative URLs unchanged; resolve relative paths if metadataBase exists.
  const resolveWithBase = (maybe: string): string => {
    if (!maybe) return maybe
    if (/^https?:\/\//i.test(maybe) || /^\/\/.*/.test(maybe)) return maybe
    if (metadataBase) return new URL(maybe, metadataBase).toString()
    return maybe
  }

  // Normalize canonical URL
  const canonicalUrl = resolveWithBase(url)

  // Build ogImages (unchanged generation using getOgImageUrl), then normalize each image.url
  const ogImages = [
    {
      url: getOgImageUrl({
        title,
        subtitle: description,
        theme: 'light',
        image: image.url,
        metadataBase,
      }),
      width: 1200,
      height: 630,
      alt: `Preview of ${title}`,
    },
    {
      url: getOgImageUrl({
        title,
        subtitle: description,
        theme: 'dark',
        image: image.url,
        metadataBase,
      }),
      width: 1200,
      height: 630,
      alt: `Preview of ${title}`,
    },
  ]

  // Use Metadata's openGraph type
  //type NextOpenGraph = NonNullable<Metadata['openGraph']>
  let openGraph

  if (openGraphType === 'website'){

    openGraph = {
      title: openGraphTitle ?? title,
      description: openGraphDescription ?? description,
      url: canonicalUrl,
      siteName: TCV_APP_NAME_HEADER,
      type: openGraphType,
      images: ogImages,
    }
  }  

  console.log('[createPageMetadata]::articleMeta =', JSON.stringify(articleMeta, null, 2));

  if (openGraphType === 'article' && articleMeta) {
    console.log('[createPageMetadata]::inside openGraph.article')

    let og_authors
    let og_tags
    // authors: keep as array of strings (names or URLs)
    if (articleMeta.authors) {
      og_authors = Array.isArray(articleMeta.authors)
        ? articleMeta.authors
        : [String(articleMeta.authors)]
    }

    if (articleMeta.tags) {
      og_tags = Array.isArray(articleMeta.tags)
        ? articleMeta.tags
        : [String(articleMeta.tags)]
    }

    openGraph = {
      title: openGraphTitle ?? title,
      description: openGraphDescription ?? description,
      url: canonicalUrl,
      siteName: TCV_APP_NAME_HEADER,
      type: openGraphType,
      images: ogImages,
      publishedTime:articleMeta.publishedTime,
      modifiedTime:articleMeta.publishedTime,
      authors:og_authors,
      section:articleMeta.section,
      tags:og_tags
    }

    console.log('[createPageMetadata] openGraph =', JSON.stringify(openGraph, (_k, v) => (v instanceof Date ? v.toISOString() : v instanceof URL ? v.toString() : v), 2))

  }

  // Normalize twitter image(s)
  const twitterImage = resolveWithBase(image.url)

  return {
    title,
    description,
    metadataBase,
    alternates: {
      canonical: canonicalUrl,
      //languages: languageAlternates,
    },
    openGraph,
    twitter: {
      card: 'summary_large_image',
      title: twitterTitle ?? title,
      description: twitterDescription ?? description,
      images: [twitterImage],
    },
    robots: {
      index: true,
      follow: true,
      nocache: false,
      googleBot: { index: true, follow: true, noimageindex: false },
    },
    icons: {
      icon: getImageUrl('/favicon.ico') ?? '/favicon.ico',
      shortcut: getImageUrl('/favicon.ico') ?? '/favicon.ico',
      apple: getImageUrl('/apple-touch-icon.png') ?? '/apple-touch-icon.png',
      other: [
        { rel: 'icon', url: getImageUrl('/favicon.svg')?? '/favicon.svg', type: 'image/svg+xml' },
        { rel: 'icon', url: getImageUrl('/favicon-96x96.png')?? '/favicon-96x96.png', type: 'image/png', sizes: '96x96' },
      ],
    },
    appleWebApp: { title },
  }
}
