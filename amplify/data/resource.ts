import {
    type ClientSchema,
    defineData,
  } from "@aws-amplify/backend";
import {schema} from "./schema"
import { Code, Function, Runtime } from "aws-cdk-lib/aws-lambda";
import { DockerImage,Duration } from "aws-cdk-lib";
import { execSync } from "node:child_process";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import * as fs from "node:fs";
import {processTextAI,textractResult} from "../ampfuncs/resource"
import {uploadCVresolvflow,tailoredCVflow, saveTailoredCV } from "../tasksResolvers/resource"
//import {textractLambda} from "../backend"
//import {firstBucket} from "../storage/resource"
//import { firstBucket } from '../storage/resource';

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({ 
  schema,
  authorizationModes:{
    defaultAuthorizationMode: "identityPool",
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    }
  }
});

/*
import{
  extractCVContent,
  tailorCV,
  saveTailoredCV,
  generateResponse,
  validateInputs,
  tailoredCVflow,
  myPythonFunction,
  uploadCVresolvflow
} from './resource'
*/
//If you're managing both types of models in the same schema file, it’s totally fine — just assign appropriate .authorization() 
//rules per model. Let me know if you want to enforce stricter access using group-based access or custom IAM roles for 
// internal-only models.
//allow.publicApiKey() – for public, unauthenticated read-only use only (e.g., landing pages)
//allow.guest() – for unauthenticated Cognito identities (not your use case)

///#############################################################

/** Absolute dir that holds app.py & requirements.txt */
//const fnDir = path.dirname(fileURLToPath(import.meta.url));
/**  absolute path to amplify/data/textract  */
/*
const fnDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)), //  <-- amplify/data
  "tasksResolvers"                                    //  <-- amplify/data/tasksResolvers
);
*/
/**
 * Python Lambda packaged with its dependencies.
 * Attach `textractResolver` in amplify/data/resource.ts via a.handler.function().
 */
//const { cfnBucket } = firstBucket.resources.cfnResources;
//const myBucket = a.use('firstBucket');
/*
export const myPythonFunction = defineFunction(//################### 3rd point
  (scope) =>
    new Function(scope, "textract-resolver", {
      runtime: Runtime.PYTHON_3_11,
      handler: "pythGetFileContent.handler",           // app.py → def handler(event, context)
      timeout: Duration.seconds(30),    // increase if Textract calls are slow
      code: Code.fromAsset(fnDir, {
        bundling: {
          // Any public ECR image that has pip & Python 3.11; change as needed
          image: DockerImage.fromRegistry(
            "public.ecr.aws/sam/build-python3.11"
          ),
          local: {
            tryBundle(outDir: string) {
               // 1️⃣ install Python deps into the bundle 
              execSync(
                `python -m pip install -r "${path.join(
                  fnDir,
                  "requirements.txt"
                )}" -t "${outDir}"`,
                { stdio: "inherit" }
              );

              // 2️⃣ copy your source files (cross-platform) 
              fs.cpSync(fnDir, outDir, { recursive: true });

              return true;              // tell CDK bundling succeeded
            },
          },
        },
      })
      environment: {
       // BUCKET_NAME: firstBucket.resources.bucket.bucketName,
      }
    }),
  {
    //resourceGroupName: "data",          // keeps it with your GraphQL API
  }
);
*/
/*
  export const processTextAI = defineFunction({///################### 1st point
    name: "processTextAI",
    entry: './tasksResolvers/processTextAI.ts',
    environment: {
      //PUBLIC_BUCKET_NAME: 'amplify-yourappid-env-publicbucket'
    },
   // permissions: [firstBucket],
  })

  export const textractResult = defineFunction({///################### 1st point
    name: "textractResult",
    entry: './tasksResolvers/textractResult.ts',
    environment: {
      //PUBLIC_BUCKET_NAME: 'amplify-yourappid-env-publicbucket'
    },
   // permissions: [firstBucket],
  })
*/
 
///#################################################################



////#########################
