import os
import psycopg
from psycopg.rows import dict_row


def get_db_conn() -> psycopg.Connection:
    database_url = os.environ.get("DATABASE_URL")

    if database_url:
        conn = psycopg.connect(database_url, row_factory=dict_row)
    else:
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
            row_factory=dict_row,
        )
    return conn