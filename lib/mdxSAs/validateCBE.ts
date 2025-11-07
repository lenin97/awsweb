// app/actions/getCachedPosts.ts
import {
  DynamoDBDocumentClient,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb'
import {UPDATES_CACHE_POSTTABLE_BE} from '@/lib/types/frontendVars';

// ——— configure clients & tables ———
const UPDATES_TABLE     = UPDATES_CACHE_POSTTABLE_BE
const CACHE_TTL_SECONDS = 60 * 5

// ——— the Server Action ———
/**
 * Attempts to flip `messagemdx` from "cbe" → "cmidfe" atomically.
 * @returns An object with updated messagemdx and slugs.
 */
export async function validateCBE(ddb: DynamoDBDocumentClient): Promise<{ messagemdx: string, slugs: string[] }> {
  try {
    console.log("🔄 validateCBE() called::",UPDATES_TABLE)
    const result = await ddb.send(new UpdateCommand({
      TableName: UPDATES_TABLE!,
      Key: { id: '0' },
      UpdateExpression: `
        SET messagemdx = :newMsg,
            cachedAt   = :ts,
            expiresAt  = :exp
      `,
      ConditionExpression: "messagemdx = :oldMsg",
      ExpressionAttributeValues: {
        ":oldMsg":  "cbe",
        ":newMsg":  "cmidfe",
        ":ts":      Math.floor(Date.now() / 1000),
        ":exp":     Math.floor(Date.now() / 1000) + CACHE_TTL_SECONDS,
      },
      ReturnValues: "ALL_NEW",
    }))

    return {
      messagemdx: result.Attributes?.messagemdx,
      slugs: (result.Attributes?.slug as string)?.split("||") || []
    }
  } catch (err: unknown) {
    console.log("❌ Error during UpdateCommand:");
    if (
      typeof err === "object" &&
      err !== null &&
      "name" in err &&
      err.name === "ConditionalCheckFailedException"
    ) {
      console.log('⚠️ Update skipped: messagemdx was not "cbe" (it’s already been set).');
    }
    return {
      messagemdx: "dnk",
      slugs: []
    }
  }
}
