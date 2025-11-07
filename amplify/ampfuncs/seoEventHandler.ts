// amplify/functions/s3MdxHandler/handler.ts
import { S3Handler } from 'aws-lambda';
import { S3Client, GetObjectCommand,ListObjectsV2Command,ListObjectsV2CommandOutput } from '@aws-sdk/client-s3';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand, GetCommand } from '@aws-sdk/lib-dynamodb';

const s3 = new S3Client({});
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const CACHE_TTL = 60 * 60 * 24; // 24h
const BUCKET_NAME    = process.env.MAIN_BUCKET_BUCKET_NAME!;
const PREFIX         = process.env.PREFIX!;          // e.g. 'posts/'
const SEOTBDB    = process.env.SEO_TABLE!;     // your existing cache table


export const handler: S3Handler = async (event) => {
 
   try {
    // 1) Only run on the flag file
    const record = event.Records?.[0];
    if (!record) {
      console.error('No S3 record in event');
      return;
    }

    const keyName = decodeURIComponent(record.s3.object.key);
    if (!keyName.endsWith('done.txt')) {
      console.log('Not a flag file, exiting.');
      return;
    }

    //const fileNames: string[] = [];

    // 2) Load last‑run watermark
    let lastWatermark: number;
    try {
      const waterResp = await ddb.send(
        new GetCommand({
          TableName: SEOTBDB,
          Key: { pk: 'lastRun' },
        })
      );
      lastWatermark = waterResp.Item?.ts?.N
        ? parseInt(waterResp.Item.ts.N, 10)
        : 0;
    } catch (err) {
      console.error('Error loading watermark:', err);
      lastWatermark = 0;
    }

    // 3) Paginate through S3 list
    let continuationToken: string | undefined = undefined;
    const toProcess: { Key: string; LastModified: number }[] = [];

    try {
      do {
        const list:ListObjectsV2CommandOutput = await s3.send(
          new ListObjectsV2Command({
            Bucket: BUCKET_NAME,
            Prefix: PREFIX,
            ContinuationToken: continuationToken,
          })
        );

        for (const obj of list.Contents ?? []) {
          const key = obj.Key;
          const lastModified = obj.LastModified;

          if (!key || !lastModified) continue;

          // ✅ Filter: only .json files, skip folders and done.txt
          const isFolderLike = key.endsWith('/');
          const isFlagFile = key.endsWith('done.txt');
          const isJsonFile = key.toLowerCase().endsWith('.json');

          if (isJsonFile && !isFolderLike && !isFlagFile) {
            const lm = lastModified.getTime();
            if (lm > lastWatermark) {
              toProcess.push({ Key: key, LastModified: lm });
            }
          }
        }

        continuationToken = list.IsTruncated
          ? list.NextContinuationToken
          : undefined;
      } while (continuationToken);
    } catch (err) {
      console.error('Error listing S3 objects:', err);
    }

    if (toProcess.length === 0) {
      console.log(
        'No new or updated files since',
        new Date(lastWatermark).toISOString()
      );
    } else {
      // 4) Process each new/updated file
      let maxLm = lastWatermark;

      for (const { Key, LastModified } of toProcess) {
        try {
          console.log('Processing', Key);

          // 4.1) Download the JSON file
          const getObj = await s3.send(
            new GetObjectCommand({ Bucket: BUCKET_NAME, Key })
          );
          const raw = await getObj.Body!.transformToString();

          // 4.2) Parse as JSON
          let jsonData: unknown;
          try {
            const sanitizedRaw = raw.replace(/^\uFEFF/, '');
            jsonData = JSON.parse(sanitizedRaw);
          } catch (err) {
            console.error(`Failed to parse JSON for ${Key}:`, err);
            continue;
          }

          // Write to your cache table
          //const cacheKey = Key.replace(/^.*\/|\.mdx$/g, '');
          const fileName = Key.split('/').pop(); // e.g., news1.json
          if (!fileName || !fileName.endsWith('.json')) {
            console.warn(`Skipping invalid file name: ${Key}`);
            continue;
          }
          const cacheKey = String(fileName.replace(/\.json$/, '')).trim(); // e.g., "news1"
          console.log('Inserting with pk =', cacheKey);
          const payload = JSON.stringify(jsonData);
          const meta = JSON.stringify({ lastModified: LastModified });
          const ttl = Math.floor(Date.now() / 1000) + CACHE_TTL;

          console.log(`Updated cache record for`);
          await ddb.send(
            new UpdateCommand({
                TableName: SEOTBDB,
                Key: { pk: cacheKey },
                UpdateExpression: 'SET payload = :p, cacheMeta = :m',
                ExpressionAttributeValues: {
                    ':p': payload,
                    ':m': meta,
                }
            })
          );

          console.log(`cache record for ${cacheKey}`);

          // Track highest timestamp
          if (LastModified > maxLm) {
            maxLm = LastModified;
          }

          //fileNames.push(cacheKey);
        } catch (err) {
          console.error(`Error processing file ${Key}:`, err);
        }
      }

      // 5) Advance watermark
      try {
        await ddb.send(
          new UpdateCommand({
            TableName: SEOTBDB,
            Key: { pk: 'lastRun' },
            UpdateExpression: 'SET ts = :ts',
            ExpressionAttributeValues: {
              ':ts': maxLm,
            },
          })
        );
        console.log('Updated watermark to',new Date(maxLm).toISOString());
      } catch (err) {
        console.error('Error updating watermark:', err);
      }
    }
    console.log('[Done] Handler execution completed');
  } catch (err) {
    console.error('[Fatal] Unexpected handler failure:', err);
  }

};