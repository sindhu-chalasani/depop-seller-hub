from pydantic import BaseModel


class TopItem(BaseModel):
    listing_id: int
    title: str
    category: str
    units_sold: int
    revenue_cents: int