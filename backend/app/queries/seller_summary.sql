WITH
listed AS (
  SELECT COUNT(*)::int AS listed_count
  FROM listings
  WHERE seller_id = %(seller_id)s
),
sold AS (
  SELECT
    COUNT(*)::int AS units_sold,
    COALESCE(SUM(o.sold_price_cents), 0)::int AS revenue_cents,
    AVG(o.sold_price_cents)::float AS avg_sale_price_cents,
    AVG(EXTRACT(EPOCH FROM (o.sold_at - l.listed_at)) / 86400.0)::float AS avg_days_to_sell
  FROM orders o
  JOIN listings l ON l.id = o.listing_id
  WHERE o.seller_id = %(seller_id)s
),
active AS (
  SELECT COUNT(*)::int AS active_listings
  FROM listings l
  LEFT JOIN orders o ON o.listing_id = l.id
  WHERE l.seller_id = %(seller_id)s
    AND o.id IS NULL
)
SELECT
  %(seller_id)s::int AS seller_id,
  listed.listed_count,
  sold.units_sold,
  sold.revenue_cents,
  sold.avg_sale_price_cents,
  sold.avg_days_to_sell,
  active.active_listings
FROM listed, sold, active;