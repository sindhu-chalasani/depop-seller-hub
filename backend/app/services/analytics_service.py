from app.db.connection import get_db_conn
from app.schemas.seller import SellerSummary
from app.schemas.items import TopItem


def load_sql_file(path: str) -> str:
    with open(path, "r") as f:
        return f.read()


def get_seller_summary(seller_id: int) -> SellerSummary:
    sql = load_sql_file("app/queries/seller_summary.sql")

    conn = None
    try:
        conn = get_db_conn()
        with conn.cursor() as cur:
            cur.execute(sql, {"seller_id": seller_id})
            row = cur.fetchone()

        listed_count = int(row.get("listed_count") or 0)
        units_sold = int(row.get("units_sold") or 0)
        revenue_cents = int(row.get("revenue_cents") or 0)

        avg_sale_price_cents_float = row.get("avg_sale_price_cents")
        if avg_sale_price_cents_float is None:
            avg_sale_price_cents = 0
        else:
            avg_sale_price_cents = int(round(float(avg_sale_price_cents_float)))

        avg_days_to_sell_float = row.get("avg_days_to_sell")
        if avg_days_to_sell_float is None:
            avg_days_to_sell = 0.0
        else:
            avg_days_to_sell = float(avg_days_to_sell_float)

        active_listings = int(row.get("active_listings") or 0)

        if listed_count == 0:
            sell_through_rate = 0.0
        else:
            sell_through_rate = units_sold / listed_count

        summary = SellerSummary(
            seller_id=seller_id,
            revenue_cents=revenue_cents,
            units_sold=units_sold,
            avg_sale_price_cents=avg_sale_price_cents,
            listed_count=listed_count,
            sell_through_rate=sell_through_rate,
            avg_days_to_sell=avg_days_to_sell,
            active_listings=active_listings,
        )
        return summary

    finally:
        if conn is not None:
            conn.close()

def get_top_items(seller_id: int, limit: int) -> list[TopItem]:
    if limit < 1:
        limit = 1
    elif limit > 50:
        limit = 50

    sql = load_sql_file("app/queries/top_items.sql")

    conn = None
    try:
        conn = get_db_conn()
        with conn.cursor() as cur:
            cur.execute(sql, {"seller_id": seller_id, "limit": limit})
            rows = cur.fetchall()

        items = list()
        for row in rows:
            listing_id = int(row.get("listing_id"))
            title = str(row.get("title") or "")
            category = str(row.get("category") or "")
            units_sold = int(row.get("units_sold") or 0)
            revenue_cents = int(row.get("revenue_cents") or 0)

            item = TopItem(
                listing_id=listing_id,
                title=title,
                category=category,
                units_sold=units_sold,
                revenue_cents=revenue_cents,
            )
            items.append(item)

        return items

    finally:
        if conn is not None:
            conn.close()