/*
  Migration: product colors + variant availability

  This migration introduces two new tables plus variant metadata that
  let us manage colors per product and track stock for every variant × color
  combination.
*/

-- 1. Add multilingual name and sorting metadata to variants
ALTER TABLE product_variants
  ADD COLUMN name_en TEXT,
  ADD COLUMN name_bg TEXT,
  ADD COLUMN position INT DEFAULT 0;

-- 2. Persist product-scoped colors
CREATE TABLE IF NOT EXISTS product_colors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name_en TEXT NOT NULL DEFAULT '',
  name_bg TEXT NOT NULL DEFAULT '',
  hex_color VARCHAR(7) NOT NULL DEFAULT '#000000',
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_colors_product_id ON product_colors(product_id);

-- 3. Track availability per variant × color cell
CREATE TABLE IF NOT EXISTS product_variant_availability (
  variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  color_id UUID NOT NULL REFERENCES product_colors(id) ON DELETE CASCADE,
  stock_qty INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  PRIMARY KEY (variant_id, color_id)
);

CREATE INDEX IF NOT EXISTS idx_pva_variant_id ON product_variant_availability(variant_id);
CREATE INDEX IF NOT EXISTS idx_pva_color_id ON product_variant_availability(color_id);

