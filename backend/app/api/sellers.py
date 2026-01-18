from fastapi import APIRouter, Query, HTTPException
from app.services.analytics_service import get_seller_summary, get_top_items
from app.schemas.seller import SellerSummary
from app.schemas.items import TopItem
from app.db.sellers import get_seller_id_by_username 

router = APIRouter(prefix="/sellers", tags=["sellers"])


@router.get("/{seller_username}/summary", response_model=SellerSummary)
def seller_summary(seller_username: str) -> SellerSummary:
    seller_id = get_seller_id_by_username(seller_username)
    if seller_id is None:
        raise HTTPException(status_code=404, detail="Seller not found")

    summary = get_seller_summary(seller_id)
    return summary


@router.get("/{seller_username}/top-items", response_model=list[TopItem])
def top_items(
    seller_username: str,
    limit: int = Query(10, ge=1, le=50),
) -> list[TopItem]:
    seller_id = get_seller_id_by_username(seller_username)
    if seller_id is None:
        raise HTTPException(status_code=404, detail="Seller not found")

    items = get_top_items(seller_id=seller_id, limit=limit)
    return items