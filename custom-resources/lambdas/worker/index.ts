import { Duration, aws_lambda as lambda } from "aws-cdk-lib";
import { DockerImage } from "aws-cdk-lib";
import * as path from "path";
import * as fs from "fs";
import { Construct } from "constructs";
import * as iam from "aws-cdk-lib/aws-iam";
import { IBucket,CfnBucket  } from 'aws-cdk-lib/aws-s3';
//import { IQueue } from "aws-cdk-lib/aws-sqs";
import { fileURLToPath } from "node:url";
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'

const fnDir = path.dirname(fileURLToPath(import.meta.url));

export function WorkerStack(
  scope: Construct,
  id: string,
  bucketl1: CfnBucket,
  bucketl2: IBucket,
  //pageQueue: IQueue,
  table: dynamodb.ITable,
) {
  const workerFn = new lambda.Function(scope, id, {
    runtime: lambda.Runtime.PYTHON_3_11,
    handler: "worker.lambda_handler",

    timeout: Duration.minutes(5),
    memorySize: 2048,
    //reservedConcurrentExecutions: 4, // ✅ CORRECT
    environment: {
      DDB_TABLE: table.tableName,
      BUCKET_NAME: bucketl1.ref,

      // Bedrock tuning (can be overridden later)
      BEDROCK_MODEL_ID: "anthropic.claude-3-7-sonnet",
      MAX_TOKENS: "1500",
      MAX_WORDS: "1000",
      LOG_LEVEL: "INFO",
    },

    code: lambda.Code.fromAsset(fnDir, {
      bundling: {
        image: DockerImage.fromRegistry(
          "public.ecr.aws/sam/build-python3.11"
        ),
        local: {
          tryBundle(outputDir: string) {
            // Only copy Python source
            fs.cpSync(fnDir, outputDir, { recursive: true });
            return true;
          },
        },
      },
    }),
  });

  // ✅ HARD CONCURRENCY CAP (function-level)
  //workerFn.addPropertyOverride("ReservedConcurrentExecutions", 4);
/*
  const liveAlias = workerFn.addAlias("live", {
    provisionedConcurrentExecutions: 2,
  });
*/
  // --- SQS trigger (BatchSize = 1, as required by your logic) ---
  /*
  workerFn.addEventSourceMapping("WorkerSqsMapping", {
    eventSourceArn: pageQueue.queueArn,
    batchSize: 1,
    enabled: true,
  });
  */

  // --- Permissions ---

  // Read page images
  bucketl2.grantRead(workerFn);

  // DynamoDB page + META updates
  workerFn.addToRolePolicy(
    new iam.PolicyStatement({
      actions: [
        "dynamodb:GetItem",
        "dynamodb:UpdateItem",
      ],
      resources: [table.tableArn!], // tighten to table ARN if available
    })
  );

  // Bedrock invoke (model-agnostic, as required)
  workerFn.addToRolePolicy(
    new iam.PolicyStatement({
      actions: ["bedrock:InvokeModel"],
      resources: [`arn:aws:bedrock:xx-xxxx-x::foundation-model/${process.env.MODEL_AI_ARN}`],
    })
  );

  // Allow Lambda to poll SQS
  //pageQueue.grantConsumeMessages(workerFn);

  return { workerFn };
}
