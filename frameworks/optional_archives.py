"""Opt-in MongoDB and AWS archive adapters. SQL remains the system of record."""
from __future__ import annotations

import json
import os
from datetime import datetime, timezone
from typing import Any


def archive_synthetic_audit_to_mongodb(event: dict[str, Any], *, uri: str | None = None) -> str:
    """Store a minimal audit envelope, never passwords or full transaction payloads."""
    connection = uri or os.environ.get("MONGODB_URI")
    if not connection:
        raise RuntimeError("Set MONGODB_URI to opt into MongoDB audit archiving.")
    from pymongo import MongoClient

    envelope = {
        "action": str(event.get("action", "unknown"))[:80],
        "organization_id": str(event.get("organization_id", ""))[:64],
        "actor_id": str(event.get("actor_id", ""))[:64],
        "collection": str(event.get("collection", ""))[:40],
        "record_key": str(event.get("record_key", ""))[:80],
        "created_at": datetime.now(timezone.utc),
        "synthetic_data_only": True,
    }
    with MongoClient(connection, serverSelectionTimeoutMS=4000, connectTimeoutMS=4000) as client:
        client.admin.command("ping")
        database = client[os.environ.get("MONGODB_DATABASE", "averis_archive")]
        result = database["audit_events"].insert_one(envelope)
        return str(result.inserted_id)


def upload_synthetic_json_backup_to_s3(
    snapshot: dict[str, Any], *, bucket: str | None = None,
    key: str | None = None, region: str | None = None,
) -> str:
    """Upload a caller-filtered synthetic JSON snapshot to S3 using standard AWS credentials."""
    target_bucket = bucket or os.environ.get("AVERIS_S3_BUCKET")
    if not target_bucket:
        raise RuntimeError("Set AVERIS_S3_BUCKET to opt into AWS S3 backups.")
    target_key = key or f"averis/backups/{datetime.now(timezone.utc).strftime('%Y/%m/%d/%H%M%S')}.json"
    import boto3

    encoded = json.dumps(snapshot, ensure_ascii=False, separators=(",", ":"), allow_nan=False).encode("utf-8")
    extra: dict[str, str] = {"ContentType": "application/json", "ServerSideEncryption": "AES256"}
    kms_key = os.environ.get("AVERIS_S3_SSE_KMS_KEY_ID")
    if kms_key:
        extra["ServerSideEncryption"] = "aws:kms"
        extra["SSEKMSKeyId"] = kms_key
    client = boto3.client("s3", region_name=region or os.environ.get("AWS_REGION"))
    client.put_object(Bucket=target_bucket, Key=target_key, Body=encoded, **extra)
    return f"s3://{target_bucket}/{target_key}"
