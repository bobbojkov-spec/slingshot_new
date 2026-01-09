-- ============================================================================
-- NAVIGATION-RELATED MIGRATION
-- Adds admin-supported menu groups, activity categories, and join tables
-- ============================================================================

BEGIN;

-- 1. Activity categories table
CREATE TABLE IF NOT EXISTS activity_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en TEXT NOT NULL,
  name_bg TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  position INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_categories_position ON activity_categories(position);

-- 2. Product <> Activity Category mapping
CREATE TABLE IF NOT EXISTS product_activity_categories (
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  activity_category_id UUID NOT NULL REFERENCES activity_categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (product_id, activity_category_id)
);

-- 3. Menu group assignments (sport × product type)
CREATE TABLE IF NOT EXISTS menu_group_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  product_type_id UUID NOT NULL REFERENCES product_types(id) ON DELETE CASCADE,
  menu_group TEXT NOT NULL CHECK (menu_group IN ('gear','accessories')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(category_id, product_type_id)
);

CREATE INDEX IF NOT EXISTS idx_menu_group_assignments_category ON menu_group_assignments(category_id);
CREATE INDEX IF NOT EXISTS idx_menu_group_assignments_product_type ON menu_group_assignments(product_type_id);

COMMIT;

-- ============================================================================
-- Usage notes:
-- 1. Run this script after the other migrations, before touching the admin UI.
-- 2. Populate activity categories via the new admin screen.
-- 3. Use menu group assignments to control the dropdown grouping per sport.
-- ============================================================================

