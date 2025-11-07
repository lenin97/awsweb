import type { SitemapEntry } from "@/lib/types/sitemap";
import { getAuthServerCmpns } from '@/lib/serverAuth4Cmpns';
import {
  TCV_BASE_DOMAIN
} from '@/lib/env.server'

export async function crawlsitemapSlug(): Promise<SitemapEntry[]> {
  const client = await getAuthServerCmpns();

  // Try to read messagemdx from MDXupdates (format: "news1:slug|news2:slug|...")
  let messagemdx = '';
  try {
    const getRes = await client.models.MDXupdates.get({ id: '0' }, { authMode: 'identityPool' });
    if (getRes.data) {
      messagemdx = getRes.data.messagemdx || '';
    } 
  } catch (err) {
    console.warn('[crawlsitemapSlug] Could not fetch MDXupdates.messagemdx:', err);
    return [];
  }

  // If messagemdx is missing or empty, return nothing (no DynamoDB fallback).
  if (!messagemdx || messagemdx.trim().length === 0) {
    console.log('[crawlsitemapSlug] messagemdx empty -> returning no entries');
    return [];
  }

  const parts = messagemdx.split('|').map(p => p.trim()).filter(Boolean);
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  const entries: SitemapEntry[] = parts
    .map(part => {
      const m = part.match(/^news(\d+):(.+)$/);
      if (!m) return null;
      const slug = m[2].trim();
      if (!slug) return null;

      // build canonical URL safely (ensure TCV_BASE_DOMAIN includes scheme).
      // This will correctly handle missing/trailing slashes and do proper encoding.
      // Result: https://example.com/posts/{slug}
      let loc: string;
      try {
        loc = new URL(`/posts/${slug}`, TCV_BASE_DOMAIN).toString();
      } catch (err) {
        // fallback: try to concat safely
        const base = (TCV_BASE_DOMAIN || '').replace(/\/+$/, '');
        loc = `${base}/posts/${encodeURIComponent(slug)}`;
      }

      return {
        loc,
        lastmod: today,
        changefreq: 'weekly' as const,
        priority: 0.9,
      } as SitemapEntry;
    })
    .filter((e): e is SitemapEntry => e !== null);

  console.log('[crawlsitemapSlug] Built sitemap entries from messagemdx:', entries.length);
  return entries;
}
