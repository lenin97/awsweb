import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import type { Schema } from '../data/resource'
import { generateClient } from "aws-amplify/data";
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime';
import { Amplify } from 'aws-amplify';
import { env } from "$amplify/env/saveTailoredCV"///mustchange!!!!!!!!!!!!!!!!!!!

const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env);

Amplify.configure(resourceConfig, libraryOptions);

const client = generateClient<Schema>();

const s3 = new S3Client({});
const BUCKET_NAME = process.env.MAIN_BUCKET_BUCKET_NAME;//process.env.TAILORED_CV_BUCKET!;

export const handler: Schema["saveTailoredCV"]["functionHandler"] = async (event, context) => {
  const args = event.arguments?.svnewCVargArg;

  if (!args || !args.tailoredCV || !args.userId || !args.orgnPath) {
    throw new Error("Missing required arguments: 'tailoredCV' or 'userId'.");
  }

  const tailoredCV = args.tailoredCV;
  const userId = args.userId;
  //`tools/tailorcv/${userId}/${file.name}`
  let key=null;// = `tailored_cvs/${userId}_tailored_cv.txt`;
  
  console.log('[saveTailoredCV] userId:', userId);
  console.log('[saveTailoredCV] tailoredCV:', tailoredCV );

  const lastDotIndex = args.orgnPath.lastIndexOf('.');
  if (lastDotIndex === -1) {
    // No extension found
    //key = `${args.orgnPath}-processed`;
    key = `${args.orgnPath}-processed.txt`;
  }else{

    const base = args.orgnPath.slice(0, lastDotIndex);
    key = `${base}-processed.txt`;

  }

  console.log('[saveTailoredCV] BUCKET_NAME:', BUCKET_NAME );
  
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: tailoredCV,
    ContentType: "text/plain",
  }));

  await client.models.CVreg.update({
        id: userId,
        new_cv_body:tailoredCV,
      });

  return key;
};
