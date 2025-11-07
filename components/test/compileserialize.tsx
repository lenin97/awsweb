// amplify/functions/s3MdxHandler/handler.ts
// amplify/functions/s3MdxHandler/handler.ts
import { S3Handler } from 'aws-lambda';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { compile } from 'xdm';
import matter from 'gray-matter';
import { WebSocketApiClient } from '@/lib/websocket';

const s3 = new S3Client({});
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE_NAME = process.env.DYNAMO_TABLE!;
const CACHE_TTL = 60 * 60 * 24; // 24h
const SLUGS_KEY = 'blog:slugs';

export const handler: S3Handler = async (event) => {
  const slugs: string[] = [];

  for (const record of event.Records) {
    const key = decodeURIComponent(record.s3.object.key);
    if (!key.endsWith('.mdx')) continue;

    const slug = key.replace(/^blog-posts\//, '').replace(/\.mdx$/, '');
    slugs.push(slug);

    const res = await s3.send(new GetObjectCommand({
      Bucket: record.s3.bucket.name,
      Key: key
    }));

    const raw = await res.Body?.transformToString();
    if (!raw) continue;

     const compiled = await serialize(raw);
    const { content, data: frontmatter } = matter(raw);
    const compiled = await compile(content, {
      outputFormat: 'function-body',
      jsx: true,
    });

    const payload = {
      compiledSource: String(compiled.value),
      frontmatter,
    };

    await ddb.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        pk: `blog:list:${slug}`,
        payload: JSON.stringify(payload),
        ttl: Math.floor(Date.now() / 1000) + CACHE_TTL,
      },
    }));
  }

  // Update slugs index
  const current = await ddb.send(new GetCommand({ TableName: TABLE_NAME, Key: { pk: SLUGS_KEY } }));
  const currentSlugs: string[] = current.Item?.payload ? JSON.parse(current.Item.payload) : [];
  const merged = Array.from(new Set([...currentSlugs, ...slugs]));

  await ddb.send(new PutCommand({
    TableName: TABLE_NAME,
    Item: {
      pk: SLUGS_KEY,
      payload: JSON.stringify(merged),
      ttl: Math.floor(Date.now() / 1000) + CACHE_TTL,
    },
  }));

  // Notify clients via WebSocket or PubSub (optional, client must listen)
  await WebSocketApiClient.broadcast({ topic: 'blog:updated' });
};

// amplify/functions/s3MdxHandler/function.ts
import { defineFunction } from '@aws-amplify/backend';

export const s3MdxHandler = defineFunction({
  name: 's3MdxHandler',
  entry: './handler.ts',
  runtime: 'nodejs18.x',
  environment: {
    DYNAMO_TABLE: process.env.DYNAMO_TABLE!,
  },
  permissions: {
    storage: ['read'],
    data: ['read', 'write'],
  },
});

// amplify/storage/resource.ts (S3 trigger setup)
import { defineStorage } from '@aws-amplify/backend';
import { s3MdxHandler } from '../functions/s3MdxHandler/function';

export const storage = defineStorage({
  name: 'blogMedia',
  triggers: [
    {
      event: 'objectCreated',
      prefix: 'blog-posts/',
      suffix: '.mdx',
      function: s3MdxHandler,
    },
  ],
});
