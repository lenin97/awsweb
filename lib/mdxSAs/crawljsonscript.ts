import {dynamoDBClient} from "@/lib/mdxSAs/dynamoDBClient"
import {
  GetCommand,
  //PutCommand
} from '@aws-sdk/lib-dynamodb'
import {SEOTB} from '@/lib/types/frontendVars';//Metacustom
import {Metacustom} from '@/lib/types/metadataCustom';


  // Helper to fallback if value is missing or empty
const fallback = (val: string | undefined, fallback: string): string =>
  val && val.trim() !== '' ? val : fallback;

export async function crawljsonscript(segment:string): Promise<Metacustom> {
  const ddb = await dynamoDBClient();

  console.log('🔄 crawljsonscript() called ::', SEOTB);

  const result = await ddb.send(
    new GetCommand({
      TableName: SEOTB!,
      Key: { pk: segment },
    })
  );

  const raw = result.Item?.payload;

  if (!raw) {
    console.warn(`[crawljsonscript] Cache miss or payload missing for segment: ${segment}`);
  }

  const meta: Metacustom =
    typeof raw === 'string' ? (JSON.parse(raw) as Metacustom) : (raw as Metacustom);

  console.log('✅ crawljsonscript loaded ::', meta);

  return meta
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