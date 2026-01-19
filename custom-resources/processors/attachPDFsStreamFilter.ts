import { DynamoEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import { StartingPosition } from "aws-cdk-lib/aws-lambda";
import { Table } from "aws-cdk-lib/aws-dynamodb";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";

export function attachPDFsStreamFilter(
  lambdaFn: NodejsFunction,
  table: Table
) {
  lambdaFn.addEventSource(
    new DynamoEventSource(table, {
      startingPosition: StartingPosition.LATEST,
      batchSize: 1,

      filters: [
        {
          eventName: ["MODIFY"],
          dynamodb: {
            NewImage: {
              sk: { S: ["META"] },
              all_pages_ready: { BOOL: [true] },
            },
            OldImage: {
              all_pages_ready: { BOOL: [false] },
            },
          },
        },
      ],
    })
  );
}
