-- Product Variants Schema Cleanup & Enhancement
-- Removes Shopify dependencies and adds full CRUD support

-- 1. Make Shopify IDs nullable (we're not using Shopify anymore)
ALTER TABLE product_variants ALTER COLUMN shopify_variant_id DROP NOT NULL;
ALTER TABLE products ALTER COLUMN shopify_product_id DROP NOT NULL;

-- 2. Ensure product_id is required (every variant needs a product)
ALTER TABLE product_variants ALTER COLUMN product_id SET NOT NULL;

-- 3. Add missing columns for full variant management
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS compare_at_price NUMERIC;
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS inventory_quantity INTEGER DEFAULT 0;
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- 4. Add helpful indexes
CREATE INDEX IF NOT EXISTS idx_variants_product_id ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_variants_status ON product_variants(status);
CREATE INDEX IF NOT EXISTS idx_variants_sku ON product_variants(sku);

-- 5. Add foreign key constraint (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fk_variants_product'
    ) THEN
        ALTER TABLE product_variants 
        ADD CONSTRAINT fk_variants_product 
        FOREIGN KEY (product_id) 
        REFERENCES products(id) 
        ON DELETE CASCADE;
    END IF;
END $$;

-- 6. Verify schema
SELECT 
    column_name, 
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'product_variants' 
ORDER BY ordinal_position;

-- Expected columns:
-- ✓ id (uuid, NOT NULL, PK)
-- ✓ shopify_variant_id (bigint, nullable)
-- ✓ product_id (uuid, NOT NULL, FK)
-- ✓ title (text, nullable)
-- ✓ sku (text, nullable)
-- ✓ price (numeric, nullable)
-- ✓ compare_at_price (numeric, nullable)
-- ✓ inventory_quantity (integer, nullable, default 0)
-- ✓ available (boolean, nullable)
-- ✓ status (text, nullable, default 'active')
-- ✓ created_at (timestamp, nullable, default NOW())
-- ✓ updated_at (timestamp, nullable, default NOW())

