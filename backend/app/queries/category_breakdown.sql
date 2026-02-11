SELECT
  l.category,
  COUNT(o.id)::int AS units_sold,
  COALESCE(SUM(o.sold_price_cents), 0)::int AS revenue_cents
FROM orders o
JOIN listings l ON l.id = o.listing_id
WHERE o.seller_id = %(seller_id)s
GROUP BY l.category
ORDER BY revenue_cents DESC;
