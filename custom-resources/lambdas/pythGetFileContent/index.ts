// amplify/backend/custom/textract-stack.ts
//import { StackContext } from "@aws-amplify/backend";
import { Duration, aws_lambda as lambda } from "aws-cdk-lib";
import { Code, DockerImage } from "aws-cdk-lib";
import * as path from "path";
import { execSync } from "child_process";
import * as fs from "fs";
import { Construct } from 'constructs';
import { IBucket,CfnBucket  } from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import { fileURLToPath } from "node:url";

const fnDir = path.dirname(fileURLToPath(import.meta.url));

export function TextractStack(scope: Construct, id: string, bucketl1: CfnBucket, bucketl2: IBucket) {
  //const fnDir = path.resolve(__dirname, "pythGetFileContent");  
  //const fnDir = path.resolve(import.meta.dirname, "pythGetFileContent");
  //const outDir = "/asset-output";  // CDK uses this as the staging area

  // CDK Function with exactly the same bundling logic you had
  const textractResolver = new lambda.Function(scope, id, {
    runtime: lambda.Runtime.PYTHON_3_11,
    handler: "pythGetFileContent.handler",
    timeout: Duration.seconds(30),
    environment: {
      BUCKET_NAME: bucketl1.ref,// ✅ This injects the *real* physical bucket name
    },
    code: lambda.Code.fromAsset(fnDir, {
      bundling: {
        image: DockerImage.fromRegistry("public.ecr.aws/sam/build-python3.11"),
        local: {
          tryBundle(outputDir: string) {
            // 1️⃣ install deps into bundle
            execSync(
              `python -m pip install -r "${path.join(fnDir, "requirements.txt")}" -t "${outputDir}"`,
              { stdio: "inherit" }
            );
            // 2️⃣ copy your source files
            fs.cpSync(fnDir, outputDir, { recursive: true });
            //execSync(`cp -r ${fnDir}/* ${path.join(outputDir)}`);
            return true;
          },
        },
      },
    }),
    // (re-enable if you need the bucket env var here)
    // environment: {
    //   BUCKET_NAME: firstBucketName,
    // },
    memorySize: 256,
  });

  bucketl2.grantReadWrite(textractResolver);

  // assuming `textractResolver` is your L2 Function construct:
  textractResolver.addToRolePolicy(new iam.PolicyStatement({
    actions: [
      //'textract:DetectDocumentText',
      'textract:StartDocumentTextDetection'
    ],
    resources: ['*'],      // Textract's DetectDocumentText call doesn't let you scope by ARN
  }));

  return { textractResolver };
}

/*
L1 CfnBucket: No permission methods

L2 Bucket / IBucket: Has grantReadWrite() and others

Bucket.fromBucketName(): Recommended way to wrap existing S3 buckets into IBucket
*/

/*
// amplify/custom-resources/textract-lambda.ts
import { PythonFunction } from '@aws-cdk/aws-lambda-python-alpha';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { DockerImage, Duration } from 'aws-cdk-lib';
import * as path from 'node:path';
import { Construct } from 'constructs';
import { IBucket } from 'aws-cdk-lib/aws-s3';

export function createTextractLambda(scope: Construct, bucket: IBucket) {
  const fnDir = path.resolve(__dirname, 'pythGetFileContent');

  const lambda = new PythonFunction(scope, 'TextractResolver', {
    entry: fnDir,
    runtime: Runtime.PYTHON_3_11,
    index: 'pythGetFileContent.py',
    handler: 'handler',
    timeout: Duration.seconds(30),
    environment: {
      BUCKET_NAME: bucket.bucketName,
    },
    bundling: {
      image: DockerImage.fromRegistry('public.ecr.aws/sam/build-python3.11'),
    },
  });

  bucket.grantReadWrite(lambda);

  return lambda;
}
*/
