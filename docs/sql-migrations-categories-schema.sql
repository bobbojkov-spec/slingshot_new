-- Categories Table Enhancement
-- Adds status, visible, description, ordering, and hierarchy support

-- 1. Add new columns
ALTER TABLE categories ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE categories ADD COLUMN IF NOT EXISTS visible BOOLEAN DEFAULT true;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES categories(id) ON DELETE SET NULL;

-- 2. Add helpful indexes
CREATE INDEX IF NOT EXISTS idx_categories_status ON categories(status);
CREATE INDEX IF NOT EXISTS idx_categories_visible ON categories(visible);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON categories(sort_order);

-- 3. Ensure existing categories have active status and visible
UPDATE categories SET status = 'active' WHERE status IS NULL;
UPDATE categories SET visible = true WHERE visible IS NULL;

-- 4. Verify schema
SELECT 
    column_name, 
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'categories' 
ORDER BY ordinal_position;

-- Expected columns:
-- ✓ id (uuid, NOT NULL, PK)
-- ✓ handle (text, nullable)
-- ✓ name (text, NOT NULL)
-- ✓ slug (text, nullable)
-- ✓ created_at (timestamp, NOT NULL)
-- ✓ updated_at (timestamp, NOT NULL)
-- ✓ status (text, nullable, default 'active')
-- ✓ visible (boolean, nullable, default true)
-- ✓ description (text, nullable)
-- ✓ sort_order (integer, nullable, default 0)
-- ✓ image_url (text, nullable)
-- ✓ parent_id (uuid, nullable, FK to categories.id)

