from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Query

from app.db.connection import get_db_conn
from app.services.ingest_service import ingest_sales_csv_bytes, ensure_seller
from app.services.cleanup_service import clear_seller_data
from app.services.analytics_service import get_seller_summary

router = APIRouter(prefix="/sellers", tags=["upload"])


@router.post("/upload-sales")
async def upload_sales_csv(
    seller_username: str = Form(...),
    file: UploadFile = File(...),
    replace: bool = Query(False),
) -> dict:
    if file.filename is None or not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Please upload a .csv file")

    csv_bytes = await file.read()
    if len(csv_bytes) == 0:
        raise HTTPException(status_code=400, detail="Empty file")

    conn = None
    try:
        conn = get_db_conn()

        seller_id = ensure_seller(conn, seller_username)

        if replace:
            clear_seller_data(conn, seller_id)

        seller_id, listings_inserted, orders_inserted = ingest_sales_csv_bytes(
            conn=conn,
            seller_username=seller_username,
            csv_bytes=csv_bytes,
        )

        conn.commit()

        return {
            "seller_id": seller_id,
            "listings_inserted": listings_inserted,
            "orders_inserted": orders_inserted,
            "replaced": replace,
        }

    except ValueError as e:
        if conn is not None:
            conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))

    except Exception as e:
        if conn is not None:
            conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        if conn is not None:
            conn.close()

@router.post("/upload-and-summary")
async def upload_sales_and_summary(
    seller_username: str = Form(...),
    file: UploadFile = File(...),
    replace: bool = Query(False),
) -> dict:
    if file.filename is None or not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Please upload a .csv file")

    csv_bytes = await file.read()
    if len(csv_bytes) == 0:
        raise HTTPException(status_code=400, detail="Empty file")

    conn = None
    try:
        conn = get_db_conn()

        seller_id = ensure_seller(conn, seller_username)

        if replace:
            clear_seller_data(conn, seller_id)

        seller_id, listings_inserted, orders_inserted = ingest_sales_csv_bytes(
            conn=conn,
            seller_username=seller_username,
            csv_bytes=csv_bytes,
        )

        conn.commit()

        summary = get_seller_summary(seller_id)

        return {
            "seller_id": seller_id,
            "listings_inserted": listings_inserted,
            "orders_inserted": orders_inserted,
            "summary": summary,
        }

    except ValueError as e:
        if conn is not None:
            conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))

    except Exception as e:
        if conn is not None:
            conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        if conn is not None:
            conn.close()