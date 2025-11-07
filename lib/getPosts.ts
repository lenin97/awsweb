// lib/getPosts.ts
import { cache } from 'react';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';
import { serialize } from 'next-mdx-remote/serialize';
import type { MDXRemoteSerializeResult } from 'next-mdx-remote';  // correct import path

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const UPDATES_TABLE = 'MDXupdates';
const POSTS_TABLE = process.env.DYNAMO_TABLE!;

type Post = {
  frontmatter: Record<string, unknown>;
  MDXContent: MDXRemoteSerializeResult;
};

function isPost(item: Post | null): item is Post {
  return item !== null;
}

export const getPosts = cache(async (updateNow: string): Promise<Post[]> => {
  // 1) Fetch the slug list
  const { Item } = await ddb.send(new GetCommand({
    TableName: UPDATES_TABLE,
    Key: { id: 0 },
  }));
  const fileNames = (Item?.slug as string).split('||');

  // 2) Fetch & serialize each MDX
  const rawPosts = await Promise.all(
    fileNames.map(async (fn) => {
      const { Item: postItem } = await ddb.send(
        new GetCommand({
          TableName: POSTS_TABLE,
          Key: { pk: fn },
        })
      );
      if (!postItem) return null;
      const { compiledSource, frontmatter } = JSON.parse(postItem.payload);
      const MDXContent = await serialize(compiledSource, { parseFrontmatter: false });
      return { frontmatter, MDXContent };
    })
  );

  // 3) Filter out null entries with type guard
  return rawPosts.filter(isPost);
});
