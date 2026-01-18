import os
import json
import csv
import hashlib
import boto3
import ssl
import pg8000

s3 = boto3.client("s3")
secrets = boto3.client("secretsmanager")

UPLOADS_BUCKET = os.environ["UPLOADS_BUCKET"]
DB_SECRET_ARN = os.environ["DB_SECRET_ARN"]
DB_HOST = os.environ["DB_HOST"]
DB_NAME = os.environ["DB_NAME"]

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

def _parse_money_to_cents(value):
    if value is None:
        return 0
    text = str(value).strip()
    if text == "":
        return 0
    #removing $, commas
    text = text.replace("$", "").replace(",", "")
    try:
        dollars = float(text)
        return int(round(dollars * 100.0))
    except:
        return 0

def _row_hash(row_dict):
    #deterministic hash of full row content
    items = list()
    for key in sorted(row_dict.keys()):
        items.append(f"{key}={row_dict.get(key)}")
    raw = "|".join(items).encode("utf-8")
    return hashlib.sha256(raw).hexdigest()

def main(event, context):
    #S3 event
    records = event.get("Records", [])
    if len(records) == 0:
        return {"ok": True, "message": "No records"}

    conn = None
    inserted = 0
    skipped = 0

    try:
        conn = connect_db()
        _ensure_schema(conn)
        cur = conn.cursor()

        for rec in records:
            bucket = rec["s3"]["bucket"]["name"]
            key = rec["s3"]["object"]["key"]

            #key: uploads/<seller_key>/...
            parts = key.split("/")
            seller_key = parts[1] if len(parts) >= 2 else "dev"

            obj = s3.get_object(Bucket=bucket, Key=key)
            body_bytes = obj["Body"].read()
            text = body_bytes.decode("utf-8", errors="replace").splitlines()

            reader = csv.DictReader(text)
            for row in reader:
                h = _row_hash(row)

                #best-effort columns (will adjust later)
                sold_price_cents = _parse_money_to_cents(
                    row.get("sold_price") or row.get("Sold price") or row.get("Price") or row.get("Total")
                )
                fees_cents = _parse_money_to_cents(
                    row.get("fees") or row.get("Fees") or row.get("Depop fee")
                )
                shipping_cents = _parse_money_to_cents(
                    row.get("shipping") or row.get("Shipping")
                )
                item_cost_cents = _parse_money_to_cents(
                    row.get("item_cost") or row.get("Item cost") or row.get("Cost")
                )

                try:
                    cur.execute("""
                      INSERT INTO orders
                        (seller_key, source_row_hash, sold_price_cents, fees_cents, shipping_cents, item_cost_cents)
                      VALUES
                        (%s, %s, %s, %s, %s, %s)
                      ON CONFLICT (seller_key, source_row_hash) DO NOTHING;
                    """, (seller_key, h, sold_price_cents, fees_cents, shipping_cents, item_cost_cents))
                    #pg8000 cursor.rowcount isn't always reliable so treat as inserted if no exception
                    inserted += 1
                except Exception:
                    skipped += 1

            conn.commit()

        return {"ok": True, "inserted_attempts": inserted, "skipped_attempts": skipped}

    finally:
        if conn:
            conn.close()