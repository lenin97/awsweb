import { Duration, aws_lambda as lambda } from "aws-cdk-lib";
import { DockerImage } from "aws-cdk-lib";
import * as path from "path";
import * as fs from "fs";
import { Construct } from "constructs";
import * as iam from "aws-cdk-lib/aws-iam";
//import { IBucket } from "aws-cdk-lib/aws-s3";
import { fileURLToPath } from "node:url";
import { IBucket,CfnBucket  } from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'

const fnDir = path.dirname(fileURLToPath(import.meta.url));

export function Splitter_DOCX_Stack(
  scope: Construct,
  id: string,
  bucketl1: CfnBucket,
  bucketl2: IBucket,
  //outputBucket: IBucket,
  //pageQueueUrl: string,
  table: dynamodb.ITable,
  docxLayerArn: string
) {
  const splitter_docx_Fn = new lambda.Function(scope, id, {
    functionName: 'tailorcv-docx-splitter-lambda',
    runtime: lambda.Runtime.PYTHON_3_11,
    handler: "splitter_docx.lambda_handler",
    timeout: Duration.minutes(5),
    memorySize: 2048,

    environment: {
      DDB_TABLE: table.tableName,
      BUCKET_NAME: bucketl1.ref,
      //PAGE_QUEUE_URL: pageQueueUrl,
      POPPLER_PATH: "/opt/bin",
      //LD_LIBRARY_PATH: "/opt/lib",
      TTL_HOURS: "6",
    },

    layers: [
      lambda.LayerVersion.fromLayerVersionArn(
        scope,
        "word-processing-layer",
        docxLayerArn
      ),
    ],

    code: lambda.Code.fromAsset(fnDir, {
      bundling: {
        image: DockerImage.fromRegistry(
          "public.ecr.aws/sam/build-python3.11"
        ),
        local: {
          tryBundle(outputDir: string) {
            // Only copy Python source — NO pip install
            fs.cpSync(fnDir, outputDir, { recursive: true });
            return true;
          },
        },
      },
    }),
  });

  // --- Permissions ---

  //inputBucket.grantRead(splitterFn);
  bucketl2.grantReadWrite(splitter_docx_Fn);

  splitter_docx_Fn.addToRolePolicy(
    new iam.PolicyStatement({
      actions: [
        "dynamodb:PutItem",
        'dynamodb:UpdateItem',
        "dynamodb:BatchWriteItem",
      ],
      resources: [table.tableArn!], // tighten if you have the table ARN
    })
  );
/*
  splitterFn.addToRolePolicy(
    new iam.PolicyStatement({
      actions: ["sqs:SendMessage"],
      resources: ["*"], // tighten if you have the queue ARN
    })
  );
*/

  return { splitter_docx_Fn };
}
