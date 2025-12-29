from fastapi import APIRouter
from app.services.analytics_service import get_seller_summary
from app.schemas.seller import SellerSummary

router = APIRouter(prefix="/sellers", tags=["sellers"])


@router.get("/{seller_id}/summary", response_model=SellerSummary)
def seller_summary(seller_id: int) -> SellerSummary:
    summary = get_seller_summary(seller_id)
    return summary