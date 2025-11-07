import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../data/resource'; // Adjust as needed
import { v4 as uuidv4 } from 'uuid';
/////////////////////////////////////////////////
import { Amplify } from 'aws-amplify';
import { env } from "$amplify/env/uploadResolv"
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime';
import type { AppSyncIdentityCognito,AppSyncIdentityIAM } from 'aws-lambda';


const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env);

Amplify.configure(resourceConfig, libraryOptions);

const dataClient = generateClient<Schema>();
// Replace 'myfiles' with the actual name of your storage resource
//const BUCKET_NAME = process.env.PUBLIC_BUCKET_NAME;

//const s3 = new S3Client({ region: process.env.AWS_REGION });


export const handler: Schema['uploadCVflow']['functionHandler'] = async (event, context) => {
  
   // Step 1: Validate and narrow identity
  /*
  const identity = event.identity;
  if (!identity || !('claims' in identity)) {
    console.error('No valid Cognito identity with claims found:', identity);
    throw new Error('Unauthorized: No user identity found');
  }
  const userSub = (identity as AppSyncIdentityCognito).claims.sub;
  */
  const identity = event.identity;

  if (!identity) {
    console.error('No identity provided');
    throw new Error('Unauthorized');
  }

  let userIdentifier: string;

  if ('claims' in identity) {
    // Authenticated user
    userIdentifier = (identity as AppSyncIdentityCognito).claims.sub;
  } else if ('cognitoIdentityId' in identity) {
    // Guest (unauthenticated user via Identity Pool)
    userIdentifier = (identity as AppSyncIdentityIAM).cognitoIdentityId;
  } else {
    console.error('Unknown identity type:', identity);
    throw new Error('Unauthorized');
  }

  console.log('User Identifier:', userIdentifier);

  const args = event?.arguments?.uplCVfieldsarg;
  const originalKey = args?.fileName;
  const jobDesc = args?.jobDesc;
  const jobTitle = args?.jobTitle;

  //const userSub = event.identity?.claims?.sub;
  //const identity = event.identity;
  //console.log('User sub is:', event.identity?.claims?.sub);

  const fallbackReturn = {
      id_un: 'ERROR',
      int_path: 'ERROR',
    };

  try {

    if (!originalKey) {
      throw new Error('Missing original file path');
    }

    const parts = originalKey.split('/');
    const fileName = parts.pop(); // e.g., "cv.pdf"
    const folder = parts.join('/'); // e.g., "tools/tailorcv/userId"
    const key = `${folder}/${Date.now()}-${fileName}`; // Add timestamp
    const idcv = uuidv4();

    const cvItem = await dataClient.models.CVreg.create({
        id: idcv,
        cvPathBucket: key,
        bucketId: 'mainBucket',
        jobDesc: jobDesc ?? 'N/A',
        jobTitle: jobTitle ?? 'N/A',
        owner:userIdentifier
      }, {
        authMode: 'identityPool',
      }
    );

    console.log('[uploadCVflow] Created CVreg item:', cvItem);
    //console.log('[tailoredCVflow] Creating job progress for:', cvid.idcv);
    const jobprogItem = await dataClient.models.JobProgress.create({
        id:idcv,
        jobId: idcv,
        step: 'Starting',
        signedUrl: "",
        status: 'In Progress',
        message: 'Starting job',
        owner:userIdentifier
      }, {
        authMode: 'identityPool',
      }
    );

    console.log('[uploadCVflow] Created CVreg item:', jobprogItem);

    return {
          id_un:idcv,
          int_path:key
        }; // on success

  } catch (err) {
      console.error('Error saving CV metadata:', err);
      return fallbackReturn;
      //return 'ERROR: Failed to save CV metadata';
  }
};
