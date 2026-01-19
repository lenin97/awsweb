// -----------------------------
// Types (as you provided)
// -----------------------------
import {
  TCV_CDN,
  TCV_BASE_DOMAIN,
  TCV_OPENGRAPH_META_ROUTE
} from './envvar'

export type Post = {
  slug: string;
  title: string;
  date: string;
  description: string;
  image: string;
  links: string
};

export type Metacustom = {
  id?: string;
  title: string;
  excerpt: string;
  slug: string;
  ogImage?: string;
  ogImageWidth?: string;
  ogImageHeight?: string;
  createdAt?: string; // ISO datetime or Date string
  updatedAt?: string;
  canonicalRealtiveURL?: string;
  authorName?: string;

  // Optional overrides
  openGraphTitle?: string;
  openGraphDescription?: string;
  openGraphType?: string;
  twitterTitle?: string;
  twitterDescription?: string;
};

export interface ArticleMeta {
  publishedTime: string;      // ISO 8601 format
  modifiedTime?: string;
  expirationTime?: string;
  authors?: string[];         // URLs or names
  section?: string;
  tags?: string[];
}

export const fallback = (val: string | undefined, fallback: string): string =>
  val && val.trim() !== '' ? val : fallback;

// -----------------------------
// Helpers (ported from your server component)
// -----------------------------
export const getImageUrl = (img?: string | null): string | null => {
  if (!img) return null;

  if (/^https?:\/\//i.test(img)) return img;

  const cdnBase = TCV_CDN ?? process.env.NEXT_PUBLIC_TCV_CDN;
  if (!cdnBase) {
    return img;
  }

  const base = cdnBase.replace(/\/+$/, '');
  const path = img.replace(/^TCV_CDN\/?/, '').replace(/^\/+/, '');

  return `${base}/${encodeURI(path)}`;
};

export function getOgImageUrl({
  title,
  subtitle,
  theme = 'light',
  image,
  metadataBase = TCV_BASE_DOMAIN, // fallback if not passed
}: {
  title: string
  subtitle?: string
  theme?: 'light' | 'dark'
  image?: string
  metadataBase?: string | URL
}): string {
  // Normalize metadataBase into a URL object
  const base =
    typeof metadataBase === 'string' ? new URL(metadataBase) : metadataBase

  // Point at the file-based metadata route
  const url = new URL(TCV_OPENGRAPH_META_ROUTE!, base)

  url.searchParams.set('theme', theme)
  url.searchParams.set('title', title)

  if (subtitle) {
    url.searchParams.set('subtitle', subtitle)
  }

  if (image) {
    url.searchParams.set('image', image)
  }

  return url.toString()
}
