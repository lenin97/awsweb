import os
import time
import logging
import boto3
from botocore.exceptions import ClientError

logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Clients
s3 = boto3.client("s3")
textract = boto3.client("textract")

def handler(event, context):
    """
    Amplify Gen 2 Lambda resolver to extract text from a PDF in S3 using
    Textract's asynchronous text-detection APIs.

    Event shape (GraphQL resolver):
    {
      "arguments": {
        "s3FileInputArg": {
          "key": "path/to/mydoc.pdf"
        }
      }
    }

    Expects the following env vars:
      BUCKET_NAME
      SNS_TOPIC_ARN
      TEXTRACT_SNS_ROLE_ARN

    Returns:
      A dict with job metadata or error info.
    """

    input_arg = event.get("arguments", {}).get("s3FileInputArg", {})
    bucket = os.environ.get("BUCKET_NAME")
    key = input_arg.get("key")
    progress_id = input_arg.get("progressid")
    job_id_custom = input_arg.get("jobid")

    if not bucket or not key or not progress_id or not job_id_custom:
        logger.error("Missing bucket or key: %s", input_arg)
        return {
            "status": "ERROR",
            "error_code": "MissingParameter",
            "error_message": "Missing 'bucket' or 'key' in s3FileInputArg"
        }

    logger.info("Starting async Textract job for s3://%s/%s", bucket, key)

    try:
        resp = textract.start_document_text_detection(
            DocumentLocation={"S3Object": {"Bucket": bucket, "Name": key}},
            NotificationChannel={
                "SNSTopicArn": os.environ["SNS_TOPIC_ARN"],
                "RoleArn": os.environ["TEXTRACT_SNS_ROLE_ARN"]
            },
            #ClientRequestToken=f"{bucket}:{key}:{int(time.time())}",
            JobTag=f"{progress_id}"
        )
        job_id = resp["JobId"]
        logger.info("Started Textract job: %s", job_id)
        return {
            "status": "STARTED",
            "jobId": job_id
        }

    except ClientError as e:
        error_code = e.response["Error"].get("Code", "Unknown")
        error_msg = e.response["Error"].get("Message", str(e))
        logger.exception("Failed to start Textract job")
        return {
            "status": "ERROR",
            "error_code": error_code,
            "error_message": error_msg
        }



"""
import os
import time
import logging

import boto3
from botocore.exceptions import ClientError

logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Clients
s3 = boto3.client("s3")
textract = boto3.client("textract")

# How often (sec) to poll for job completion
POLL_INTERVAL = int(os.environ.get("POLL_INTERVAL_SEC", "5"))

def handler(event, context):
"""
"""
    Amplify Gen 2 Lambda resolver to extract text from a PDF in S3 using
    Textract's asynchronous text-detection APIs.

    Event shape (GraphQL resolver):
    {
      "arguments": {
        "s3FileInputArg": {
          "key": "path/to/mydoc.pdf"
        }
      }
    }

    Expects BUCKET_NAME in env vars (injected via CDK/L2):
      BUCKET_NAME = <your-main-bucket>

    Returns:
      A single string with all detected lines joined by newline.
"""
    
"""

    # 1) Parse input
    input_arg = event.get("arguments", {}).get("s3FileInputArg", {})
    bucket = os.environ.get("BUCKET_NAME")
    key = input_arg.get("key")

    if not bucket or not key:
        logger.error("Missing bucket or key: %s", input_arg)
        raise ValueError("Missing 'bucket' or 'key' in s3FileInputArg")

    logger.info("Starting async Textract job for s3://%s/%s", bucket, key)

    # 2) Start async text detection job
    try:
        resp = textract.start_document_text_detection(
            DocumentLocation={"S3Object": {"Bucket": bucket, "Name": key}}
        )
        job_id = resp["JobId"]
        logger.info("Started Textract job: %s", job_id)
    except ClientError as e:
        logger.exception("Failed to start Textract job")
        raise

        
    # 3) Poll until job completes
    while True:
        time.sleep(POLL_INTERVAL)
        status_resp = textract.get_document_text_detection(JobId=job_id)
        status = status_resp["JobStatus"]
        logger.info("Textract job %s status: %s", job_id, status)
        if status in ("SUCCEEDED", "FAILED"):
            break

    if status != "SUCCEEDED":
        logger.error("Textract job %s failed: %s", job_id, status_resp)
        raise RuntimeError(f"Textract job {job_id} failed")

    # 4) Paginate through all result pages, collecting LINE blocks
    next_token = None
    all_lines = []

    while True:
        kwargs = {"JobId": job_id}
        if next_token:
            kwargs["NextToken"] = next_token

        page = textract.get_document_text_detection(**kwargs)
        for block in page.get("Blocks", []):
            if block.get("BlockType") == "LINE" and "Text" in block:
                all_lines.append(block["Text"])

        next_token = page.get("NextToken")
        if not next_token:
            break

    logger.info("Extracted %d lines of text", len(all_lines))

    # 5) Return as single string
    return "\n".join(all_lines).strip()
"""



"""
#Start the Textract job with NotificationChannel
#In your Lambda (or resolver) that kicks off the job, include
resp = textract.start_document_text_detection(
    DocumentLocation={ "S3Object": { "Bucket": bucket, "Name": key } },
    NotificationChannel={
      "SNSTopicArn": "<arn:aws:sns:…:TextractJobCompletion>",
      "RoleArn":     "<arn:aws:iam::…:role/TextractSNSPublishRole>"
    }
)
job_id = resp["JobId"]
"""


"""
    with tempfile.NamedTemporaryFile(delete=False) as tmp_file:
        try:
            s3.download_fileobj(Bucket=bucket, Key=key, Fileobj=tmp_file)
            tmp_file.flush()
            tmp_path = tmp_file.name
            print(f"[textract-resolver] ✅ File downloaded to temp path: {tmp_path}")
        except Exception as e:
            print("[textract-resolver] ❌ Error downloading file from S3:", str(e))
            raise Exception(f"Failed to download file from S3: {str(e)}")

    try:
        print("[textract-resolver] 🧠 Starting textract.process")
        extracted_text = textract.process(tmp_path).decode("utf-8")
        print("[textract-resolver] ✅ Text extraction completed successfully")
    except Exception as e:
        print("[textract-resolver] ❌ Textract processing failed:", str(e))
        raise Exception(f"Text extraction failed: {str(e)}")
    finally:
        os.remove(tmp_path)
        print(f"[textract-resolver] 🧹 Temp file deleted: {tmp_path}")
"""
  

    
"""import { Function, Runtime } from 'aws-cdk-lib/aws-lambda';
import { defineFunction } from '@aws-amplify/backend';

export const sayHelloFunctionHandler = defineFunction((scope) =>
  new Function(scope, 'say-hello', {
    handler: 'index.handler',
    runtime: Runtime.PYTHON_3_9,
    timeout: Duration.seconds(20),
    code: Code.fromAsset('path/to/your/code'),
  })
);

"""   
