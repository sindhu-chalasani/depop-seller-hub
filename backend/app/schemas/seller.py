from pydantic import BaseModel


class SellerSummary(BaseModel):
    seller_id: int

    gmv_cents: int
    profit_cents: int
    total_fees_cents: int
    units_sold: int
    avg_sale_price_cents: int

    listed_count: int
    sell_through_rate: float

    avg_days_to_sell: float
    active_listings: int


class MonthlySales(BaseModel):
    month: str
    revenue_cents: int
    profit_cents: int
    units_sold: int


class CategoryBreakdown(BaseModel):
    category: str
    revenue_cents: int
    units_sold: int
