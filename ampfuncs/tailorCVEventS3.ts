import { S3Handler, S3Event } from "aws-lambda";
import {
  S3Client,
  HeadObjectCommand
} from "@aws-sdk/client-s3";
import {
  LambdaClient,
  InvokeCommand,
} from "@aws-sdk/client-lambda";

import { generateClient } from "aws-amplify/data";
import type { Schema } from "../data/resource";
import { getAmplifyDataClientConfig } from "@aws-amplify/backend/function/runtime";
import { Amplify } from "aws-amplify";
import { env } from "$amplify/env/tailorCVEventS3";
import {validateDocx} from './validateFiles/validateDocx'
import {validatePdf} from './validateFiles/validatePdf'

// ------------------------------------------------------------------
// Amplify setup
// ------------------------------------------------------------------
const { resourceConfig, libraryOptions } =
  await getAmplifyDataClientConfig(env);

Amplify.configure(resourceConfig, libraryOptions);

const client = generateClient<Schema>();

// ------------------------------------------------------------------
// AWS clients
// ------------------------------------------------------------------
const s3 = new S3Client({});
const lambda = new LambdaClient({});

// ------------------------------------------------------------------
// Config
// ------------------------------------------------------------------
const PDF_SPLITTER_FN = process.env.PDF_SPLITTER_FN!;
const DOCX_SPLITTER_FN = process.env.DOCX_SPLITTER_FN!;

//const MAX_DOCX_BYTES = 50_000; // heuristic ~3 pages
//const MAX_PDF_PAGES = 3;
// ------------------------------------------------------------------
// Handler
// ------------------------------------------------------------------
export const handler: S3Handler = async (event: S3Event) => {
  console.log("[validator] event received", {
    records: event.Records.length,
  });  

  for (const record of event.Records) {
    const bucket = record.s3.bucket.name;
    const key = decodeURIComponent(
      record.s3.object.key.replace(/\+/g, " ")
    );

    const ctx = { bucket, key };

    var jobId

    try {
      console.log("[validator] processing object", ctx);     

      // HEAD object
      const head = await s3.send(
        new HeadObjectCommand({ Bucket: bucket, Key: key })
      );

      const contentLength = head.ContentLength ?? 0;
      const metadata = head.Metadata ?? {};
      jobId = metadata.jobid;

      if (!jobId) {
        console.warn("[validator] missing jobId metadata", ctx);
        continue;
      }

      const lowerKey = key.toLowerCase();
      const isPdf = lowerKey.endsWith(".pdf");
      const isDocx = lowerKey.endsWith(".docx");

      if (!isPdf && !isDocx) {
        console.log("[validator] skipped (unsupported extension)", ctx);
        await client.models.JobProgress.update({
          id: jobId!,
          status: "sts00e",
        });
        continue;
      }

      const logCtx = { ...ctx, jobId };

      console.log("[validator] metadata loaded", {
        ...logCtx,
        contentLength,
      });

      // Validate
      if (isPdf) {
        await validatePdf(bucket, key, metadata);
      } else {
        await validateDocx(bucket, key, contentLength);
      }

      console.log("[validator] validation passed", logCtx);

      // Update progress
      await client.models.JobProgress.update({
        id: jobId,
        //step: "Fetching user info",
        status: 'sts001'
      });

      console.log("[validator] JobProgress updated", logCtx);

      // Invoke splitter
      const splitterFnName = isPdf
        ? PDF_SPLITTER_FN
        : DOCX_SPLITTER_FN;

      await lambda.send(
        new InvokeCommand({
          FunctionName: splitterFnName,
          InvocationType: "Event",
          Payload: Buffer.from(
            JSON.stringify({ key, jobId })
          ),
        })
      );

      console.log("[validator] splitter invoked", {
        ...logCtx,
        splitterFnName,
      });
    } catch (err) {
      console.error("[validator] failed", {
        ...ctx,
        error: err instanceof Error ? err.message : err,
      });
      // Optional: mark job as failed
      // await client.models.JobProgress.update({ id: jobId, step: "Failed" });
      await client.models.JobProgress.update({
        id: jobId!,
        status: "sts01e",
      });

      continue;
    }
  }
};
