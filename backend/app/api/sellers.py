from fastapi import APIRouter, Query
from app.services.analytics_service import get_seller_summary, get_top_items
from app.schemas.seller import SellerSummary
from app.schemas.items import TopItem

router = APIRouter(prefix="/sellers", tags=["sellers"])


@router.get("/{seller_id}/summary", response_model=SellerSummary)
def seller_summary(seller_id: int) -> SellerSummary:
    summary = get_seller_summary(seller_id)
    return summary

@router.get("/{seller_id}/top-items", response_model=list[TopItem])
def top_items(
    seller_id: int,
    limit: int = Query(10, ge=1, le=50),
) -> list[TopItem]:
    items = get_top_items(seller_id=seller_id, limit=limit)
    return items