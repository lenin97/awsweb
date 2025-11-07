import {dynamoDBClient} from "@/lib/mdxSAs/dynamoDBClient"
import {
  GetCommand,
  //PutCommand
} from '@aws-sdk/lib-dynamodb'
import {SEOTB} from '@/lib/types/frontendVars';//Metacustom
import {Metacustom} from '@/lib/types/metadataCustom';
import { createPageMetadata } from '@/lib/seo/createPageMetadata';
import type { Metadata } from 'next';


  // Helper to fallback if value is missing or empty
const fallback = (val: string | undefined, fallback: string): string =>
  val && val.trim() !== '' ? val : fallback;

export async function crawlmetadata(segment:string): Promise<Metadata> {
  const ddb = await dynamoDBClient();

  console.log('🔄 crawlmetadata() called ::', SEOTB);

  const result = await ddb.send(
    new GetCommand({
      TableName: SEOTB!,
      Key: { pk: segment },
    })
  );

  const raw = result.Item?.payload;

  if (!raw) {
    console.warn(`[crawlmetadata] Cache miss or payload missing for segment: ${segment}`);
    return {
      title: 'Not Found',
      description: 'No metadata found for this segment.',
    };
  }

  const meta: Metacustom =
    typeof raw === 'string' ? (JSON.parse(raw) as Metacustom) : (raw as Metacustom);

  console.log('✅ crawlmetadata loaded ::', meta);

  return createPageMetadata({
    title: `${meta.title} | ${process.env.TCV_APP_NAME_HEADER}`,
    description: meta.excerpt,

    openGraphTitle: fallback(meta.openGraphTitle, meta.title),
    openGraphDescription: fallback(meta.openGraphDescription, meta.excerpt),

    twitterTitle: fallback(meta.twitterTitle, meta.title),
    twitterDescription: fallback(meta.twitterDescription, meta.excerpt),

    url: process.env[meta.canonicalRealtiveURL!] || process.env.TCV_BASE_DOMAIN!,
    
    image: {
      url: meta.ogImage || new URL(process.env.TCV_OPENGRAPH_IMG!,process.env.TCV_BASE_DOMAIN).toString(),
      //alt: meta.title,
    },
    
  });
}

/*
<?xml version="1.0" encoding="UTF-8"?>
<urlset 
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
>
  <url>
    <loc>https://yourdomain.com/</loc>
    <lastmod>2025-07-15</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://yourdomain.com/blog/my-post</loc>
    <lastmod>2025-07-14</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>

*/