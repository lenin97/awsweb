// app/actions/getCachedPosts.ts
import {
  DynamoDBDocumentClient,
  GetCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb'
import { serialize } from 'next-mdx-remote/serialize'
import type { MDXRemoteSerializeResult } from 'next-mdx-remote'

// ——— configure clients & tables ———
const UPDATES_TABLE     = "MDXupdates"        // e.g. "MDXupdates"
const POSTS_TABLE       = "MdxCacheTable"         // your raw posts table
//const POSTS_CACHE_TABLE = process.env.POSTS_CACHE_TABLE!    // a dedicated cache table
const CACHE_TTL_SECONDS = 60 * 5                            // e.g. 5‑minute fresh window

type Post = {
  frontmatter: Record<string, unknown>
  MDXContent: MDXRemoteSerializeResult
}

// ——— helper to detect stale cache entry ———
/*
function isStale(cachedAt: number) {
  return Date.now() / 1000 - cachedAt > CACHE_TTL_SECONDS
}
*/

// ——— the Server Action ———
export async function cachePostsOldVersion(ddb: DynamoDBDocumentClient,slugs: string[]): Promise<string> {
  // 1) Fetch & serialize each post
  const posts = await Promise.all(
    slugs.map(async (slug) => {
      const { Item: p } = await ddb.send(new GetCommand({
        TableName: POSTS_TABLE,
        Key: { pk: slug },
      }))
      if (!p) return null
      const { compiledSource, frontmatter } = JSON.parse(p.payload)
      const MDXContent = await serialize(compiledSource, { parseFrontmatter: false })
      return { frontmatter, MDXContent }
    })
  ).then(arr => arr.filter((x): x is Post => !!x))

  try {
    // 2) Store fresh result back into the cache table
    //const cacheKey = POSTS_CACHE_KEY
    await ddb.send(new UpdateCommand({
      TableName: POSTS_TABLE,
      Key: { pk: 0 },
      UpdateExpression: 'SET payload = :payload, cachedAt = :ts, expiresAt = :exp',
      ExpressionAttributeValues: {
        ':payload': JSON.stringify(posts),
        ':ts':     Math.floor(Date.now() / 1000),
        ':exp':    Math.floor(Date.now() / 1000) + CACHE_TTL_SECONDS,
      },
    }))

    // 3) Update messagemdx to "cfe"
    await ddb.send(new UpdateCommand({
      TableName: UPDATES_TABLE,
      Key: { pk: 0 },
      UpdateExpression: 'SET messagemdx = :messagemdx, cachedAt = :ts, expiresAt = :exp',
      ExpressionAttributeValues: {
        ':messagemdx': "cfe",
        ':ts':     Math.floor(Date.now() / 1000),
        ':exp':    Math.floor(Date.now() / 1000) + CACHE_TTL_SECONDS,
      },
    }))

    console.log("✅ Posts cached and messagemdx updated successfully.")     
    return "cfe"

  } catch (err) {
    console.error("❌ Failed to cache posts or update messagemdx:", err)
    return "cmidfe"
  }
}

