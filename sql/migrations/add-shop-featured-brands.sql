-- Migration: Add shop featured brands table
-- Created: 2026-03-02

CREATE TABLE IF NOT EXISTS shop_featured_brands (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    logo_url TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shop_featured_brands_order
ON shop_featured_brands(sort_order ASC);

SELECT 'Shop featured brands table created successfully' AS status;