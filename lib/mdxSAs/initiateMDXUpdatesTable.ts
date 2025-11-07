//import {validateCBE} from "@/lib/mdxSAs/validateCBE"
//import {cachePosts} from "@/lib/mdxSAs/cachePosts"//dynamoDBClient
import {dynamoDBClient} from "@/lib/mdxSAs/dynamoDBClient"
import {PutCommand} from '@aws-sdk/lib-dynamodb'
//import type { MDXRemoteSerializeResult } from 'next-mdx-remote';
const UPDATES_TABLE     = "MDXupdates"
const POSTS_TABLE       = "MdxCacheTable" 
const CACHE_TTL_SECONDS = 60 * 5


export async function initiateMDXUpdatesTable() {
  // Await the async cache loader
  const ddb = await dynamoDBClient()

  const resuptb = await ddb.send(new PutCommand({
    TableName: UPDATES_TABLE!,
    Item: {
      id:        { S: "0" },
      slug:      { S: "" },
      messagemdx:{ S: "n2d" },
      // Optional: ttl value
      ttl:       { N: `${Math.floor(Date.now() / 1000) + CACHE_TTL_SECONDS}` }
    },
    // optional: ConditionExpression to prevent overwrite, etc.
  }));

  const respsttb = await ddb.send(new PutCommand({
    TableName: POSTS_TABLE!,
    Item: {
      pk:           { S: "0" },
      payload:      { S: "" },
      //messagemdx:{ S: "n2d" },
      // Optional: ttl value
      ttl:       { N: `${Math.floor(Date.now() / 1000) + CACHE_TTL_SECONDS}` }
    },
    // optional: ConditionExpression to prevent overwrite, etc.
  }));

  //return null
}

/*
 TableName: POSTS_TABLE!,
        Key: { pk: 0 },
        UpdateExpression: "SET payload = :pl, cachedAt = :ts, expiresAt = :exp",
        ExpressionAttributeValues: {
          ":pl": JSON.stringify(posts),
          ":ts": nowSec,
          ":exp": expSec,
        },
*/