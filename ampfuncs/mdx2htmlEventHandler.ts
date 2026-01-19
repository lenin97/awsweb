// amplify/functions/s3MdxHandler/handler.ts
import { S3Handler } from 'aws-lambda';
import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
  ListObjectsV2CommandOutput,
} from '@aws-sdk/client-s3';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../data/resource';
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime';
import { Amplify } from 'aws-amplify';
import { env } from '$amplify/env/mdx2htmlEventHandler';

// Initialize Amplify Data Client
const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env);
Amplify.configure(resourceConfig, libraryOptions);
const client = generateClient<Schema>();

// AWS clients
const s3 = new S3Client({});
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

// Configuration from env
const BUCKET_NAME = process.env.MAIN_BUCKET_BUCKET_NAME!;
const PREFIX = process.env.PREFIX!; // e.g. 'posts/'
const WATERMARK_TABLE = process.env.WATERMARK_TABLE!;

interface Link {
  label: string;
  url: string;
}

interface Post {
  slug: string;
  title: string;
  date: string;
  description: string;
  image: string;
  links: Link[];
}

type PostsData_Json = {
  articlemeta: string;
  payload: string;
  ts_json: string;
  slug: string;
};

type PostsData_Body = {
  body: string;
  ts_content: string;
};

// typed union for allowed DynamoDB expression attribute values

/**
 * Minimal, non-destructive sanitizer tailored for Markdown content.
 * - removes BOM (U+FEFF)
 * - removes NULL bytes
 * - removes low control characters except newline/carriage-return/tab
 *
 * This preserves Markdown structure, inline HTML, attributes, URIs, etc.
 */
function sanitizeContent(raw: string): string {
  if (!raw) return raw;

  let s = raw;

  // Remove BOM if present
  s = s.replace(/^\uFEFF/, '');

  // Remove null bytes
  s = s.replace(/\0/g, '');

  // Remove other low-control characters except \n \r \t
  s = s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // Trim trailing/leading whitespace (optional but often helpful)
  s = s.trim();

  return s;
}

export const handler: S3Handler = async (event) => {
  console.log('[mdx2posts]::--- Handler start ---');
  try {
    const record = event.Records?.[0];
    if (!record) {
      console.error('[mdx2posts]::No S3 record in event');
      return;
    }
    const keyName = decodeURIComponent(record.s3.object.key);
    if (!keyName.endsWith('done.txt')) {
      console.log('[mdx2posts]::Not a flag file, exiting.');
      return;
    }

    // Load last-run watermark
    let lastWatermark = 0;
    try {
      const waterResp = await ddb.send(
        new GetCommand({ TableName: WATERMARK_TABLE, Key: { pk: 'lastRun' } })
      );
      if (typeof waterResp.Item?.ts === 'number') {
        lastWatermark = waterResp.Item.ts;
      }
    } catch (err) {
      console.error('[mdx2posts]::Error loading watermark:', err);
    }

    // List S3 objects and filter for news files
    let continuationToken: string | undefined;
    const filesMap = new Map<
      string,
      { json?: { Key: string; LastModified: number }; content?: { Key: string; LastModified: number } }
    >();

    // NOTE: regex uses \d+ so multi-digit IDs work (news12.json -> id "12")
    do {
      const list: ListObjectsV2CommandOutput = await s3.send(
        new ListObjectsV2Command({
          Bucket: BUCKET_NAME,
          Prefix: PREFIX,
          ContinuationToken: continuationToken,
        })
      );

      for (const obj of list.Contents ?? []) {
        if (!obj.Key || !obj.LastModified) continue;
        const lm = obj.LastModified.getTime();

        const jsonMatch = obj.Key.match(/news(\d+)\.json$/);
        const contentMatch = obj.Key.match(/news(\d+)content\.txt$/);
        if (jsonMatch || contentMatch) {
          const id = jsonMatch ? jsonMatch[1] : contentMatch![1];
          const entry = filesMap.get(id) || {};
          if (jsonMatch && lm > lastWatermark) {
            console.log(`[mdx2posts]::JSON updated: ${obj.Key}`);
            entry.json = { Key: obj.Key, LastModified: lm };
          } else if (jsonMatch) {
            entry.json = entry.json || { Key: obj.Key, LastModified: lm };
          }
          if (contentMatch && lm > lastWatermark) {
            console.log(`[mdx2posts]::Content updated: ${obj.Key}`);
            entry.content = { Key: obj.Key, LastModified: lm };
          } else if (contentMatch) {
            entry.content = entry.content || { Key: obj.Key, LastModified: lm };
          }
          filesMap.set(id, entry);
        }
      }

      continuationToken = list.IsTruncated ? list.NextContinuationToken : undefined;
    } while (continuationToken);

    console.log('[mdx2posts]::Total IDs to process:', filesMap.size);

    if (filesMap.size === 0) {
      console.log('[mdx2posts]::No new or updated news files since', new Date(lastWatermark).toISOString());
      return;
    }

    const fileNames: string[] = [];
    // We'll collect posts by their numeric index (news id -> Post)
    const postsByIndex = new Map<number, Post>();
    let maxLm = lastWatermark;

    // --- NEW: map to track slug updates coming from JSON files only ---
    const jsonSlugMap = new Map<number, string>();
    // --- NEW: map to track title updates coming from JSON files only ---
    const jsonTitleMap = new Map<number, string>();
    // ------------------------------------------------------------------

    // Process files
    for (const [idStr, { json, content }] of filesMap) {
      // Skip if neither file is newer than last watermark
      const jsonUpdated = json && json.LastModified > lastWatermark;
      const contentUpdated = content && content.LastModified > lastWatermark;
      if (!jsonUpdated && !contentUpdated) {
        console.log(`[mdx2posts]::Skipping news${idStr} - no updates`);
        continue;
      }

      console.log(`[mdx2posts]::Processing news${idStr}:`, {
        jsonUpdated,
        contentUpdated,
        jsonKey: json?.Key,
        contentKey: content?.Key,
      });

      const idNum = parseInt(idStr, 10);
      if (Number.isNaN(idNum) || idNum <= 0) {
        console.warn(`[mdx2posts]::Invalid numeric id parsed from '${idStr}', skipping`);
        continue;
      }
      const cacheKey = `news${idStr}`;
      let payload: string | undefined;
      let meta: string | undefined;
      let body: string | undefined;
      let slugValue: string | undefined;
      let titleValue: string | undefined;
      const payload_post_data_json: PostsData_Json = {
        articlemeta: '',
        payload: '',
        slug: '',
        ts_json: ''
      } 
      const payload_post_data_body: PostsData_Body = {
        body: '',
        ts_content: ''
      }                                 

      // Process JSON if updated
      if (jsonUpdated) {
        console.log(`[mdx2posts]::Fetching JSON file from S3: ${json!.Key}`);
        const getObj = await s3.send(new GetObjectCommand({ Bucket: BUCKET_NAME, Key: json!.Key }));
        const raw = await getObj.Body!.transformToString();
        const sanitized = raw.replace(/^\uFEFF/, '');
        const jsonData = JSON.parse(sanitized);

        const post: Post = {
          slug: jsonData.slug,
          title: jsonData.title,
          date: jsonData.date,
          description: jsonData.description,
          image: jsonData.image,
          links: jsonData.links,
        };

        // Keep in postsByIndex for later assembly into global payload
        postsByIndex.set(idNum, post);

        payload = JSON.stringify(post);
        meta = JSON.stringify({
          publishedTime: jsonData.publishedTime || '',
          modifiedTime: jsonData.modifiedTime || '',
          expirationTime: jsonData.expirationTime || '',
          authors: jsonData.authors || '',
          section: jsonData.section || '',
          tags: jsonData.tags || '',
        });

        // Capture slug so we can store it in the per-item cache record
        if (typeof jsonData.slug === 'string' && jsonData.slug.length > 0) {
          slugValue = jsonData.slug;
        }

        // Capture title for messagetitle mapping
        if (typeof jsonData.title === 'string' && jsonData.title.length > 0) {
          titleValue = jsonData.title;
        }

        fileNames.push(cacheKey);

        payload_post_data_json.payload=payload
        payload_post_data_json.articlemeta=meta
        payload_post_data_json.ts_json=new Date(json!.LastModified).toISOString();
        payload_post_data_json.slug=slugValue??''

        // --- NEW: record that this id had a JSON update and what the (new) slug is ---
        if (slugValue) {
          jsonSlugMap.set(idNum, slugValue);
        } else {
          // If JSON updated but no slug present, ensure we remove any existing mapping by setting empty string
          jsonSlugMap.set(idNum, '');
        }
        // --- NEW: record title mapping for this id (or empty string to remove) ---
        if (titleValue) {
          jsonTitleMap.set(idNum, titleValue);
        } else {
          jsonTitleMap.set(idNum, '');
        }
        // --------------------------------------------------------------------------
      }

      // Process content if updated
      if (contentUpdated) {
        console.log(`[mdx2posts]::Fetching content file from S3: ${content!.Key}`);
        const getObj = await s3.send(new GetObjectCommand({ Bucket: BUCKET_NAME, Key: content!.Key }));
        const raw = await getObj.Body!.transformToString();
        // MINIMAL SANITIZE: do not alter markdown structure; remove only BOM/nulls/control-chars
        const sanitized = sanitizeContent(raw);

        // Store body as a plain string (not JSON stringified)
        body = sanitized;
        if (!fileNames.includes(cacheKey)) fileNames.push(cacheKey);

        payload_post_data_body.body=body
        payload_post_data_body.ts_content=new Date(content!.LastModified).toISOString();
      }


      const payload_PostsData= { id:cacheKey,...removeEmpty(payload_post_data_json), ...removeEmpty(payload_post_data_body)}

      console.log('[mdx2posts]::PostsData payload_PostsData:', payload_PostsData);

      const resp = await client.models.PostsData.update(payload_PostsData,
          { 
            authMode: 'identityPool' 
          }
        );

      console.log('[mdx2posts]::PostsData.update resp:', {
        data: resp.data,
        errors: resp.errors,
      });

      if (!resp.data) {
        // initial creation - if no json updates, newMessagemdx/newMessagetitle might be empty; keep previous behaviour if desired
        const createResp = await client.models.PostsData.create(payload_PostsData,
          { 
            authMode: 'identityPool' 
          }
        );

        console.log('[mdx2posts]::PostsData.create createResp:', {
          data: createResp.data,
          errors: createResp.errors,
        });
      }

      if (jsonUpdated){
        client.mutations.metaGenerator({
                metaJSON:{
                  idname:cacheKey,
                  metainfo:payload,
                  articlemeta:meta,
                  openGraphType:'article',
                  slug:slugValue
                }
              })
      }

      if (json?.LastModified && json.LastModified > maxLm) maxLm = json.LastModified;
      if (content?.LastModified && content.LastModified > maxLm) maxLm = content.LastModified;
    }

    console.log('[mdx2posts]::Advancing watermark to:', maxLm, new Date(maxLm).toISOString());
    // Advance watermark
    await ddb.send(
      new UpdateCommand({
        TableName: WATERMARK_TABLE,
        Key: { pk: 'lastRun' },
        UpdateExpression: 'SET ts = :ts',
        ExpressionAttributeValues: { ':ts': maxLm },
      })
    );

    // Merge into global posts record (pk = '0') but preserve positional mapping:
    // news1.json -> position 0, news2.json -> position 1, etc.
    
    const resp_get = await client.models.PostsData.get(
      {
        id: '0' 
      },
      { 
        authMode: 'identityPool' 
      }
    );

    console.log('[mdx2posts]::PostsData.get resp_get:', {
      data: resp_get.data,
      errors: resp_get.errors,
    });

    // Parse existing global payload into an array, if present
    let existingMerged: Array<Post | null> = [];
    if (resp_get.data && resp_get.data.payload) {
      try {
        const parsed = JSON.parse(resp_get.data.payload);
        if (Array.isArray(parsed)) {
          existingMerged = parsed;
        } else {
          // if existing payload isn't array, preserve it as single-entry array
          existingMerged = [parsed];
        }
      } catch (err) {
        console.warn('[mdx2posts]::Could not parse existing global payload, starting fresh:', err);
        existingMerged = [];
      }
    }

    // We'll create a new merged array initialized from existingMerged
    const merged: Array<Post | null> = existingMerged.slice();

    // Determine necessary size
    let highestIndexFromUpdates = 0;
    for (const idx of postsByIndex.keys()) {
      if (idx > highestIndexFromUpdates) highestIndexFromUpdates = idx;
    }
    const requiredLength = Math.max(merged.length, highestIndexFromUpdates);

    // Ensure merged has required length (fill with nulls if necessary)
    while (merged.length < requiredLength) merged.push(null);

    // Replace positions from updates: newsX -> position X-1
    for (const [idx, p] of postsByIndex.entries()) {
      const position = idx - 1; // news1 => index 0
      // ensure array is large enough
      while (merged.length <= position) merged.push(null);
      merged[position] = p;
    }

    // Optionally: if you prefer to remove trailing nulls, uncomment below.
    // while (merged.length > 0 && merged[merged.length - 1] === null) merged.pop();    
    const resp_upd = await client.models.PostsData.update(
      {
        id: '0',                 
        payload: JSON.stringify(merged), 
        ts_json: new Date(maxLm).toISOString()  
      },
      { 
        authMode: 'identityPool' 
      }
    );

    console.log('[mdx2posts]::PostsData.update resp_upd:', {
      data: resp_upd.data,
      errors: resp_upd.errors,
    });
    if (!resp_upd.data) {
      // initial creation - if no json updates, newMessagemdx/newMessagetitle might be empty; keep previous behaviour if desired
      const resp_create = await client.models.PostsData.create(
        {
          id: '0', 
          articlemeta: 'na', 
          body: 'na', 
          payload: JSON.stringify(merged), 
          slug: 'na', 
          ts_json: new Date(maxLm).toISOString() 
        },
        { 
          authMode: 'identityPool' 
        }
      );

      console.log('[mdx2posts]::PostsData.create resp_create:', {
        data: resp_create.data,
        errors: resp_create.errors,
      });
    }
    

    // Report processed slugs via AppSync
    if (fileNames.length > 0) {
      const slugJoin = fileNames.join('||');

      // Build new messagemdx only when JSON updates occurred; otherwise keep existing messagemdx unchanged.
      let existingMessagemdx = '';
      let existingMessagetitle = '';
      //let existingRecordExists = false;

      try {
        // Try to fetch existing MDXupdates record
        const getRes = await client.models.MDXupdates.get({ id: '0' }, { authMode: 'identityPool' });
        if (getRes.data) {
          console.log('[mdx2posts]::exist record in MDXupdates')
          //existingRecordExists = true;
          existingMessagemdx = getRes.data.messagemdx || '';
          existingMessagetitle = getRes.data.messagetitle || '';
        } else {
          console.log('[mdx2posts]::Does Not Exist record in MDXupdates')
        }
      } catch (err) {
        // Non-fatal: record may not exist yet
        console.warn('[mdx2posts]::Could not fetch existing MDXupdates record (continuing):', err);
      }

      // Compute new messagemdx only if there were JSON updates
      let newMessagemdx = existingMessagemdx;
      if (jsonSlugMap.size > 0) {
        // Parse existing into a map
        const combinedMap = new Map<number, string>();
        if (existingMessagemdx && existingMessagemdx.length > 0) {
          const parts = existingMessagemdx.split('|').map((p) => p.trim()).filter(Boolean);
          for (const part of parts) {
            const m = part.match(/^news(\d+):(.*)$/);
            if (m) {
              const idx = parseInt(m[1], 10);
              combinedMap.set(idx, m[2]);
            }
          }
        }

        // Apply replacements from this run (jsonSlugMap)
        for (const [idNum, slug] of jsonSlugMap.entries()) {
          if (slug && slug.length > 0) {
            combinedMap.set(idNum, slug);
          } else {
            // if slug is empty string => remove existing mapping for that id
            combinedMap.delete(idNum);
          }
        }

        // Build sorted string
        const keys = Array.from(combinedMap.keys()).sort((a, b) => a - b);
        const pairs = keys.map((k) => `news${k}:${combinedMap.get(k)}`);
        newMessagemdx = pairs.join('|');
      }

      // Compute new messagetitle only if there were JSON title updates
      let newMessagetitle = existingMessagetitle;
      if (jsonTitleMap.size > 0) {
        // Parse existing into a map
        const combinedTitleMap = new Map<number, string>();
        if (existingMessagetitle && existingMessagetitle.length > 0) {
          const parts = existingMessagetitle.split('|').map((p) => p.trim()).filter(Boolean);
          for (const part of parts) {
            const m = part.match(/^news(\d+):(.*)$/);
            if (m) {
              const idx = parseInt(m[1], 10);
              combinedTitleMap.set(idx, m[2]);
            }
          }
        }

        // Apply replacements from this run (jsonTitleMap)
        for (const [idNum, title] of jsonTitleMap.entries()) {
          if (title && title.length > 0) {
            combinedTitleMap.set(idNum, title);
          } else {
            // if title is empty string => remove existing mapping for that id
            combinedTitleMap.delete(idNum);
          }
        }

        // Build sorted string
        const keys = Array.from(combinedTitleMap.keys()).sort((a, b) => a - b);
        const pairs = keys.map((k) => `news${k}:::${combinedTitleMap.get(k)}`);
        newMessagetitle = pairs.join('|');
      }

      // Write to AppSync: update if exists, otherwise create (first-run)
      try {
        const updateResult = await client.models.MDXupdates.update(
          { id: '0', slug: slugJoin, messagemdx: newMessagemdx, messagetitle: newMessagetitle },
          { authMode: 'identityPool' }
        );
        if (!updateResult.data) {
          // initial creation - if no json updates, newMessagemdx/newMessagetitle might be empty; keep previous behaviour if desired
          await client.models.MDXupdates.create(
            { id: '0', slug: slugJoin, messagemdx: newMessagemdx, messagetitle: newMessagetitle },
            { authMode: 'identityPool' }
          );
        }

        console.log(
          `[mdx2posts]::[Update] MDXupdates with slug: ${slugJoin} messagemdx: ${newMessagemdx} messagetitle: ${newMessagetitle}`
        );
      } catch (err) {
        console.error('[mdx2posts]::Error updating/creating MDXupdates:', err);
      }
    }

    console.log('[mdx2posts]::[Done] Handler execution completed');
  } catch (err) {
    console.error('[mdx2posts]::[Fatal] Unexpected handler failure:', err);
  }
};

// Narrow check for "empty" values
function isEmptyValue(val: unknown): boolean {
  if (val === "" || val === null || val === undefined) return true;

  if (Array.isArray(val)) {
    return val.length === 0;
  }

  if (typeof val === "object") {
    return val !== null && Object.keys(val).length === 0;
  }

  return false;
}

// Remove keys where values are empty
function removeEmpty<T extends object>(obj: T): Partial<T> {
  const cleanedEntries = Object.entries(obj).filter(
    ([, v]) => !isEmptyValue(v)
  );

  const cleaned = Object.fromEntries(cleanedEntries) as Partial<T>;

  return Object.keys(cleaned).length > 0 ? cleaned : {};
}