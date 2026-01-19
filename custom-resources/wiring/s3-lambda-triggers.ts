import { aws_s3 as s3, aws_lambda as lambda } from "aws-cdk-lib";
import { EventType } from "aws-cdk-lib/aws-s3";
import { LambdaDestination } from "aws-cdk-lib/aws-s3-notifications";

interface AddS3TriggerParams {
  bucketL2: s3.IBucket;
  fn: lambda.Function;
  prefix: string;
  suffix: string;
}

/**
 * Attach filtered S3 object-created notifications to a Lambda function
 */
export function addFilteredS3Trigger({
  bucketL2,
  fn,
  prefix,
  suffix,
}: AddS3TriggerParams) {
  // ---------------------------------------------------------
  // PUT uploads
  // ---------------------------------------------------------
  bucketL2.addEventNotification(
    EventType.OBJECT_CREATED_PUT,
    new LambdaDestination(fn),
    {
      prefix,
      suffix,
    }
  );

  // ---------------------------------------------------------
  // Multipart uploads (large files)
  // ---------------------------------------------------------
  bucketL2.addEventNotification(
    EventType.OBJECT_CREATED_COMPLETE_MULTIPART_UPLOAD,
    new LambdaDestination(fn),
    {
      prefix,
      suffix,
    }
  );
}
