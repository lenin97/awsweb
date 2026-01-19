# aggregator.py
import os
import boto3
import logging
from boto3.dynamodb.conditions import Key, Attr
from botocore.exceptions import ClientError
from datetime import datetime, timezone

# ------------------------------------------------------------------
# Logging
# ------------------------------------------------------------------
LOG_LEVEL = os.environ.get("LOG_LEVEL", "INFO")
logger = logging.getLogger("aggregator")
logger.setLevel(LOG_LEVEL)

COLD_START = True  # 👈 cold start detector

# ------------------------------------------------------------------
# AWS clients
# ------------------------------------------------------------------
dynamodb = boto3.resource("dynamodb")
s3 = boto3.client("s3")

TABLE_NAME = os.environ["DDB_TABLE"]
OUTPUT_BUCKET = os.environ["BUCKET_NAME"]

TABLE = dynamodb.Table(TABLE_NAME)


def now_iso():
    return datetime.now(timezone.utc).isoformat()


def lambda_handler(event, context):
    """
    Triggered by DynamoDB Streams when META.all_pages_ready flips to True.
    Concurrency-safe and idempotent.
    """
    global COLD_START

    if COLD_START:
        logger.info("cold_start_detected")
        COLD_START = False

    doc_ids = set()

    # ------------------------------------------------------------------
    # DynamoDB Stream invocation
    # ------------------------------------------------------------------
    if event.get("Records"):
        logger.info("invoked_from_stream records=%s", len(event["Records"]))

        for rec in event["Records"]:
            if rec.get("eventName") != "MODIFY":
                continue

            new_image = rec["dynamodb"].get("NewImage", {})
            sk = new_image.get("sk", {}).get("S")

            if sk != "META":
                continue

            if new_image.get("all_pages_ready", {}).get("BOOL") is True:
                doc_id = new_image.get("doc_id", {}).get("S")
                if doc_id:
                    doc_ids.add(doc_id)

    # ------------------------------------------------------------------
    # Direct invocation (testing / recovery)
    # ------------------------------------------------------------------
    else:
        doc_id = event.get("doc_id")
        if doc_id:
            logger.info("direct_invocation doc=%s", doc_id)
            doc_ids.add(doc_id)

    logger.info("documents_selected count=%s", len(doc_ids))

    results = []

    for doc_id in doc_ids:
        meta_key = {"doc_id": doc_id, "sk": "META"}

        logger.info("aggregation_attempt doc=%s", doc_id)

        # ------------------------------------------------------------------
        # Step 1: Acquire aggregation lock
        # ------------------------------------------------------------------
        try:
            TABLE.update_item(
                Key=meta_key,
                UpdateExpression="SET #s = :agg, aggregating_at = :now",
                ConditionExpression=(
                    Attr("all_pages_ready").eq(True)
                    & (Attr("status").not_exists() | Attr("status").eq("PROCESSING"))
                ),
                ExpressionAttributeNames={"#s": "status"},
                ExpressionAttributeValues={
                    ":agg": "AGGREGATING",
                    ":now": now_iso(),
                },
            )
            logger.info("aggregation_lock_acquired doc=%s", doc_id)

        except ClientError as e:
            if e.response["Error"]["Code"] == "ConditionalCheckFailedException":
                logger.info("aggregation_lock_skipped doc=%s", doc_id)
                continue
            raise

        # ------------------------------------------------------------------
        # Step 2: Read META
        # ------------------------------------------------------------------
        meta = TABLE.get_item(
            Key=meta_key,
            ConsistentRead=True
        ).get("Item")

        if not meta:
            logger.error("meta_missing doc=%s", doc_id)
            raise RuntimeError(f"META missing for {doc_id}")

        total_pages = int(meta["total_pages"])
        s3_prefix = meta["s3_prefix"]

        logger.info(
            "meta_loaded doc=%s total_pages=%s",
            doc_id,
            total_pages,
        )

        # ------------------------------------------------------------------
        # Step 3: Fetch pages
        # ------------------------------------------------------------------
        resp = TABLE.query(
            KeyConditionExpression=Key("doc_id").eq(doc_id)
            & Key("sk").begins_with("PAGE#")
        )
        pages = resp.get("Items", [])

        if len(pages) < total_pages:
            logger.warning(
                "pages_incomplete doc=%s ready=%s expected=%s",
                doc_id,
                len(pages),
                total_pages,
            )
            raise RuntimeError(
                f"Incomplete pages for {doc_id}: {len(pages)}/{total_pages}"
            )

        logger.info("pages_loaded doc=%s count=%s", doc_id, len(pages))

        pages_sorted = sorted(pages, key=lambda x: x["sk"])
        merged_text = "\n\n".join(p.get("text", "") for p in pages_sorted)

        # ------------------------------------------------------------------
        # Step 4: Write output
        # ------------------------------------------------------------------
        output_key = f"{s3_prefix}/full_text.txt"

        s3.put_object(
            Bucket=OUTPUT_BUCKET,
            Key=output_key,
            Body=merged_text.encode("utf-8"),
            ContentType="text/plain",
        )

        logger.info(
            "output_written doc=%s key=%s",
            doc_id,
            output_key,
        )

        # ------------------------------------------------------------------
        # Step 5: Finalize META
        # ------------------------------------------------------------------
        TABLE.update_item(
            Key=meta_key,
            UpdateExpression="""
                SET #s = :done,
                    output_s3_key = :k,
                    finished_at = :t
            """,
            ExpressionAttributeNames={"#s": "status"},
            ExpressionAttributeValues={
                ":done": "DONE",
                ":k": output_key,
                ":t": now_iso(),
            },
        )

        logger.info("aggregation_completed doc=%s", doc_id)

        results.append(
            {"doc_id": doc_id, "output_s3_key": output_key}
        )

    logger.info("aggregator_run_complete processed=%s", len(results))

    return {"processed": results}
