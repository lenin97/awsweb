# worker.py
import os
import json
import time
import base64
import logging
from datetime import datetime, timezone
from typing import Dict, Any

import boto3
from botocore.exceptions import ClientError
from boto3.dynamodb.conditions import Attr

# ------------------------------------------------------------------------------
# Configuration
# ------------------------------------------------------------------------------
LOG_LEVEL = os.environ.get("LOG_LEVEL", "INFO")
logging.basicConfig()
logger = logging.getLogger("worker")
logger.setLevel(LOG_LEVEL)

DDB_TABLE = os.environ["DDB_TABLE"]

# 🔒 Hard-pinned Bedrock model (2025 best practice)
BEDROCK_MODEL_ID = "amazon.nova-pro-v1:0"

MAX_TOKENS = int(os.environ.get("MAX_TOKENS", "1500"))
MAX_WORDS = int(os.environ.get("MAX_WORDS", "1000"))

# Bedrock retry tuning
BEDROCK_RETRIES = 3
BEDROCK_BACKOFF = 1.0  # seconds (exponential)

# Safety thresholds
MIN_IMAGE_BYTES = 2048  # skip Bedrock for tiny images

# ------------------------------------------------------------------------------
# AWS clients
# ------------------------------------------------------------------------------
s3 = boto3.client("s3")
dynamodb = boto3.resource("dynamodb")
TABLE = dynamodb.Table(DDB_TABLE)
bedrock = boto3.client("bedrock-runtime")
bucket = os.environ.get("BUCKET_NAME")

# ------------------------------------------------------------------------------
# Helpers
# ------------------------------------------------------------------------------
def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def call_bedrock_extract(image_bytes: bytes) -> str:
    """
    Calls Amazon Nova Pro using the Converse API to extract text from an image.
    Retries transient failures with exponential backoff.
    Aligned with official AWS documentation.
    """

    messages = [
        {
            "role": "user",
            "content": [
                {
                    "text": (
                        "Extract the text from this image exactly as written. "
                        "Preserve line breaks and section spacing. "
                        "Return each visual line as a separate line of plain text."
                    )
                },
                {
                    "image": {
                        "format": "png",
                        "source": {
                            "bytes": image_bytes
                        }
                    }
                },
            ],
        }
    ]

    last_exc = None

    for attempt in range(1, BEDROCK_RETRIES + 1):
        try:
            response = bedrock.converse(
                modelId=BEDROCK_MODEL_ID,
                messages=messages,
                inferenceConfig={
                    "maxTokens": MAX_TOKENS,
                    "temperature": 0,
                },
            )

            # Official Nova response parsing
            texts = []

            for block in response["output"]["message"]["content"]:
                if "text" in block and block["text"].strip():
                    texts.append(block["text"].strip())

            return "\n".join(texts)

        except Exception as e:
            last_exc = e
            wait = BEDROCK_BACKOFF * (2 ** (attempt - 1))
            logger.warning(
                "bedrock_retry model=%s attempt=%s wait=%.1fs error=%s",
                BEDROCK_MODEL_ID,
                attempt,
                wait,
                str(e),
            )
            time.sleep(wait)

    logger.error(
        "bedrock_failed_permanently model=%s error=%s",
        BEDROCK_MODEL_ID,
        str(last_exc),
    )
    raise RuntimeError(f"Bedrock OCR failed: {last_exc}")


# ------------------------------------------------------------------------------
# Core processing
# ------------------------------------------------------------------------------
def process_page_message(record: Dict[str, Any]) -> None:
    """
    Idempotent page processor.
    Safe under retries, concurrency, and partial failures.
    """
    doc_id = record["doc_id"]
    page_number = int(record["page_number"])
    s3_key = record["s3_key"]

    page_sk = f"PAGE#{page_number:04d}"
    meta_key = {"doc_id": doc_id, "sk": "META"}

    logger.info(
        "process_page",
        extra={"doc_id": doc_id, "page": page_number, "s3_key": s3_key},
    )

    # ------------------------------------------------------------------
    # Fast idempotency check
    # ------------------------------------------------------------------
    page = TABLE.get_item(
        Key={"doc_id": doc_id, "sk": page_sk},
        ProjectionExpression="ready",
    ).get("Item")

    if page and page.get("ready") == 1:
        logger.info("page_already_processed doc=%s page=%s", doc_id, page_number)
        return

    # ------------------------------------------------------------------
    # Validate S3 object exists
    # ------------------------------------------------------------------
    s3.head_object(Bucket=bucket, Key=s3_key)

    # ------------------------------------------------------------------
    # Download page image
    # ------------------------------------------------------------------
    local_path = f"/tmp/{doc_id}_p{page_number}.png"
    s3.download_file(bucket, s3_key, local_path)

    try:
        with open(local_path, "rb") as f:
            image_bytes = f.read()

        # ------------------------------------------------------------------
        # Skip OCR for tiny / invalid images
        # ------------------------------------------------------------------
        if len(image_bytes) < MIN_IMAGE_BYTES:
            logger.warning("image_too_small skipping_ocr bytes=%s", len(image_bytes))
            extracted_text = ""
        else:
            try:
                extracted_text = call_bedrock_extract(image_bytes)
            except Exception as e:
                logger.error(
                    "ocr_failed aborting_page doc=%s page=%s error=%s",
                    doc_id,
                    page_number,
                    str(e),
                )
                raise  # ⬅️ critical: stop processing & trigger retry

        # Enforce word cap
        if len(extracted_text.split()) > MAX_WORDS:
            logger.warning("word_cap_exceeded dropping_text")
            extracted_text = ""

        # ------------------------------------------------------------------
        # Idempotent page update
        # ------------------------------------------------------------------
        TABLE.update_item(
            Key={"doc_id": doc_id, "sk": page_sk},
            UpdateExpression="SET #t = :txt, #r = :one, processed_at = :now",
            ExpressionAttributeNames={"#t": "text", "#r": "ready"},
            ExpressionAttributeValues={
                ":txt": extracted_text,
                ":one": 1,
                ":now": now_iso(),
            },
            ConditionExpression=Attr("ready").eq(0),
        )

        logger.info(
            "page_marked_ready doc=%s page=%s",
            doc_id,
            page_number,
        )

        # ------------------------------------------------------------------
        # Increment META.ready_sum
        # ------------------------------------------------------------------
        resp = TABLE.update_item(
            Key=meta_key,
            UpdateExpression="SET ready_sum = if_not_exists(ready_sum, :zero) + :inc",
            ExpressionAttributeValues={":inc": 1, ":zero": 0},
            ConditionExpression=Attr("all_pages_ready").ne(True),
            ReturnValues="UPDATED_NEW",
        )

        new_ready = int(resp["Attributes"]["ready_sum"])

        # ------------------------------------------------------------------
        # Trigger aggregation exactly once
        # ------------------------------------------------------------------
        meta = TABLE.get_item(Key=meta_key).get("Item")
        total_pages = int(meta["total_pages"])

        if new_ready >= total_pages:
            try:
                TABLE.update_item(
                    Key=meta_key,
                    UpdateExpression=(
                        "SET all_pages_ready = :true, "
                        "started_aggregating_at = :now"
                    ),
                    ExpressionAttributeValues={
                        ":true": True,
                        ":now": now_iso(),
                    },
                    ConditionExpression=(
                        Attr("ready_sum").eq(total_pages)
                        & Attr("all_pages_ready").eq(False)
                    ),
                )
                logger.info("aggregation_triggered doc=%s", doc_id)

            except ClientError as e:
                if e.response["Error"]["Code"] != "ConditionalCheckFailedException":
                    raise

    finally:
        try:
            os.remove(local_path)
        except OSError:
            pass


# ------------------------------------------------------------------------------
# Lambda handler
# ------------------------------------------------------------------------------
def lambda_handler(event, context):
    records = event.get("Records", [])
    logger.info("records_received count=%s", len(records))

    for r in records:
        body = json.loads(r["body"])
        process_page_message(body)

    logger.info("batch_completed processed=%s", len(records))

    return {"status": "OK", "processed": len(records)}
