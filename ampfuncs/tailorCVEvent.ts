import { S3Handler,S3Event } from 'aws-lambda';
import { S3Client, HeadObjectCommand } from '@aws-sdk/client-s3';
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../data/resource";
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime';
import { Amplify } from 'aws-amplify';
import { env } from "$amplify/env/tailorCVEvent"///mustchange!!!!!!!!!!!!!!!!!!!

const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env);

Amplify.configure(resourceConfig, libraryOptions);

const client = generateClient<Schema>();
const s3 = new S3Client({});

export const handler: S3Handler = async (event: S3Event) => {
  console.log('[tailorCVEvent]::Received S3 Event:', JSON.stringify(event, null, 2));

  for (const record of event.Records) {
    const bucket = record.s3.bucket.name;
    const key    = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));

    console.log(`[tailorCVEvent]::Inspecting object ${key} in bucket ${bucket}`);

    if (!key.endsWith('.pdf')) {
      console.log('[tailorCVEvent]::Not a pdf file, exiting.');
      return;
    }

    // Read object metadata
    try {
      const head = await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
      const jobId = head.Metadata?.jobid;
      if (jobId) {
        console.log('[tailorCVEvent]::Found jobid metadata:', jobId);
        const result = await client.queries
                      .tailoredCVflow({ cvid: {idcv:jobId} })
                      .catch((error) => {
                        console.error('[tailorCVEvent]::Error in tailoredCVflow:', error);
                        return null;
                      });
        const signedUrl = result?.data?.signedUrl ?? null;
        const message = result?.data?.message ?? null;

        // You can log, render, or pass this URL somewhere else
        console.log('[tailorCVEvent]::Signed URL:', signedUrl, '::message:',message);
       
      } else {
        console.log('[tailorCVEvent]::No jobid metadata on this object, skipping.');
        return
      }
    } catch (err) {
      console.error('[tailorCVEvent]::Error reading metadata for', key, err);
      return
    }
  }

  return ;
};