import { SQSEvent } from "aws-lambda";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../data/resource";
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime';


export const handler = async (event: SQSEvent) => {
  console.log("[newFunction4nextStep] Received SQS event:", JSON.stringify(event, null, 2));

  let errorCount = 0;

  for (const record of event.Records) {
    try {
      const body = JSON.parse(record.body);
      const message = JSON.parse(body.Message);
      const { tailoredCV, progressId, jobIdCustom } = message;

      if (!progressId || !tailoredCV || !jobIdCustom) {
        throw new Error(`[Validation] Missing required fields: ${JSON.stringify({ tailoredCV, progressId, jobIdCustom })}`);
      }

      console.log("[tailoredCVflow] Step: Saving tailored CV for:", progressId);
      await client.models.JobProgress.update({
        id: progressId,
        step: "Saving tailored CV",
      });

      const result = await client.models.CVreg.get({ id: jobIdCustom });
      const cvPathBucket = result.data?.cvPathBucket;

      if (!cvPathBucket) {
        throw new Error(`[Validation] Missing 'cvPathBucket' in CV record for jobIdCustom: ${jobIdCustom}`);
      }

      const saveResult = await client.queries.saveTailoredCV({
        svnewCVargArg: {
          orgnPath: cvPathBucket,
          tailoredCV,
          userId: "na", // To be replaced with actual user ID
        },
      });

      const signedUrl = saveResult.data;

      if (!signedUrl) {
        throw new Error(`[DataError] saveTailoredCV returned no data for progressId: ${progressId}`);
      }

      console.log("[tailoredCVflow] Step: Done. Signed URL ready for:", progressId);
      await client.models.JobProgress.update({
        id: progressId,
        step: "Done",
        signedUrl,
        status: "success",
      });

    } catch (error) {
      errorCount++;
      const errMsg = error instanceof Error ? error.message : JSON.stringify(error);
      console.error(`[tailoredCVflow] ❌ Error processing record: ${errMsg}`);
    }
  }

  return {
    statusCode: errorCount === 0 ? 200 : 207,
    body: `Processed ${event.Records.length} record(s), ${errorCount} failed.`,
  };
};
