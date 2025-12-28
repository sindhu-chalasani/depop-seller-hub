import os
from fastapi import FastAPI
import psycopg

app = FastAPI(title="Depop Seller Hub API", version="0.1.0")


def get_db_conn() -> psycopg.Connection:
    db_host = os.environ.get("DB_HOST", "localhost")
    db_port = int(os.environ.get("DB_PORT", "5432"))
    db_name = os.environ.get("DB_NAME", "mydepop")
    db_user = os.environ.get("DB_USER", "mydepop_user")
    db_password = os.environ.get("DB_PASSWORD", "mydepop_password")

    conn = psycopg.connect(
        host=db_host,
        port=db_port,
        dbname=db_name,
        user=db_user,
        password=db_password,
    )
    return conn


@app.get("/health")
def health() -> dict:
    conn = None
    try:
        conn = get_db_conn()
        with conn.cursor() as cur:
            cur.execute("SELECT 1;")
            row = cur.fetchone()
        return {"status": "ok", "db": "ok", "check": row[0]}
    except Exception as e:
        return {"status": "degraded", "db": "error", "error": str(e)}
    finally:
        if conn is not None:
            conn.close()