import {RobotsTxtMeta,SitemapEntry} from './UtilCrawl'
import {
  TCV_BASE_DOMAIN,
} from './envvar'

export function generateRobot(robot_data: RobotsTxtMeta): string {
  const { usrag, alw, stmp, disallowedPaths } = robot_data;
  const disallowSection = Array.isArray(disallowedPaths)
  ? disallowedPaths
      .map((path) => path.trim())
      .filter((path) => path.length > 0)
      .map((path) => `Disallow: ${path}`)
      .join('\n')
  : ''; // fallback if disallowedPaths is not an array
  const timegenerated= new Date().toISOString()
  //disallowedPaths = ["/admin", "/internal"]; // Static disallowed paths

  const body = `
User-agent: ${usrag}
Allow: ${alw}
${disallowSection ? disallowSection + '\n' : ''}
Sitemap: ${stmp}

# Generated at: ${timegenerated}
`.trim();
 
  return body

}

export function genrateSitemap(sitemap_data: SitemapEntry[]): string {
  const entries: SitemapEntry[] = sitemap_data;

   // derive a Last-Modified value (use latest lastmod from entries, or now)
  const latestLastmod = entries
    .map(e => e.lastmod || "")
    .filter(Boolean)
    .sort()
    .pop(); // ISO date strings -- pick latest
  console.log('[sitemap]::latestLastmod::',latestLastmod)

  const urls = entries
    .map(({ loc, lastmod, changefreq, priority }) => {
      return `
  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
    })
    .join('');

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`.trim();

    return sitemap
}

export function mergesitemap(dbUrls: SitemapEntry[], slugEntries:SitemapEntry[]): SitemapEntry[] {
  // Merge while deduplicating by `loc`.
  // Preserve DB order first, then append slugEntries that are not already present.
  const existingLocs = new Set<string>();
  const merged: SitemapEntry[] = [];

  for (const u of dbUrls) {
    if (u?.loc && !existingLocs.has(u.loc)) {
      merged.push(u);
      existingLocs.add(u.loc);
    }
  }

  for (const s of slugEntries) {
    if (s?.loc && !existingLocs.has(s.loc)) {
      merged.push(s);
      existingLocs.add(s.loc);
    }
  }

  // Sort merged by priority (high -> low). Tie-break by loc for determinism.
  merged.sort((a, b) => {
    const pa = typeof a.priority === 'number' ? a.priority : 0;
    const pb = typeof b.priority === 'number' ? b.priority : 0;
    const diff = pb - pa;
    if (diff !== 0) return diff;
    return (a.loc || '').localeCompare(b.loc || '');
  });

  console.log(`[crawlsitemap] DB urls: ${dbUrls.length}, slug entries: ${slugEntries.length}, merged (sorted): ${merged.length}`);
  return merged;
}

export function sitemapSlugs(messagemdx:string): SitemapEntry[] {
  //const client = await getAuthServerCmpns();
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
