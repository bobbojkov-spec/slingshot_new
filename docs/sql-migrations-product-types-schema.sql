-- Product Types Table Creation
-- Creates a normalized table for product types (previously stored as TEXT in products.product_type)

-- 1. Create table
CREATE TABLE IF NOT EXISTS product_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  handle TEXT,
  description TEXT,
  status TEXT DEFAULT 'active',
  visible BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Add indexes
CREATE INDEX IF NOT EXISTS idx_product_types_status ON product_types(status);
CREATE INDEX IF NOT EXISTS idx_product_types_visible ON product_types(visible);
CREATE INDEX IF NOT EXISTS idx_product_types_slug ON product_types(slug);
CREATE INDEX IF NOT EXISTS idx_product_types_sort_order ON product_types(sort_order);

-- 3. Migrate existing product types from products table
INSERT INTO product_types (name, slug, handle, status, visible, sort_order)
SELECT DISTINCT 
  product_type as name,
  LOWER(REGEXP_REPLACE(REGEXP_REPLACE(product_type, '[^a-zA-Z0-9]+', '-', 'g'), '(^-|-$)', '', 'g')) as slug,
  LOWER(REGEXP_REPLACE(REGEXP_REPLACE(product_type, '[^a-zA-Z0-9]+', '-', 'g'), '(^-|-$)', '', 'g')) as handle,
  'active' as status,
  true as visible,
  0 as sort_order
FROM products
WHERE product_type IS NOT NULL AND product_type != ''
ON CONFLICT (name) DO NOTHING;

-- 4. Verify migration
SELECT 
  COUNT(*) as total_types,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as active_types,
  COUNT(CASE WHEN visible = true THEN 1 END) as visible_types
FROM product_types;

-- Expected result: All types are active and visible

-- 5. Check product counts per type
SELECT 
  pt.name,
  COUNT(p.id) as product_count
FROM product_types pt
LEFT JOIN products p ON p.product_type = pt.name
GROUP BY pt.id, pt.name
ORDER BY product_count DESC
LIMIT 10;

-- FUTURE ENHANCEMENT (OPTIONAL):
-- If you want to convert products.product_type from TEXT to UUID foreign key:
-- 
-- ALTER TABLE products ADD COLUMN product_type_id UUID REFERENCES product_types(id);
-- 
-- UPDATE products p
-- SET product_type_id = pt.id
-- FROM product_types pt
-- WHERE p.product_type = pt.name;
-- 
-- -- Verify all products have FK populated
-- SELECT COUNT(*) FROM products WHERE product_type IS NOT NULL AND product_type_id IS NULL;
-- 
-- -- Once verified, can drop old column
-- ALTER TABLE products DROP COLUMN product_type;
-- ALTER TABLE products RENAME COLUMN product_type_id TO product_type;

-- NOTE: For now, we keep products.product_type as TEXT for backwards compatibility.
-- The JOIN on name works perfectly and avoids needing to update all products.

