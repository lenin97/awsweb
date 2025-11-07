// File: lib/og.ts

export function getOgImageUrl({
  title,
  subtitle,
  theme = 'light',
  image,
  metadataBase = process.env.TCV_BASE_DOMAIN, // fallback if not passed
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
  const url = new URL(process.env.TCV_OPENGRAPH_META_ROUTE!, base)

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
