// app/actions/getCachedPosts.ts
import {
  GetCommand,
} from '@aws-sdk/lib-dynamodb'
//import type { MDXRemoteSerializeResult } from 'next-mdx-remote'
import {dynamoDBClient} from "@/lib/mdxSAs/dynamoDBClient"
import type { Post } from '@/lib/types/Post';
import {CACHE_POSTTABLE_BE} from '@/lib/types/frontendVars';


const POSTS_TABLE       = CACHE_POSTTABLE_BE        // your raw posts table
//const POSTS_CACHE_TABLE = process.env.POSTS_CACHE_TABLE!    // a dedicated cache table



// ——— helper to detect stale cache entry ———
/*
function isStale(cachedAt: number) {
  return Date.now() / 1000 - cachedAt > CACHE_TTL_SECONDS
}
*/

// ——— the Server Action ———
export async function getCachePosts(): Promise<Post[]> {
  try {
    const ddb = await dynamoDBClient();
    const cacheResp = await ddb.send(
      new GetCommand({
        TableName: POSTS_TABLE,
        Key: { pk: '0' },                    // your single‐item cache key
        ProjectionExpression: 'payload',   // only retrieve the JSON payload
      })
    );

    const raw = cacheResp.Item?.payload;
    if (!raw) {
      console.log(`[getCachePosts] Cache miss or payload missing.`);
      return [];
    }

    // If payload was stored as stringified JSON, parse it.
    // If it was stored as a native JS object/array, just cast it.
    const posts: Post[] =
      typeof raw === 'string'
        ? (JSON.parse(raw) as Post[])
        : (raw as Post[]);

    console.log(`[getCachePosts] Cache hit. Returning ${posts.length} post(s).`);
    return posts;
  } catch (err) {
    console.error(`[getCachePosts] Error reading cache:`, err);
    return [];
  }
}
