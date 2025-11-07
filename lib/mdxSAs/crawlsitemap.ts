import { dynamoDBClient } from "@/lib/mdxSAs/dynamoDBClient";
import type { SitemapEntry } from "@/lib/types/sitemap";
import { GetCommand } from '@aws-sdk/lib-dynamodb';
import { SEOTB } from '@/lib/types/frontendVars';
import { crawlsitemapSlug } from './crawlsitemapSlug';

export async function crawlsitemap(): Promise<SitemapEntry[]> {
  const ddb = await dynamoDBClient();

  console.log("🔄 crawlsitemap() called::", SEOTB);
  let dbUrls: SitemapEntry[] = [];

  try {
    const result = await ddb.send(
      new GetCommand({
        TableName: SEOTB!,
        Key: { pk: "sitemap" },
      })
    );

    const raw = result.Item?.payload;
    if (!raw) {
      console.log(`[crawlsitemap] DB sitemap payload missing or empty.`);
      dbUrls = [];
    } else {
      try {
        dbUrls =
          typeof raw === 'string'
            ? (JSON.parse(raw) as SitemapEntry[])
            : (raw as SitemapEntry[]);
      } catch (err) {
        console.warn('[crawlsitemap] Failed to parse DB sitemap payload, treating as empty:', err);
        dbUrls = [];
      }
    }
  } catch (err) {
    console.warn('[crawlsitemap] Error fetching sitemap from DynamoDB, treating DB urls as empty:', err);
    dbUrls = [];
  }

  // Fetch slug-derived entries (may be empty)
  let slugEntries: SitemapEntry[] = [];
  try {
    slugEntries = await crawlsitemapSlug();
  } catch (err) {
    console.warn('[crawlsitemap] crawlsitemapSlug() failed, continuing with DB urls:', err);
    slugEntries = [];
  }

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
