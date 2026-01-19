// amplify/functions/s3MdxHandler/handler.ts
import { S3Handler } from 'aws-lambda';
import { S3Client, GetObjectCommand,ListObjectsV2Command,ListObjectsV2CommandOutput } from '@aws-sdk/client-s3';
import type { Schema } from '../data/resource';
import { generateClient } from 'aws-amplify/data';
import { Amplify } from 'aws-amplify';
import { env } from "$amplify/env/seoEventHandler";
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime';
import {generateRobot,genrateSitemap,sitemapSlugs,mergesitemap} from '../tasksResolvers/crawl'
import {RobotsTxtMeta,SitemapEntry} from '../tasksResolvers/UtilCrawl'

const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env);
Amplify.configure(resourceConfig, libraryOptions);
const client = generateClient<Schema>();

const s3 = new S3Client({});

//const CACHE_TTL = 60 * 60 * 24; // 24h
const BUCKET_NAME    = process.env.MAIN_BUCKET_BUCKET_NAME!;
const PREFIX         = process.env.PREFIX!;          // e.g. 'posts/'
//const SEOTBDB    = process.env.SEO_TABLE!;     // your existing cache table


export const handler: S3Handler = async (event) => {
 
   try {
    // 1) Only run on the flag file
    const record = event.Records?.[0];
    if (!record) {
      console.error('[seoEventHandler]::No S3 record in event');
      return;
    }

    const keyName = decodeURIComponent(record.s3.object.key);
    if (!keyName.endsWith('done.txt')) {
      console.log('[seoEventHandler]::Not a flag file, exiting.');
      return;
    }

    //const fileNames: string[] = [];

    // 2) Load last‑run watermark
    let lastWatermark: number;
    try {

      const waterResp= await client.models.SeoMeta.get({ id: 'lastRun' });
      lastWatermark = waterResp.data?.ts
        ? new Date(waterResp.data.ts).getTime() // epoch milliseconds
        : 0
    } catch (err) {
      console.error('[seoEventHandler]::Error loading watermark:', err);
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
      console.error('[seoEventHandler]::Error listing S3 objects:', err);
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
          console.log('[seoEventHandler]::Processing', Key);

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
            console.error(`[seoEventHandler]::Failed to parse JSON for ${Key}:`, err);
            continue;
          }

          // Write to your cache table
          //const cacheKey = Key.replace(/^.*\/|\.mdx$/g, '');
          const fileName = Key.split('/').pop(); // e.g., news1.json
          if (!fileName || !fileName.endsWith('.json')) {
            console.warn(`[seoEventHandler]::Skipping invalid file name: ${Key}`);
            continue;
          }
          const cacheKey = String(fileName.replace(/\.json$/, '')).trim(); // e.g., "news1"
          console.log('Inserting with pk =', cacheKey);
          const payload = JSON.stringify(jsonData);
          const meta = new Date(LastModified).toISOString()//new Date(LastModified).toISOString();
          //const ttl = Math.floor(Date.now() / 1000) + CACHE_TTL;

          switch(cacheKey){
            case 'robots':
              const rbbody: RobotsTxtMeta =
                typeof payload === 'string'
                  ? (JSON.parse(payload) as RobotsTxtMeta)
                  : (payload as RobotsTxtMeta);
              const robotstxt= generateRobot(rbbody)
              const robots_saved=await client.models.SeoMeta.update({
                            id: cacheKey,
                            crawltxt: robotstxt
                        });
              if(!robots_saved.data){
                  await client.models.SeoMeta.create({
                            id: cacheKey,
                            crawltxt: robotstxt,                            
                        });

              }
              break

            case 'sitemap':
              const dbUrls =
                typeof payload === 'string'
                  ? (JSON.parse(payload) as SitemapEntry[])
                  : (payload as SitemapEntry[]);
                  
              const getRes = await client.models.MDXupdates.get({ id: '0' }, { authMode: 'identityPool' });
              const messagemdx4sitemap = getRes.data?.messagemdx || '';
              const sitemap_slugs=sitemapSlugs(messagemdx4sitemap)
              const full_sitemap=mergesitemap(dbUrls,sitemap_slugs)
              const sitemapxml=genrateSitemap(full_sitemap)
              const sitemap_saved=await client.models.SeoMeta.update({
                            id: cacheKey,
                            crawltxt: sitemapxml
                        });
              if(!sitemap_saved.data){
                await client.models.SeoMeta.create({
                            id: cacheKey,
                            crawltxt: sitemapxml
                        });
              }
              break

            default:
              console.log("[seoEventHandler]::TCV_BASE_DOMAIN::",process.env.TCV_BASE_DOMAIN,"::TCV_APP_NAME_HEADER::",process.env.TCV_APP_NAME_HEADER)
              await client.mutations.metaGenerator({
                metaJSON:{
                  idname:cacheKey,
                  metainfo:payload,
                  metastamp:meta,
                  openGraphType:'website'
                }
              })
              break



          }
          console.log(`[seoEventHandler]::Updated cache record for`);
          console.log(`[seoEventHandler]::cache record for ${cacheKey}`);

          // Track highest timestamp
          if (LastModified > maxLm) {
            maxLm = LastModified;
          }

          //fileNames.push(cacheKey);
        } catch (err) {
          console.error(`[seoEventHandler]::Error processing file ${Key}:`, err);
        }
      }

      // 5) Advance watermark
      try {//new Date(maxLm).toISOString();
        const lastrun_saved=await client.models.SeoMeta.update({
                id: 'lastRun',
                ts: new Date(maxLm).toISOString(),
            })
        if(!lastrun_saved.data){
          await client.models.SeoMeta.create({
                id: 'lastRun',
                ts: new Date(maxLm).toISOString(),
            })
        }

        console.log('[seoEventHandler]::Updated watermark to',new Date(maxLm).toISOString());
      } catch (err) {
        console.error('[seoEventHandler]::Error updating watermark:', err);
      }
    }
    console.log('[seoEventHandler]::[Done] Handler execution completed');
  } catch (err) {
    console.error('[seoEventHandler]::[Fatal] Unexpected handler failure:', err);
  }

};