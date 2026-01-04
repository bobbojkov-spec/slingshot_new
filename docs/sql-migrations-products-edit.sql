-- SQL Migration: Add missing columns to products table for Edit page
-- Run these commands in your PostgreSQL database

-- Add SEO fields
ALTER TABLE products ADD COLUMN IF NOT EXISTS seo_title TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS seo_description TEXT;

-- Add additional description field
ALTER TABLE products ADD COLUMN IF NOT EXISTS description_html2 TEXT;

-- Add specs and package fields
ALTER TABLE products ADD COLUMN IF NOT EXISTS specs_html TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS package_includes TEXT;

-- Add name field (some products use 'name' instead of 'title')
ALTER TABLE products ADD COLUMN IF NOT EXISTS name TEXT;

-- Add brand field (currently read-only in UI but good to have)
ALTER TABLE products ADD COLUMN IF NOT EXISTS brand TEXT;

-- Optional: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_product_type ON products(product_type);

-- Verify the changes
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'products' 
ORDER BY ordinal_position;

