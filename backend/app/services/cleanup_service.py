import psycopg


def clear_seller_data(conn: psycopg.Connection, seller_id: int) -> None:
    """
    this deletes seller data so uploads can be replaced.
    orders must be deleted before listings.
    """
    with conn.cursor() as cur:
        cur.execute("DELETE FROM orders WHERE seller_id = %s;", (seller_id,))
        cur.execute("DELETE FROM listings WHERE seller_id = %s;", (seller_id,))
