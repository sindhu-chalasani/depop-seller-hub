import os
import json
import time
import boto3
import ssl
import pg8000
from botocore.exceptions import ClientError

s3 = boto3.client("s3")
secrets = boto3.client("secretsmanager")

UPLOADS_BUCKET = os.environ["UPLOADS_BUCKET"]
DB_SECRET_ARN = os.environ["DB_SECRET_ARN"]
DB_HOST = os.environ["DB_HOST"]
DB_NAME = os.environ["DB_NAME"]

def _json(status_code, body_obj):
    return {
        "statusCode": status_code,
        "headers": {
            "content-type": "application/json",
            "access-control-allow-origin": "*",
            "access-control-allow-headers": "*",
            "access-control-allow-methods": "GET,POST,OPTIONS",
        },
        "body": json.dumps(body_obj),
    }

def _get_db_creds():
    resp = secrets.get_secret_value(SecretId=DB_SECRET_ARN)
    secret_obj = json.loads(resp["SecretString"])
    return secret_obj["username"], secret_obj["password"]

def connect_db(db_host, db_name, db_user, db_password):
    ssl_context = ssl.create_default_context()
    ssl_context.check_hostname = False
    ssl_context.verify_mode = ssl.CERT_NONE  # ok for demo

    conn = pg8000.connect(
        host=db_host,
        database=db_name,
        user=db_user,
        password=db_password,
        port=5432,
        ssl_context=ssl_context,
    )
    return conn

def _ensure_schema(conn):
    cur = conn.cursor()
    cur.execute("""
      CREATE TABLE IF NOT EXISTS orders (
        id BIGSERIAL PRIMARY KEY,
        seller_key TEXT NOT NULL,
        source_row_hash TEXT NOT NULL,
        sold_price_cents BIGINT NOT NULL DEFAULT 0,
        fees_cents BIGINT NOT NULL DEFAULT 0,
        shipping_cents BIGINT NOT NULL DEFAULT 0,
        item_cost_cents BIGINT NOT NULL DEFAULT 0,
        sold_at TIMESTAMPTZ NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (seller_key, source_row_hash)
      );
    """)
    conn.commit()

def main(event, context):
    method = event.get("requestContext", {}).get("http", {}).get("method", "")
    path = event.get("rawPath", "")

    if method == "OPTIONS":
        return _json(200, {"ok": True})

    if path == "/presign" and method == "POST":
        try:
            body = event.get("body") or "{}"
            data = json.loads(body)
            filename = str(data.get("filename", "upload.csv"))

            if not filename.lower().endswith(".csv"):
                return _json(400, {"error": "Only .csv allowed"})

            seller_key = "dev"
            ts = int(time.time())
            key = f"uploads/{seller_key}/{ts}-{filename}".replace(" ", "_")

            upload_url = s3.generate_presigned_url(
                ClientMethod="put_object",
                Params={
                    "Bucket": UPLOADS_BUCKET,
                    "Key": key,
                    "ContentType": "text/csv",
                },
                ExpiresIn=300,
            )

            return _json(200, {"uploadUrl": upload_url, "key": key})
        except ClientError as e:
            return _json(500, {"error": str(e)})

    if path == "/kpis" and method == "GET":
        conn = None
        try:
            conn = connect_db()
            _ensure_schema(conn)

            seller_key = "dev"
            cur = conn.cursor()
            cur.execute("""
              SELECT
                COALESCE(SUM(sold_price_cents), 0) AS gmv_cents,
                COALESCE(SUM(sold_price_cents - fees_cents - shipping_cents - item_cost_cents), 0) AS profit_cents,
                COALESCE(COUNT(*), 0) AS units_sold
              FROM orders
              WHERE seller_key = %s;
            """, (seller_key,))
            row = cur.fetchone()
            return _json(200, {
                "gmv_cents": int(row[0]),
                "profit_cents": int(row[1]),
                "units_sold": int(row[2]),
            })
        except Exception as e:
            return _json(500, {"error": str(e)})
        finally:
            if conn:
                conn.close()

    return _json(404, {"error": "Not found"})