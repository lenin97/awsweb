// app/actions/getCachedPosts.ts
import {
  DynamoDBDocumentClient,
  GetCommand,
  UpdateCommand,
  //PutCommand
} from '@aws-sdk/lib-dynamodb'
//import { serialize } from 'next-mdx-remote/serialize'
//import type { MDXRemoteSerializeResult } from 'next-mdx-remote'
import type { Post } from '@/lib/types/Post';
import {CACHE_POSTTABLE_BE} from '@/lib/types/frontendVars';
import { getAuthServerCmpns } from '@/lib/serverAuth4Cmpns';

// ——— configure clients & tables ———
//const UPDATES_TABLE     = UPDATES_CACHE_POSTTABLE_BE        // e.g. "MDXupdates"
const POSTS_TABLE       = CACHE_POSTTABLE_BE        // your raw posts table
//const POSTS_CACHE_TABLE = process.env.POSTS_CACHE_TABLE!    // a dedicated cache table
const CACHE_TTL_SECONDS = 60 * 5                            // e.g. 5‑minute fresh window


// ——— helper to detect stale cache entry ———
/*
function isStale(cachedAt: number) {
  return Date.now() / 1000 - cachedAt > CACHE_TTL_SECONDS
}
*/

// ——— the Server Action ———
export async function cachePosts(ddb: DynamoDBDocumentClient,slugs: string[]): Promise<"cfe" | "cmidfe"> {

  console.log("🔄 cachePosts called with slugs:", slugs);

  try {
    // 1) Fetch & filter posts
    /*
    console.log("📥 Fetching posts from DynamoDB...");
    const fetchResults = await Promise.all(
      slugs.map(async (slug) => {
        const { Item } = await ddb.send(
          new GetCommand({
            TableName: POSTS_TABLE!,
            Key: { pk: slug },
          })
        );
        if (!Item?.payload) {
          console.warn(`⚠️ No payload for slug=${slug}, skipping.`);
          return null;
        }
        return JSON.parse(Item.payload) as Post;
      })
    );
    const posts = fetchResults.filter((x): x is Post => !!x);
    console.log(`✅ Fetched ${posts.length}/${slugs.length} posts.`);

    // Prepare timestamp values
    const nowSec = Math.floor(Date.now() / 1000);
    const expSec = nowSec + CACHE_TTL_SECONDS;

    // 2) Update posts cache
    console.log("💾 Updating POSTS_TABLE cache entry...");
    await ddb.send(
      new UpdateCommand({
        TableName: POSTS_TABLE!,
        Key: { pk: '0' },
        UpdateExpression: "SET payload = :pl, cachedAt = :ts, expiresAt = :exp",
        ExpressionAttributeValues: {
          ":pl": JSON.stringify(posts),
          ":ts": nowSec,
          ":exp": expSec,
        },
      })
    );
    console.log("✅ POSTS_TABLE cache updated.");
    */
    // 3) Update messagemdx
    console.log("💾 Updating UPDATES_TABLE messagemdx entry...");
    const client = await getAuthServerCmpns();
    await client.models.MDXupdates.update(
      { id: "0", messagemdx: "cfe"},
      { authMode: 'identityPool'}
    );
    /*
    await ddb.send(
      new UpdateCommand({
        TableName: UPDATES_TABLE!,
        Key: { id: "0" },
        UpdateExpression:
          "SET messagemdx = :mdx, cachedAt = :ts, expiresAt = :exp",
        ExpressionAttributeValues: {
          ":mdx": "cfe",
          ":ts": nowSec,
          ":exp": expSec,
        },
      })
    );
    */
    console.log("✅ UPDATES_TABLE messagemdx updated.");

    console.log("🎉 cachePosts completed: returning 'cfe'.");
    return "cfe";
  } catch (err) {
    console.error("❌ cachePosts failed:", err);
    return "cmidfe";
  }

}

