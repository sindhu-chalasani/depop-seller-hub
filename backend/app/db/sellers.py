from typing import Optional
from app.db.connection import get_db_conn


def get_seller_id_by_username(seller_username: str) -> Optional[int]:
    query = """
        SELECT id
        FROM sellers
        WHERE username = %s
        LIMIT 1
    """

    conn = get_db_conn()
    with conn.cursor() as cur:
        cur.execute(query, (seller_username,))
        row = cur.fetchone()

    if row is None:
        return None

    return int(row["id"])