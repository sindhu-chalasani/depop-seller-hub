CREATE TABLE IF NOT EXISTS sellers (
    id SERIAL PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS listings (
    id SERIAL PRIMARY KEY,
    seller_id INTEGER NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
    source_key TEXT,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    list_price_cents INTEGER NOT NULL CHECK (list_price_cents >= 0),
    listed_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    listing_id INTEGER NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    seller_id INTEGER NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
    sold_price_cents INTEGER NOT NULL CHECK (sold_price_cents >= 0),
    sold_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS listings_seller_source_key_uidx
    ON listings (seller_id, source_key);

CREATE INDEX IF NOT EXISTS idx_listings_seller_listed_at
    ON listings (seller_id, listed_at);

CREATE INDEX IF NOT EXISTS idx_orders_seller_sold_at
    ON orders (seller_id, sold_at);

CREATE INDEX IF NOT EXISTS idx_orders_listing_id
    ON orders (listing_id);