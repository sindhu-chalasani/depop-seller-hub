from fastapi import FastAPI
from app.api.health import router as health_router
from app.api.sellers import router as sellers_router

app = FastAPI(title="Depop Seller Hub API", version="0.1.0")

app.include_router(health_router)
app.include_router(sellers_router)