import type { Schema } from '../data/resource';
import { generateClient } from 'aws-amplify/data';
import { Amplify } from 'aws-amplify';
import { env } from "$amplify/env/processTailorCVflow"
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime';
import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";

const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env);

Amplify.configure(resourceConfig, libraryOptions);

const client = generateClient<Schema>();

const lambda = new LambdaClient({});

export const handler: Schema['tailoredCVflow']['functionHandler'] = async (event, context) => {
  const { cvid } = event.arguments;

  console.log('[tailoredCVflow] Function started with cvid:', cvid);

  try {
    if (!cvid?.idcv) {
      throw new Error('Missing or invalid CVid reference');
    }

    // Step 1: Create job progress record
    console.log('[tailoredCVflow] Creating job progress for:', cvid.idcv);

    const jobProgressId = cvid.idcv;

    // Step 2: Fetch CV record
    console.log('[tailoredCVflow] Fetching CV record for:', cvid.idcv);
    const result = await client.models.CVreg.get({ id: cvid.idcv });

    if (!result.data) {
       console.warn('[tailoredCVflow] No CV record found for:', cvid.idcv);
      return { message: 'Record not found.', signedUrl: null };
    }

    const { cvPathBucket } = result.data;
    console.log('[tailoredCVflow] CV record found. Key:', cvPathBucket);

    if (!cvPathBucket) {
      console.warn('[tailoredCVflow] Missing fields in CV record');
      return { message: 'Record exists but required fields are missing.', signedUrl: null };
    }

    // Step 3: Update progress
    console.log('[tailoredCVflow] Step: Fetching user info');
    await client.models.JobProgress.update({
      id: jobProgressId!,
      step: 'Fetching user info',
    });
/*
    // 1️⃣ Get the target Lambda name
    const fnName = process.env.TEXTRACT_FN_NAME;
    if (!fnName) {
      console.error('[tailoredCVflow] TEXTRACT_FN_NAME is not set');
      throw new Error("TEXTRACT_FN_NAME is not set");
    }
*/
    // 3️⃣ Build the exact payload shape your Python handler expects:
    const payload2send = {
      arguments: {
        s3FileInputArg: {
          key: cvPathBucket,
          progressid: jobProgressId,
          //jobid: cvid.idcv
          // bucket isn’t needed because Python reads MAINBUCKET_BUCKET_NAME env var
        },
      },
    };
//////////////////////////
    console.log('[tailoredCVflow] Step: calling splitter');
    const splitterfnName = process.env.SPLITTER_FN_NAME
    await lambda.send(
      new InvokeCommand({
        FunctionName: splitterfnName,
        InvocationType: 'Event',
        Payload: Buffer.from(JSON.stringify(payload2send)),
      })
    )
    console.log('[tailoredCVflow] Step: calling splitter fire and forget');
///////////////////////////
    // 4️⃣ Invoke the Python Lambda
    /*
    const resp = await lambda.send(
      new InvokeCommand({
        FunctionName: fnName,
        Payload: Buffer.from(JSON.stringify(payload2send)),
      })
    );

    const rawPayload = resp.Payload
      ? Buffer.from(resp.Payload).toString()
      : undefined;

    const parsedPayload = rawPayload ? JSON.parse(rawPayload) : null;

    if (!parsedPayload || parsedPayload.status !== 'STARTED') {
      console.error('[tailoredCVflow] Textract Lambda failed or returned unexpected result', parsedPayload);

      const errorCode = parsedPayload?.error_code || 'UNKNOWN_ERROR';
      const errorMessage = parsedPayload?.error_message || 'Unknown error occurred while starting Textract job.';

      console.log('[tailoredCVflow] Step: Fail Textract Lambda');
      await client.models.JobProgress.update({
        id: jobProgressId!,
        status: 'error',
      });

      return {
        message: `${errorCode}: ${errorMessage}`,
        signedUrl: null
      };
    }
    */
    return {
      message: 'Textract job successfully started.',
      signedUrl: null
    };
  } catch (error) {
    console.error('[tailoredCVflow] ❌ Error:', error);
    return {
      message: 'Validation failed due to internal error.',
      signedUrl: null
    };
  }
};