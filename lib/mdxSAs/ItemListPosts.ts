import { getAuthServerCmpns } from '@/lib/serverAuth4Cmpns'
import {
  TCV_BASE_DOMAIN
} from '@/lib/env.server'

export async function ItemListPosts(): Promise<Record<string, unknown> | null> {
  const client = await getAuthServerCmpns()

  // Try to read messagemdx and messagetitle from MDXupdates
  let messagemdx = ''
  let messagetitle = ''
  try {
    const getRes = await client.models.MDXupdates.get({ id: '0' }, { authMode: 'identityPool' })
    if (getRes.data) {
      messagemdx = getRes.data.messagemdx || ''
      messagetitle = getRes.data.messagetitle || ''
    }
  } catch (err) {
    console.warn('[ItemListPosts] Could not fetch MDXupdates:', err)
    return null
  }

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
