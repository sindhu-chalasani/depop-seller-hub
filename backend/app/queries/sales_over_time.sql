SELECT
  TO_CHAR(o.sold_at, 'YYYY-MM') AS month,
  COUNT(*)::int AS units_sold,
  COALESCE(SUM(o.sold_price_cents), 0)::int AS revenue_cents,
  COALESCE(
    SUM(o.sold_price_cents)
    - SUM(o.depop_fee_cents + o.payment_fee_cents + o.boosting_fee_cents + o.shipping_cost_cents)
    - SUM(o.refunded_cents)
    + SUM(o.fees_refunded_cents),
    0
  )::int AS profit_cents
FROM orders o
WHERE o.seller_id = %(seller_id)s
GROUP BY TO_CHAR(o.sold_at, 'YYYY-MM')
ORDER BY month;
