# splitter_docx.py
import os
import sys
import boto3
import logging
from datetime import datetime, timedelta, timezone
from concurrent.futures import ThreadPoolExecutor, as_completed
from boto3.dynamodb.conditions import Attr
from botocore.exceptions import ClientError

import mammoth

# ------------------------------------------------------------------
# Debug visibility (safe to remove later)
# ------------------------------------------------------------------
print("PYTHONPATH:", sys.path)
print(
    "OPT PYTHON:",
    os.listdir("/opt/python") if os.path.exists("/opt/python") else "NO /opt/python"
)

# ------------------------------------------------------------------
# Logging
# ------------------------------------------------------------------
LOG_LEVEL = os.environ.get("LOG_LEVEL", "INFO")
logger = logging.getLogger()
logger.setLevel(LOG_LEVEL)

# ------------------------------------------------------------------
# AWS clients
# ------------------------------------------------------------------
s3 = boto3.client("s3")
dynamodb = boto3.resource("dynamodb")

TABLE_NAME = os.environ["DDB_TABLE"]
bucket = os.environ.get("BUCKET_NAME")
TTL_HOURS = int(os.environ.get("TTL_HOURS", "6"))

TABLE = dynamodb.Table(TABLE_NAME)

# ------------------------------------------------------------------
# Helpers
# ------------------------------------------------------------------
def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def chunk_text(text: str, max_chars: int = 2000) -> list[str]:
    """
    Approximate DOCX 'pages' by character count.
    Keeps pipeline semantics identical to PDF pages.
    """
    paragraphs = [p.strip() for p in text.split("\n") if p.strip()]
    chunks = []
    current = ""

    for p in paragraphs:
        if len(current) + len(p) > max_chars:
            chunks.append(current)
            current = p
        else:
            current = f"{current}\n{p}" if current else p

    if current:
        chunks.append(current)

    return chunks


def create_page(
    document_id: str,
    page_number: int,
    text: str,
    expires_at: int,
) -> bool:
    """
    Idempotent PAGE creator.
    Returns True if created, False if already exists.
    """
    page_sk = f"PAGE#{page_number:04d}"

    try:
        TABLE.put_item(
            Item={
                "doc_id": document_id,
                "sk": page_sk,
                "page_number": page_number,
                "ready": 1,
                "text": text,
                "processed_at": now_iso(),
                "expires_at": expires_at,
            },
            # Correct for PK+SK table: existence is per full key
            ConditionExpression=Attr("sk").not_exists(),
        )
        return True

    except ClientError as e:
        if e.response["Error"]["Code"] == "ConditionalCheckFailedException":
            return False
        raise


# ------------------------------------------------------------------
# Lambda handler
# ------------------------------------------------------------------
def lambda_handler(event, context):
    logger.info("DOCX splitter invoked", extra={"event_keys": list(event.keys())})

    # 1️⃣ Direct Lambda invoke (from validator)
    key = event.get("key")
    progress_id = event.get("jobId") or event.get("progressid")

    if not bucket or not key:
        raise ValueError("Missing bucket/key")

    if not key.lower().endswith(".docx"):
        raise ValueError("Only DOCX files are supported")

    document_id = progress_id
    base_prefix, _ = os.path.splitext(key)

    logger.info(
        "Processing DOCX",
        extra={"bucket": bucket, "key": key, "document_id": document_id},
    )

    local_docx = f"/tmp/{document_id}.docx"

    # ------------------------------------------------------------------
    # Download DOCX
    # ------------------------------------------------------------------
    s3.download_file(bucket, key, local_docx)

    # ------------------------------------------------------------------
    # Extract text
    # ------------------------------------------------------------------
    with open(local_docx, "rb") as f:
        result = mammoth.extract_raw_text(f)

    if result.messages:
        logger.warning("Mammoth warnings", extra={"messages": result.messages})

    full_text = result.value.strip()
    if not full_text:
        raise ValueError("DOCX contains no extractable text")

    chunks = chunk_text(full_text)
    total_pages = len(chunks)

    now = datetime.now(timezone.utc)
    expires_at = int((now + timedelta(hours=TTL_HOURS)).timestamp())

    meta_key = {"doc_id": document_id, "sk": "META"}

    # ------------------------------------------------------------------
    # META creation (idempotent)
    # ------------------------------------------------------------------
    try:
        TABLE.put_item(
            Item={
                "doc_id": document_id,
                "sk": "META",
                "created_at": now_iso(),
                "status": "PROCESSING",
                "total_pages": total_pages,
                "ready_sum": 0,
                "all_pages_ready": False,
                "s3_prefix": base_prefix,
                "progress_id": progress_id,
                "expires_at": expires_at,
            },
            ConditionExpression=Attr("sk").not_exists(),
        )
        logger.info("META item created")

    except ClientError as e:
        if e.response["Error"]["Code"] == "ConditionalCheckFailedException":
            logger.info("META already exists (idempotent retry)")
            return {
                "document_id": document_id,
                "status": "ALREADY_PROCESSED",
            }
        raise

    # ------------------------------------------------------------------
    # Parallel PAGE creation (safe + observable)
    # ------------------------------------------------------------------
    logger.info("Creating PAGE items in parallel", extra={"total_pages": total_pages})

    created_pages = 0
    errors: list[int] = []

    with ThreadPoolExecutor(max_workers=8) as executor:
        future_map = {
            executor.submit(
                create_page,
                document_id,
                i,
                text,
                expires_at,
            ): i
            for i, text in enumerate(chunks, start=1)
        }

        for future in as_completed(future_map):
            page_number = future_map[future]
            try:
                created = future.result()
                if created:
                    created_pages += 1
            except Exception:
                logger.exception(
                    "PAGE creation failed",
                    extra={
                        "document_id": document_id,
                        "page_number": page_number,
                    },
                )
                errors.append(page_number)

    if errors:
        logger.error(
            "Aborting DOCX processing due to PAGE failures",
            extra={
                "document_id": document_id,
                "failed_pages": errors,
            },
        )
        # Fail fast → Lambda retry → idempotent recovery
        raise RuntimeError(f"Failed to create pages: {errors}")

    logger.info(
        "PAGE creation completed",
        extra={"created_pages": created_pages, "total_pages": total_pages},
    )

    # ------------------------------------------------------------------
    # Final META update (single, safe write)
    # ------------------------------------------------------------------
    try:
        TABLE.update_item(
            Key=meta_key,
            UpdateExpression=(
                "SET ready_sum = :total, "
                "all_pages_ready = :true, "
                "started_aggregating_at = :now"
            ),
            ExpressionAttributeValues={
                ":total": total_pages,
                ":true": True,
                ":now": now_iso(),
            },
            ConditionExpression=Attr("all_pages_ready").eq(False),
        )
        logger.info("Aggregation triggered", extra={"document_id": document_id})

    except ClientError as e:
        if e.response["Error"]["Code"] != "ConditionalCheckFailedException":
            raise
        logger.info("Aggregation already triggered (idempotent)")

    logger.info("DOCX processing completed", extra={"document_id": document_id})

    return {
        "document_id": document_id,
        "pages": total_pages,
        "status": "ALL_PAGES_READY",
    }
