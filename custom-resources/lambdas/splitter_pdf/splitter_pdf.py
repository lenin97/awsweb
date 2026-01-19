# splitter.py
import os
import sys
print("PYTHONPATH:", sys.path)
print(
    "OPT PYTHON:",
    os.listdir("/opt/python") if os.path.exists("/opt/python") else "NO /opt/python"
)
import json
import hashlib
import boto3
import logging
try:
    from pdf2image import convert_from_path
    print("pdf2image import OK")
except Exception as e:
    print("pdf2image import FAILED:", repr(e))
    raise
from datetime import datetime, timedelta, timezone
from boto3.dynamodb.conditions import Attr
from botocore.exceptions import ClientError

# ------------------------------------------------------------------
# Logging (minimal, structured)
# ------------------------------------------------------------------
LOG_LEVEL = os.environ.get("LOG_LEVEL", "INFO")
logger = logging.getLogger()
logger.setLevel(LOG_LEVEL)

# ------------------------------------------------------------------
# AWS clients
# ------------------------------------------------------------------
s3 = boto3.client("s3")
sqs = boto3.client("sqs")
dynamodb = boto3.resource("dynamodb")

TABLE_NAME = os.environ["DDB_TABLE"]
QUEUE_URL = os.environ.get("SPLITTERPDF2WORKERPIPELINE_QUEUE_URL")

if not QUEUE_URL:
    raise RuntimeError("Queue URL not configured")

POPPLER_PATH = os.environ.get("POPPLER_PATH", "/opt/bin")
TTL_HOURS = int(os.environ.get("TTL_HOURS", "6"))
bucket = os.environ.get("BUCKET_NAME")

TABLE = dynamodb.Table(TABLE_NAME)


def deterministic_document_id(bucket: str, key: str) -> str:
    """
    Deterministic ID → makes the whole pipeline idempotent.
    Same PDF = same document_id forever.
    """
    h = hashlib.sha256(f"{bucket}:{key}".encode("utf-8")).hexdigest()
    return h


def lambda_handler(event, context):
    logger.info("Splitter invoked", extra={"event_keys": list(event.keys())})

    # 1️⃣ Direct Lambda invoke (from validator)
    key = event.get("key")
    progress_id = event.get("jobId") or event.get("progressid")
    #job_id_custom = input_arg.get("jobid")

    if not bucket or not key:
        logger.error("Missing bucket or key", extra={"bucket": bucket, "key": key})
        raise ValueError("Missing bucket/key")

    logger.info("Processing PDF", extra={"bucket": bucket, "key": key})

    base_prefix, _ = os.path.splitext(key)
    document_id = progress_id  #deterministic_document_id(bucket, key)

    logger.info("Document resolved", extra={"document_id": document_id})

    local_pdf = f"/tmp/{document_id}.pdf"

    # ------------------------------------------------------------------
    # Download PDF
    # ------------------------------------------------------------------
    s3.download_file(bucket, key, local_pdf)
    logger.info("PDF downloaded to /tmp")

    pages = convert_from_path(
        local_pdf,
        dpi=300,
        poppler_path=POPPLER_PATH
    )

    total_pages = len(pages)
    logger.info("PDF split into pages", extra={"total_pages": total_pages})

    now = datetime.now(timezone.utc)
    expires_at = int((now + timedelta(hours=TTL_HOURS)).timestamp())

    # ------------------------------------------------------------------
    # META item creation (idempotent)
    # ------------------------------------------------------------------
    try:
        TABLE.put_item(
            Item={
                "doc_id": document_id,
                "sk": "META",
                "created_at": now.isoformat(),
                "status": "PROCESSING",
                "total_pages": total_pages,
                "ready_sum": 0,
                "all_pages_ready": False,
                "s3_prefix": base_prefix,
                "progress_id":progress_id,
                "expires_at": expires_at
            },
            ConditionExpression=Attr("doc_id").not_exists() & Attr("sk").not_exists()
        )
        meta_created = True
        logger.info("META item created")
    except ClientError as e:
        if e.response["Error"]["Code"] == "ConditionalCheckFailedException":
            meta_created = False
            logger.info("META already exists (idempotent retry)")
        else:
            logger.exception("Failed to create META item")
            raise

    if not meta_created:
        return {
            "document_id": document_id,
            "status": "ALREADY_SPLIT"
        }

    # ------------------------------------------------------------------
    # Pre-create PAGE items
    # ------------------------------------------------------------------
    logger.info("Pre-creating PAGE items")

    for page_index in range(1, total_pages + 1):
        try:
            TABLE.put_item(
                Item={
                    "doc_id": document_id,
                    "sk": f"PAGE#{page_index:04d}",
                    "page_number": page_index,
                    "ready": 0,
                    "text": "",
                    "expires_at": expires_at
                },
                ConditionExpression=Attr("doc_id").not_exists() & Attr("sk").not_exists()
            )
        except ClientError as e:
            if e.response["Error"]["Code"] != "ConditionalCheckFailedException":
                logger.exception(
                    "Failed creating PAGE item",
                    extra={"page_number": page_index}
                )
                raise

    logger.info("PAGE items created")

    # ------------------------------------------------------------------
    # Upload images + enqueue SQS
    # ------------------------------------------------------------------
    logger.info("Uploading page images and enqueuing messages")

    for index, page in enumerate(pages, start=1):
        page_path = f"/tmp/{document_id}-page-{index}.png"
        page.save(page_path, "PNG")

        s3_key = f"{base_prefix}/page-{index:04d}.png"

        s3.upload_file(
            Filename=page_path,
            Bucket=bucket,
            Key=s3_key
        )

        body = {
            "doc_id": document_id,
            "page_number": index,
            "s3_key": s3_key
        }

        sqs.send_message(
            QueueUrl=QUEUE_URL,
            MessageBody=json.dumps(body)
        )

        # Low-noise progress log
        if index == 1 or index == total_pages or index % 10 == 0:
            logger.info(
                "Page enqueued",
                extra={"page_number": index, "total_pages": total_pages}
            )

    logger.info("Split completed successfully", extra={"document_id": document_id})

    return {
        "document_id": document_id,
        "pages": total_pages,
        "status": "SPLIT_STARTED"
    }
