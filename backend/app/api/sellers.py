from fastapi import APIRouter, Query, HTTPException, Depends
from typing import Dict, Any
from app.services.analytics_service import (
    get_seller_summary, get_top_items,
    get_sales_over_time, get_category_breakdown,
)
from app.schemas.seller import SellerSummary, MonthlySales, CategoryBreakdown
from app.schemas.items import TopItem
from app.db.sellers import get_seller_id_by_username
from app.auth import get_current_user

router = APIRouter(prefix="/sellers", tags=["sellers"])


@router.get("/{seller_username}/summary", response_model=SellerSummary)
def seller_summary(
    seller_username: str,
    _user: Dict[str, Any] = Depends(get_current_user),
) -> SellerSummary:
    seller_id = get_seller_id_by_username(seller_username)
    if seller_id is None:
        raise HTTPException(status_code=404, detail="Seller not found")

    summary = get_seller_summary(seller_id)
    return summary


@router.get("/{seller_username}/top-items", response_model=list[TopItem])
def top_items(
    seller_username: str,
    _user: Dict[str, Any] = Depends(get_current_user),
    limit: int = Query(10, ge=1, le=50),
) -> list[TopItem]:
    seller_id = get_seller_id_by_username(seller_username)
    if seller_id is None:
        raise HTTPException(status_code=404, detail="Seller not found")

    items = get_top_items(seller_id=seller_id, limit=limit)
    return items


@router.get("/{seller_username}/sales-over-time", response_model=list[MonthlySales])
def sales_over_time(
    seller_username: str,
    _user: Dict[str, Any] = Depends(get_current_user),
) -> list[MonthlySales]:
    seller_id = get_seller_id_by_username(seller_username)
    if seller_id is None:
        raise HTTPException(status_code=404, detail="Seller not found")

    return get_sales_over_time(seller_id)


@router.get("/{seller_username}/category-breakdown", response_model=list[CategoryBreakdown])
def category_breakdown(
    seller_username: str,
    _user: Dict[str, Any] = Depends(get_current_user),
) -> list[CategoryBreakdown]:
    seller_id = get_seller_id_by_username(seller_username)
    if seller_id is None:
        raise HTTPException(status_code=404, detail="Seller not found")

    return get_category_breakdown(seller_id)
