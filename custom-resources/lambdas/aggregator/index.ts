import { Duration, aws_lambda as lambda } from 'aws-cdk-lib'
import { Code, DockerImage } from 'aws-cdk-lib'
import * as path from 'path'
import * as fs from 'fs'
import { execSync } from 'child_process'
import { Construct } from 'constructs'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'
import * as s3 from 'aws-cdk-lib/aws-s3'
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources'
import { fileURLToPath } from 'node:url'
import { IBucket,CfnBucket  } from 'aws-cdk-lib/aws-s3';
import { FilterCriteria, FilterRule } from 'aws-cdk-lib/aws-lambda'

const fnDir = path.dirname(fileURLToPath(import.meta.url))

export function AggregatorStack(
  scope: Construct,
  id: string,
  table: dynamodb.ITable,
  bucketl1: CfnBucket,
  bucketl2: IBucket
) {
  const aggregatorFn = new lambda.Function(scope, id, {
    runtime: lambda.Runtime.PYTHON_3_11,
    handler: 'aggregator.lambda_handler',
    timeout: Duration.seconds(60),
    memorySize: 512,
    environment: {
      DDB_TABLE: table.tableName,
      BUCKET_NAME: bucketl1.ref,
    },
    code: lambda.Code.fromAsset(fnDir, {
      bundling: {
        image: DockerImage.fromRegistry('public.ecr.aws/sam/build-python3.11'),
        local: {
          tryBundle(outputDir: string) {
            // No dependencies required, but keep this future-proof
            const reqFile = path.join(fnDir, 'requirements.txt')
            if (fs.existsSync(reqFile)) {
              execSync(
                `python -m pip install -r "${reqFile}" -t "${outputDir}"`,
                { stdio: 'inherit' }
              )
            }

            // Copy source
            fs.cpSync(fnDir, outputDir, { recursive: true })
            return true
          },
        },
      },
    }),
  })

  /* ---------------- Permissions ---------------- */

  table.grantReadWriteData(aggregatorFn)
  bucketl2.grantPut(aggregatorFn)

  // Required for DynamoDB Streams
  aggregatorFn.addToRolePolicy(
    new iam.PolicyStatement({
      actions: [
        'dynamodb:DescribeStream',
        'dynamodb:GetRecords',
        'dynamodb:GetShardIterator',
      ],
      resources: [table.tableStreamArn!],
    })
  )

  aggregatorFn.addToRolePolicy(
    new iam.PolicyStatement({
      actions: ['dynamodb:ListStreams'],
      resources: ['*'],
    })
  )

  /* ---------------- DynamoDB Stream Trigger ---------------- */

  aggregatorFn.addEventSource(
    new lambdaEventSources.DynamoEventSource(table, {
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
              all_pages_ready: {
                BOOL: FilterRule.isEqual(true),
              },
            },
            OldImage: {
              all_pages_ready: {
                BOOL: FilterRule.isEqual(false),
              },
            },
          },
        }),
      ],
    })
  )

  return { aggregatorFn }
}
