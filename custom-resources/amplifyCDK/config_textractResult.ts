import * as lambda from "aws-cdk-lib/aws-lambda";
import * as ddb from "aws-cdk-lib/aws-dynamodb";
import * as eventSources from "aws-cdk-lib/aws-lambda-event-sources";
import { FilterCriteria, FilterRule } from "aws-cdk-lib/aws-lambda";
//import * as iam from 'aws-cdk-lib/aws-iam'
import { Policy, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import * as cdk from "aws-cdk-lib";
//import { IBucket,CfnBucket  } from 'aws-cdk-lib/aws-s3';
import * as s3 from "aws-cdk-lib/aws-s3";

/**
 * Attaches a DynamoDB Stream event source to a Lambda function
 * Triggered ONLY when:
 *  - eventName = MODIFY
 *  - sk == "META"
 *  - status transitions to "DONE"
 */
export function config_textractResult(params: {
  fn: lambda.Function;
  table: ddb.Table;
  bucketL1: s3.CfnBucket;
  bucketL2: s3.IBucket;
}) {
  const { fn, table, bucketL2, bucketL1 } = params;

  fn.addEventSource(
    new eventSources.DynamoEventSource(table, {
      startingPosition: lambda.StartingPosition.LATEST,
      batchSize: 1,
      retryAttempts: 3,

      filters: [
        FilterCriteria.filter({
          eventName: FilterRule.isEqual("MODIFY"),
          dynamodb: {
            Keys: {
              sk: {
                S: FilterRule.isEqual("META"),
              },
            },
            NewImage: {
              status: {
                S: FilterRule.isEqual("DONE"),
              },
            },
          },
        }),
      ],
    })
  );

  //bucketL2.grantRead(fn);

  // --------------------------------------------------
  // INLINE IAM policy (explicit, minimal, production-safe)
  // --------------------------------------------------
  const role = fn.role!;
  const tablestack= cdk.Stack.of(table) //const dataStack = cdk.Stack.of(tbMDXupdates);
  const fnstack= cdk.Stack.of(fn) //const dataStack = cdk.Stack.of(tbMDXupdates);
  
  role.attachInlinePolicy(
    new Policy(fnstack, "TextractResultDynamoStreamInlinePolicy", {
      statements: [
        // Required to read from THIS table's stream
        new PolicyStatement({
          actions: [
            "dynamodb:DescribeStream",
            "dynamodb:GetRecords",
            "dynamodb:GetShardIterator",
          ],
          resources: [table.tableStreamArn!],
        }),

        // Required by Lambda service to discover streams
        new PolicyStatement({
          actions: ["dynamodb:ListStreams"],
          resources: ["*"],
        }),
      ],
    })
  );

  role.attachInlinePolicy(
    new Policy(fnstack, 'TailorCVBucketReadPolicy', {
      statements: [
        // Read objects ONLY under tools/tailorcv/
        new PolicyStatement({
          actions: [
            's3:GetObject',
            's3:GetObjectVersion',
          ],
          resources: [
            bucketL2.arnForObjects('tools/tailorcv/*'),
          ],
        }),

        // Allow listing ONLY that prefix (needed if you list objects)
        new PolicyStatement({
          actions: ['s3:ListBucket'],
          resources: [bucketL2.bucketArn],
          conditions: {
            StringLike: {
              's3:prefix': ['tools/tailorcv/*'],
            },
          },
        }),
      ],
    })
  );

  //BUCKET_NAME: bucketl1.ref

  fn.addEnvironment('BUCKET_NAME', bucketL1.ref);
}
