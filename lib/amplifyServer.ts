// Safe to share and reuse
import { createServerRunner } from '@aws-amplify/adapter-nextjs';
//import { backend } from '@/amplify/backend';
import outputs from '@/amplify_outputs.json';
//import { S3Client } from '@aws-sdk/client-s3';
//############used many times
export const { runWithAmplifyServerContext } = createServerRunner({ 
    config: outputs, 
});

export const region = outputs.storage.aws_region;
//export const regionDB = outputs.data.MDXupdates.region
export const bucketName = outputs.storage.bucket_name;
//export const bucketNamelo = outputs.storage.buckets.name;

//Amplify Gen 2 Integration chatgpt - A