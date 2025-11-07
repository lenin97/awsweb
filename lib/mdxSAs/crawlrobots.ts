import {dynamoDBClient} from "@/lib/mdxSAs/dynamoDBClient"
import type { RobotsTxtMeta } from "@/lib/types/robots";
//import type { MDXRemoteSerializeResult } from 'next-mdx-remote';
import {
  GetCommand,
  //PutCommand
} from '@aws-sdk/lib-dynamodb'
import {SEOTB} from '@/lib/types/frontendVars';
//import type { MDXRemoteSerializeResult } from 'next-mdx-remote';
//const POSTS_TABLE       = CACHE_POSTTABLE_BE        // your raw posts table



export async function crawlrobots(): Promise<RobotsTxtMeta> {
  const ddb = await dynamoDBClient();

  console.log("🔄 crawlrobots() called::",SEOTB)
  const result = await ddb.send(new GetCommand({
              TableName: SEOTB!,
              Key: { pk: "robots" },
            }))

  const raw= result.Item?.payload
  if (!raw) {
    console.log(`[crawlrobots] Cache miss or payload missing.`);
    return {
      usrag: "dnk",
      alw: "dnk",
      stmp: Date.now().toString(), // or 0 or whatever default makes sense};
      disallowedPaths: "dnk"
    }
  }
  
  const rbbody: RobotsTxtMeta =
        typeof raw === 'string'
          ? (JSON.parse(raw) as RobotsTxtMeta)
          : (raw as RobotsTxtMeta);
  
  //console.log("validateCBE ret ::", { messagemdx, slugs });

  return rbbody;
}

/*
User-agent: *
Allow: /

Sitemap: https://yourdomain.com/sitemap.xml

*/