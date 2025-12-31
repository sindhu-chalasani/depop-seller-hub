import csv
from datetime import datetime
from typing import Tuple

import psycopg


def parse_money_to_cents(money_str: str) -> int:
    if money_str is None:
        return 0

    cleaned = money_str.strip()
    cleaned = cleaned.replace("$", "").replace(",", "")

    if cleaned == "":
        return 0

    cents = int(round(float(cleaned) * 100))
    return cents


def parse_sale_datetime(date_str: str, time_str: str) -> datetime:
    combined = date_str.strip() + " " + time_str.strip()
    return datetime.strptime(combined, "%m/%d/%Y %I:%M %p")


def parse_listing_date(date_str: str) -> datetime:
    return datetime.strptime(date_str.strip(), "%m/%d/%Y")


def build_title(row: dict) -> str:
    brand = (row.get("Brand") or "").strip()
    category = (row.get("Category") or "").strip()
    size = (row.get("Size") or "").strip()
    description = (row.get("Description") or "").strip()

    base = ""
    if brand != "" and category != "":
        base = brand + " - " + category
    elif brand != "":
        base = brand
    elif category != "":
        base = category
    else:
        base = "Item"

    if size != "":
        base = base + " (Size " + size + ")"

    if description != "":
        short_desc = description.replace("\n", " ").strip()
        if len(short_desc) > 60:
            short_desc = short_desc[:60] + "..."
        base = base + " - " + short_desc

    return base


def ensure_seller(conn: psycopg.Connection, username: str) -> int:
    with conn.cursor() as cur:
        cur.execute("SELECT id FROM sellers WHERE username = %s;", (username,))
        row = cur.fetchone()
        if row is not None:
            return int(row["id"])

        cur.execute("INSERT INTO sellers (username) VALUES (%s) RETURNING id;", (username,))
        row2 = cur.fetchone()
        return int(row2["id"])


def insert_listing(
    conn: psycopg.Connection,
    seller_id: int,
    title: str,
    category: str,
    list_price_cents: int,
    listed_at: datetime,
) -> int:
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO listings (seller_id, title, category, list_price_cents, listed_at)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id;
            """,
            (seller_id, title, category, list_price_cents, listed_at),
        )
        row = cur.fetchone()
        return int(row["id"])


def insert_order(
    conn: psycopg.Connection,
    listing_id: int,
    seller_id: int,
    sold_price_cents: int,
    sold_at: datetime,
) -> int:
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO orders (listing_id, seller_id, sold_price_cents, sold_at)
            VALUES (%s, %s, %s, %s)
            RETURNING id;
            """,
            (listing_id, seller_id, sold_price_cents, sold_at),
        )
        row = cur.fetchone()
        return int(row["id"])


def ingest_sales_csv_bytes(
    conn: psycopg.Connection,
    seller_username: str,
    csv_bytes: bytes,
) -> Tuple[int, int, int]:
    """
    this returns: (seller_id, listings_inserted, orders_inserted)
    notes: intentionally ignoring buyer/address fields (PII). sales export usually contains only sold items.
    """
    seller_id = ensure_seller(conn, seller_username)

    text = csv_bytes.decode("utf-8-sig")
    lines = text.splitlines()
    reader = csv.DictReader(lines)

    required = ["Date of sale", "Time of sale", "Date of listing", "Item price"]
    for col in required:
        if col not in reader.fieldnames:
            raise ValueError("Missing required column: " + col)

    listings_inserted = 0
    orders_inserted = 0

    for row in reader:
        date_of_sale = row.get("Date of sale")
        time_of_sale = row.get("Time of sale")
        date_of_listing = row.get("Date of listing")
        item_price = row.get("Item price")

        if date_of_sale is None or time_of_sale is None or date_of_listing is None or item_price is None:
            continue

        sold_at = parse_sale_datetime(date_of_sale, time_of_sale)
        listed_at = parse_listing_date(date_of_listing)

        category = (row.get("Category") or "Unknown").strip()
        title = build_title(row)

        list_price_cents = parse_money_to_cents(item_price)
        sold_price_cents = list_price_cents  #assumption for mvp (will improve later)

        listing_id = insert_listing(
            conn=conn,
            seller_id=seller_id,
            title=title,
            category=category,
            list_price_cents=list_price_cents,
            listed_at=listed_at,
        )
        listings_inserted += 1

        insert_order(
            conn=conn,
            listing_id=listing_id,
            seller_id=seller_id,
            sold_price_cents=sold_price_cents,
            sold_at=sold_at,
        )
        orders_inserted += 1

    return (seller_id, listings_inserted, orders_inserted)