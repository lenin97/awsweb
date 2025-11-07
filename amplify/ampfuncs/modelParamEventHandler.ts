import { S3Handler, S3Event } from 'aws-lambda';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';

// Table name from environment
const MODEL_AI_TABLE = process.env.MODEL_TABLE!;

// Initialize AWS clients
const s3 = new S3Client({});
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

interface ModelParams {
  model_id: string;
  // prompt removed from modelparam.json usage — fetched from prompttailorcv.txt instead
  charsPerToken: number;
  maxTokenCount: number;
  temperature: number;
  topP: number;
  stopSequences: string[];
  pageMultiplier: number;
}

/**
 * Formats a JS Date into 'DD/MM/YYYY-HH:MM' (24h)
 */
function formatTimestamp(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  const dd = pad(date.getDate());
  const mm = pad(date.getMonth() + 1);
  const yyyy = date.getFullYear();
  const hh = pad(date.getHours());
  const min = pad(date.getMinutes());
  return `${dd}/${mm}/${yyyy}-${hh}:${min}`;
}

/**
 * Sanitizes raw prompt text:
 * - Removes BOM
 * - Normalizes CRLF to LF
 * - Collapses multiple consecutive blank lines to a single blank line
 * - Trims leading/trailing whitespace
 */
function sanitizePromptRaw(raw: string): string {
  if (!raw) return '';
  // Remove BOM
  let out = raw.replace(/^\uFEFF/, '');
  // Normalize CRLF -> LF
  out = out.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  // Trim each line and collapse multiple blank lines to a single blank line
  const lines = out.split('\n').map(line => line.replace(/\s+$/g, '')); // rstrip each line
  // Remove leading/trailing empty lines
  while (lines.length && lines[0].trim() === '') lines.shift();
  while (lines.length && lines[lines.length - 1].trim() === '') lines.pop();
  // Collapse multiple blank lines
  const collapsed: string[] = [];
  let prevBlank = false;
  for (const l of lines) {
    const isBlank = l.trim() === '';
    if (isBlank) {
      if (!prevBlank) collapsed.push(''); // keep a single blank line
      prevBlank = true;
    } else {
      collapsed.push(l);
      prevBlank = false;
    }
  }
  out = collapsed.join('\n').trim();
  return out;
}

export const handler: S3Handler = async (event: S3Event) => {
  console.log('[modelParamsHandler] Received event:', JSON.stringify(event, null, 2));

  for (const record of event.Records) {
    const bucket = record.s3.bucket.name;
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));

    console.log(`[modelParamsHandler] Inspecting object ${key} in bucket ${bucket}`);

    // Only process modelparam.json
    if (!key.endsWith('modelparam.json')) {
      console.log('[modelParamsHandler] Not modelparam.json, skipping');
      continue;
    }

    try {
      // Fetch the object content (modelparam.json)
      const getObj = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
      const raw = await getObj.Body!.transformToString();

      // Sanitize raw input: remove BOM and trim
      const sanitized = raw.replace(/^\uFEFF/, '').trim();
      const params: ModelParams = JSON.parse(sanitized);

      // === NEW: fetch prompt from sibling file prompttailorcv.txt ===
      // Derive prompt key by replacing the file name
      const promptKey = key.replace(/modelparam\.json$/, 'prompttailorcv.txt');

      let promptText = '';
      try {
        console.log(`[modelParamsHandler] Fetching prompt file ${promptKey} from bucket ${bucket}`);
        const promptObj = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: promptKey }));
        const rawPrompt = await promptObj.Body!.transformToString();
        promptText = sanitizePromptRaw(rawPrompt);
        console.log('[modelParamsHandler] Successfully read and sanitized prompttailorcv.txt (length:', promptText.length, ')');
      } catch (promptErr) {
        // If prompt file missing or fails, log a warning and continue with empty prompt
        console.warn('[modelParamsHandler] Warning: could not read prompttailorcv.txt at', promptKey, '-', promptErr);
        promptText = '';
      }

      // Prepare timestamp and update values
      const timestamp = formatTimestamp(new Date());
      const values = {
        ':model_id': params.model_id,
        ':prompt': promptText,
        ':cpt': params.charsPerToken,
        ':mt': params.maxTokenCount,
        ':temp': params.temperature,
        ':tp': params.topP,
        ':ss': params.stopSequences,
        ':pm': params.pageMultiplier,
        ':du': timestamp,
      };

      // Update record in DynamoDB using pk = 0 as key
      await ddb.send(
        new UpdateCommand({
          TableName: MODEL_AI_TABLE,
          Key: { pk: '0' },
          UpdateExpression: `SET model_id = :model_id,
                              prompt = :prompt,
                              charsPerToken = :cpt,
                              maxTokenCount = :mt,
                              temperature = :temp,
                              topP = :tp,
                              stopSequences = :ss,
                              pageMultiplier = :pm,
                              dataUpdated = :du`,
          ExpressionAttributeValues: values,
        })
      );

      console.log('[modelParamsHandler] Successfully updated params in DynamoDB at pk=0');
    } catch (err) {
      console.error('[modelParamsHandler] Error processing modelparam.json:', err);
    }
  }
};
