//'use server';

import { fetchAuthSession } from 'aws-amplify/auth/server';
import { runWithAmplifyServerContext, region,bucketName } from '@/lib/amplifyServer';
import { cookies, headers } from 'next/headers';
import { list } from '@aws-amplify/storage/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getCityCountryFromIp } from '@/lib/getGeoLocation';
//import { getCurrentUser } from 'aws-amplify/auth';

type Props = {
  fileKey: string;
};

export default async function LogDownloadActivityS3({ fileKey }: Props) {
  try {
    await runWithAmplifyServerContext({
      nextServerContext: { cookies },
      operation: async (contextSpec) => {
        const session = await fetchAuthSession(contextSpec);
        //const { userId } = await getCurrentUser();
        //const userId = session.userSub;
        const identityId = session.identityId;
        if (!identityId) throw new Error('Guest with No id');

        console.log('✅ Gusest user:', { identityId });

        const headerList = await headers(); // ✅ fixed//
        const ip =
          headerList.get('x-forwarded-for')?.split(',')[0]?.trim() ??
          headerList.get('cf-connecting-ip') ??
          '';

        const location = await getCityCountryFromIp(ip);
        const now = new Date();//tools/tailorcv/{entity_id}/logs/
        const logPath = `tools/tailorcv/logs/${fileKey}/${now.toISOString()}.json`;

        //const { region, bucketName } = contextSpec.resources.storage.mainBucket;

        //const region = process.env.AWS_REGION  || regionv;
        //const bucketName = process.env.STORAGE_BUCKET_NAME || bucketNamev;

         console.log('📦 Using bucket:', bucketName);
         console.log('📦 Using region:', region);
         //console.log('📦 Using process region:', process.env.AWS_REGION);
         //console.log('📦 Using process bucket:', process.env.STORAGE_BUCKET_NAME);

        const existingLogs = await list(contextSpec,{
          path: `tools/tailorcv/logs/${fileKey}/`, // ✅ latest API: uses `path`
          options: {
            // must match the bucket you used in uploadData
            bucket: "mainBucket",
          },
        });

        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
        const recentLogExists = existingLogs.items.some((item) => {
          const timestampStr = item?.path?.split('/').pop()?.replace('.json', '');
          if (!timestampStr) return false;
          const timestamp = new Date(timestampStr);
          return timestamp > tenMinutesAgo;
        });        

        if (!recentLogExists) {

          console.log('🆕 No recent log found. Uploading new log...');
          
          const s3 = new S3Client({
                      region,
                      credentials: session.credentials,
                      //endpoint: `https://s3.${region}.amazonaws.com`, // ✅ set regional endpoint
                    });
/*
          const logData = JSON.stringify({
                            identityId,
                            fileKey,
                            location,
                            timestamp: now.toISOString(),
                          });*/
          
          const logDataObj = { identityId, fileKey, location, timestamp: now.toISOString() };
          const logData = Buffer.from(JSON.stringify(logDataObj), 'utf8');

          const command = new PutObjectCommand({
                            Bucket: bucketName,
                            Key: logPath,
                            Body: logData,
                            ContentType: 'application/json',
                          });

          await s3.send(command);
            
        }
      },
    });
  } catch (err) {
    console.error('uploading log to S3 failed:', err);
    // Fail silently
  }

  return null;
}
