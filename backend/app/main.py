import os
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, Any

from app.auth import get_current_user
from app.api.health import router as health_router
from app.api.sellers import router as sellers_router
from app.api.upload import router as upload_router

app = FastAPI(title="Depop Seller Hub API", version="0.1.0")

allowed_origins = ["http://localhost:5173", "http://127.0.0.1:5173"]
frontend_url = os.environ.get("FRONTEND_URL")
if frontend_url:
    allowed_origins.append(frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(sellers_router)
app.include_router(upload_router)


@app.on_event("startup")
def run_migrations():
    from app.db.connection import get_db_conn
    from pathlib import Path

    schema_path = Path(__file__).resolve().parent.parent.parent / "db" / "schema.sql"
    if not schema_path.exists():
        schema_path = Path(__file__).resolve().parent / "schema.sql"
    if not schema_path.exists():
        print("WARNING: schema.sql not found, skipping auto-migration")
        return

    try:
        conn = get_db_conn()
        with conn.cursor() as cur:
            cur.execute(schema_path.read_text())
        conn.commit()
        conn.close()
        print("DB schema migration complete")
    except Exception as e:
        print(f"WARNING: schema migration failed: {e}")


@app.get("/me")
def me(user: Dict[str, Any] = Depends(get_current_user)):
    return {
        "seller_id": user["seller_id"],
        "email": user["email"],
    }
