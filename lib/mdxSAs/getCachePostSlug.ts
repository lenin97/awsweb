// app/actions/getCachedPosts.ts
import { QueryCommand } from '@aws-sdk/lib-dynamodb';
//import type { MDXRemoteSerializeResult } from 'next-mdx-remote'
import { dynamoDBClient } from "@/lib/mdxSAs/dynamoDBClient";
import type { Post } from '@/lib/types/Post';
import { CACHE_POSTTABLE_BE } from '@/lib/types/frontendVars';
import type { ArticleMeta } from '@/lib/types/metadataCustom';

const POSTS_TABLE = CACHE_POSTTABLE_BE; // your raw posts table
const SLUG_GSI_NAME = 'slug-index'; // <-- change this if your GSI uses a different name

export type CachedPostResult = {
  post: Post;
  articleMeta: ArticleMeta;
  bodyMarkdown?: string;
};

// ——— the Server Action ———
export async function getCachePostSlug(slug: string): Promise<CachedPostResult | null> {
  try {
    const ddb = await dynamoDBClient();

    const response = await ddb.send(
      new QueryCommand({
        TableName: POSTS_TABLE,
        IndexName: SLUG_GSI_NAME,
        KeyConditionExpression: 'slug = :s',
        ExpressionAttributeValues: {
          ':s': slug,
        },
        ProjectionExpression: 'payload, articlemeta, body',
        Limit: 1,
      })
    );

    const item = response.Items?.[0];

    if (!item) {
      console.log(`[getCachedPostSlug] Cache miss for slug "${slug}".`);
      return null;
    }

    const rawPayload = item.payload;
    const rawArticle = item.articlemeta;
    const bodyMarkdown = item.body;

    if (!rawPayload || !rawArticle) {
      console.log(`[getCachedPostSlug] Cache miss (missing payload/articlemeta) for slug "${slug}".`);
      return null;
    }

    const post: Post =
      typeof rawPayload === 'string'
        ? JSON.parse(rawPayload)
        : (rawPayload as Post);

    const articleMeta: ArticleMeta =
      typeof rawArticle === 'string'
        ? JSON.parse(rawArticle)
        : (rawArticle as ArticleMeta);

    console.log(`[getCachedPostSlug] Cache hit for slug "${slug}".`);
    return { post, articleMeta, bodyMarkdown };

  } catch (error) {
    console.error(`[getCachedPostSlug] Error checking cache for slug "${slug}":`, error);
    return null;
  }
}
