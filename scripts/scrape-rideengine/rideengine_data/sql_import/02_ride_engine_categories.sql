-- ============================================================================
-- RIDE ENGINE CATEGORIES
-- ============================================================================

-- Main Category: Harnesses
DO $$
DECLARE category_1_uuid UUID;
BEGIN
  INSERT INTO categories (id, handle, name, slug, status, visible, sort_order, parent_id)
  VALUES (
    gen_random_uuid(),
    'harnesses',
    'Harnesses',
    'harnesses',
    'active',
    true,
    1,
    NULL
  )
  ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    sort_order = EXCLUDED.sort_order
  RETURNING id INTO category_1_uuid;
END $$;

-- Subcategory: Hyperlock System
INSERT INTO categories (id, handle, name, slug, status, visible, sort_order, parent_id)
SELECT
  gen_random_uuid(),
  'hyperlock-system',
  'Hyperlock System',
  'hyperlock-system',
  'active',
  true,
  1,
  c.id
FROM categories c
WHERE c.slug = 'harnesses'
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  sort_order = EXCLUDED.sort_order;

-- Subcategory: Wing Foil Harnesses
INSERT INTO categories (id, handle, name, slug, status, visible, sort_order, parent_id)
SELECT
  gen_random_uuid(),
  'wing-foil-harnesses',
  'Wing Foil Harnesses',
  'wing-foil-harnesses',
  'active',
  true,
  2,
  c.id
FROM categories c
WHERE c.slug = 'harnesses'
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  sort_order = EXCLUDED.sort_order;

-- Subcategory: Spreader Bars
INSERT INTO categories (id, handle, name, slug, status, visible, sort_order, parent_id)
SELECT
  gen_random_uuid(),
  'spreader-bars',
  'Spreader Bars',
  'spreader-bars',
  'active',
  true,
  3,
  c.id
FROM categories c
WHERE c.slug = 'harnesses'
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  sort_order = EXCLUDED.sort_order;

-- Subcategory: Parts & Accessories
INSERT INTO categories (id, handle, name, slug, status, visible, sort_order, parent_id)
SELECT
  gen_random_uuid(),
  'harness-parts-accessories',
  'Parts & Accessories',
  'harness-parts-accessories',
  'active',
  true,
  4,
  c.id
FROM categories c
WHERE c.slug = 'harnesses'
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  sort_order = EXCLUDED.sort_order;

-- Main Category: Performance PWC
DO $$
DECLARE category_6_uuid UUID;
BEGIN
  INSERT INTO categories (id, handle, name, slug, status, visible, sort_order, parent_id)
  VALUES (
    gen_random_uuid(),
    'performance-pwc',
    'Performance PWC',
    'performance-pwc',
    'active',
    true,
    6,
    NULL
  )
  ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    sort_order = EXCLUDED.sort_order
  RETURNING id INTO category_6_uuid;
END $$;

-- Subcategory: PWC Collars & Pontoons
INSERT INTO categories (id, handle, name, slug, status, visible, sort_order, parent_id)
SELECT
  gen_random_uuid(),
  'pwc-collars-pontoons',
  'PWC Collars & Pontoons',
  'pwc-collars-pontoons',
  'active',
  true,
  1,
  c.id
FROM categories c
WHERE c.slug = 'performance-pwc'
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  sort_order = EXCLUDED.sort_order;

-- Subcategory: Performance Sleds
INSERT INTO categories (id, handle, name, slug, status, visible, sort_order, parent_id)
SELECT
  gen_random_uuid(),
  'performance-sleds',
  'Performance Sleds',
  'performance-sleds',
  'active',
  true,
  2,
  c.id
FROM categories c
WHERE c.slug = 'performance-pwc'
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  sort_order = EXCLUDED.sort_order;

-- Main Category: Inflation & Accessories
DO $$
DECLARE category_9_uuid UUID;
BEGIN
  INSERT INTO categories (id, handle, name, slug, status, visible, sort_order, parent_id)
  VALUES (
    gen_random_uuid(),
    'inflation-accessories',
    'Inflation & Accessories',
    'inflation-accessories',
    'active',
    true,
    9,
    NULL
  )
  ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    sort_order = EXCLUDED.sort_order
  RETURNING id INTO category_9_uuid;
END $$;

-- Subcategory: E-Inflation (Air Box)
INSERT INTO categories (id, handle, name, slug, status, visible, sort_order, parent_id)
SELECT
  gen_random_uuid(),
  'e-inflation',
  'E-Inflation (Air Box)',
  'e-inflation',
  'active',
  true,
  1,
  c.id
FROM categories c
WHERE c.slug = 'inflation-accessories'
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  sort_order = EXCLUDED.sort_order;

-- Subcategory: Manual Pumps
INSERT INTO categories (id, handle, name, slug, status, visible, sort_order, parent_id)
SELECT
  gen_random_uuid(),
  'manual-pumps',
  'Manual Pumps',
  'manual-pumps',
  'active',
  true,
  2,
  c.id
FROM categories c
WHERE c.slug = 'inflation-accessories'
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  sort_order = EXCLUDED.sort_order;

-- Subcategory: Leashes
INSERT INTO categories (id, handle, name, slug, status, visible, sort_order, parent_id)
SELECT
  gen_random_uuid(),
  'leashes',
  'Leashes',
  'leashes',
  'active',
  true,
  3,
  c.id
FROM categories c
WHERE c.slug = 'inflation-accessories'
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  sort_order = EXCLUDED.sort_order;

-- Subcategory: Foot Straps
INSERT INTO categories (id, handle, name, slug, status, visible, sort_order, parent_id)
SELECT
  gen_random_uuid(),
  'foot-straps',
  'Foot Straps',
  'foot-straps',
  'active',
  true,
  4,
  c.id
FROM categories c
WHERE c.slug = 'inflation-accessories'
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  sort_order = EXCLUDED.sort_order;

-- Subcategory: Vehicle Accessories
INSERT INTO categories (id, handle, name, slug, status, visible, sort_order, parent_id)
SELECT
  gen_random_uuid(),
  'vehicle-accessories',
  'Vehicle Accessories',
  'vehicle-accessories',
  'active',
  true,
  5,
  c.id
FROM categories c
WHERE c.slug = 'inflation-accessories'
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  sort_order = EXCLUDED.sort_order;

-- Main Category: Protection
DO $$
DECLARE category_15_uuid UUID;
BEGIN
  INSERT INTO categories (id, handle, name, slug, status, visible, sort_order, parent_id)
  VALUES (
    gen_random_uuid(),
    'protection',
    'Protection',
    'protection',
    'active',
    true,
    15,
    NULL
  )
  ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    sort_order = EXCLUDED.sort_order
  RETURNING id INTO category_15_uuid;
END $$;

-- Subcategory: Impact Vests
INSERT INTO categories (id, handle, name, slug, status, visible, sort_order, parent_id)
SELECT
  gen_random_uuid(),
  'impact-vests',
  'Impact Vests',
  'impact-vests',
  'active',
  true,
  1,
  c.id
FROM categories c
WHERE c.slug = 'protection'
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  sort_order = EXCLUDED.sort_order;

-- Subcategory: Helmets
INSERT INTO categories (id, handle, name, slug, status, visible, sort_order, parent_id)
SELECT
  gen_random_uuid(),
  'helmets',
  'Helmets',
  'helmets',
  'active',
  true,
  2,
  c.id
FROM categories c
WHERE c.slug = 'protection'
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  sort_order = EXCLUDED.sort_order;

-- Subcategory: Hand/Knee Protection
INSERT INTO categories (id, handle, name, slug, status, visible, sort_order, parent_id)
SELECT
  gen_random_uuid(),
  'hand-knee-protection',
  'Hand/Knee Protection',
  'hand-knee-protection',
  'active',
  true,
  3,
  c.id
FROM categories c
WHERE c.slug = 'protection'
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  sort_order = EXCLUDED.sort_order;

-- Main Category: Bags
DO $$
DECLARE category_19_uuid UUID;
BEGIN
  INSERT INTO categories (id, handle, name, slug, status, visible, sort_order, parent_id)
  VALUES (
    gen_random_uuid(),
    'bags',
    'Bags',
    'bags',
    'active',
    true,
    19,
    NULL
  )
  ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    sort_order = EXCLUDED.sort_order
  RETURNING id INTO category_19_uuid;
END $$;

-- Subcategory: Wheeled Travel
INSERT INTO categories (id, handle, name, slug, status, visible, sort_order, parent_id)
SELECT
  gen_random_uuid(),
  'wheeled-travel-bags',
  'Wheeled Travel',
  'wheeled-travel-bags',
  'active',
  true,
  1,
  c.id
FROM categories c
WHERE c.slug = 'bags'
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  sort_order = EXCLUDED.sort_order;

-- Subcategory: Board Bags
INSERT INTO categories (id, handle, name, slug, status, visible, sort_order, parent_id)
SELECT
  gen_random_uuid(),
  'board-bags',
  'Board Bags',
  'board-bags',
  'active',
  true,
  2,
  c.id
FROM categories c
WHERE c.slug = 'bags'
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  sort_order = EXCLUDED.sort_order;

-- Subcategory: Day Protection
INSERT INTO categories (id, handle, name, slug, status, visible, sort_order, parent_id)
SELECT
  gen_random_uuid(),
  'day-protection',
  'Day Protection',
  'day-protection',
  'active',
  true,
  3,
  c.id
FROM categories c
WHERE c.slug = 'bags'
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  sort_order = EXCLUDED.sort_order;

-- Main Category: Wetsuits
DO $$
DECLARE category_23_uuid UUID;
BEGIN
  INSERT INTO categories (id, handle, name, slug, status, visible, sort_order, parent_id)
  VALUES (
    gen_random_uuid(),
    'wetsuits',
    'Wetsuits',
    'wetsuits',
    'active',
    true,
    23,
    NULL
  )
  ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    sort_order = EXCLUDED.sort_order
  RETURNING id INTO category_23_uuid;
END $$;

-- Subcategory: Men's
INSERT INTO categories (id, handle, name, slug, status, visible, sort_order, parent_id)
SELECT
  gen_random_uuid(),
  'mens-wetsuits',
  'Men''s',
  'mens-wetsuits',
  'active',
  true,
  1,
  c.id
FROM categories c
WHERE c.slug = 'wetsuits'
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  sort_order = EXCLUDED.sort_order;

-- Subcategory: Women's
INSERT INTO categories (id, handle, name, slug, status, visible, sort_order, parent_id)
SELECT
  gen_random_uuid(),
  'womens-wetsuits',
  'Women''s',
  'womens-wetsuits',
  'active',
  true,
  2,
  c.id
FROM categories c
WHERE c.slug = 'wetsuits'
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  sort_order = EXCLUDED.sort_order;

-- Subcategory: Wetsuit Accessories
INSERT INTO categories (id, handle, name, slug, status, visible, sort_order, parent_id)
SELECT
  gen_random_uuid(),
  'wetsuit-accessories',
  'Wetsuit Accessories',
  'wetsuit-accessories',
  'active',
  true,
  3,
  c.id
FROM categories c
WHERE c.slug = 'wetsuits'
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  sort_order = EXCLUDED.sort_order;

-- Main Category: Apparel
DO $$
DECLARE category_27_uuid UUID;
BEGIN
  INSERT INTO categories (id, handle, name, slug, status, visible, sort_order, parent_id)
  VALUES (
    gen_random_uuid(),
    'apparel',
    'Apparel',
    'apparel',
    'active',
    true,
    27,
    NULL
  )
  ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    sort_order = EXCLUDED.sort_order
  RETURNING id INTO category_27_uuid;
END $$;

-- Subcategory: Robes & Ponchos
INSERT INTO categories (id, handle, name, slug, status, visible, sort_order, parent_id)
SELECT
  gen_random_uuid(),
  'robes-ponchos',
  'Robes & Ponchos',
  'robes-ponchos',
  'active',
  true,
  1,
  c.id
FROM categories c
WHERE c.slug = 'apparel'
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  sort_order = EXCLUDED.sort_order;

-- Subcategory: Technical Jackets
INSERT INTO categories (id, handle, name, slug, status, visible, sort_order, parent_id)
SELECT
  gen_random_uuid(),
  'technical-jackets',
  'Technical Jackets',
  'technical-jackets',
  'active',
  true,
  2,
  c.id
FROM categories c
WHERE c.slug = 'apparel'
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  sort_order = EXCLUDED.sort_order;

-- Subcategory: Water Wear
INSERT INTO categories (id, handle, name, slug, status, visible, sort_order, parent_id)
SELECT
  gen_random_uuid(),
  'water-wear',
  'Water Wear',
  'water-wear',
  'active',
  true,
  3,
  c.id
FROM categories c
WHERE c.slug = 'apparel'
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  sort_order = EXCLUDED.sort_order;

-- Subcategory: Hoodies
INSERT INTO categories (id, handle, name, slug, status, visible, sort_order, parent_id)
SELECT
  gen_random_uuid(),
  'hoodies',
  'Hoodies',
  'hoodies',
  'active',
  true,
  4,
  c.id
FROM categories c
WHERE c.slug = 'apparel'
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  sort_order = EXCLUDED.sort_order;

-- Subcategory: T-Shirts
INSERT INTO categories (id, handle, name, slug, status, visible, sort_order, parent_id)
SELECT
  gen_random_uuid(),
  't-shirts',
  'T-Shirts',
  't-shirts',
  'active',
  true,
  5,
  c.id
FROM categories c
WHERE c.slug = 'apparel'
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  sort_order = EXCLUDED.sort_order;

-- Subcategory: Hats
INSERT INTO categories (id, handle, name, slug, status, visible, sort_order, parent_id)
SELECT
  gen_random_uuid(),
  'hats',
  'Hats',
  'hats',
  'active',
  true,
  6,
  c.id
FROM categories c
WHERE c.slug = 'apparel'
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  sort_order = EXCLUDED.sort_order;


-- ============================================================================
-- CATEGORY TRANSLATIONS (English)
-- ============================================================================

INSERT INTO category_translations (id, category_id, language_code, name, slug)
SELECT
  gen_random_uuid(),
  c.id,
  'en',
  'Harnesses',
  'harnesses'
FROM categories c
WHERE c.slug = 'harnesses'
ON CONFLICT (category_id, language_code) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug;

INSERT INTO category_translations (id, category_id, language_code, name, slug)
SELECT
  gen_random_uuid(),
  c.id,
  'en',
  'Hyperlock System',
  'hyperlock-system'
FROM categories c
WHERE c.slug = 'hyperlock-system'
ON CONFLICT (category_id, language_code) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug;

INSERT INTO category_translations (id, category_id, language_code, name, slug)
SELECT
  gen_random_uuid(),
  c.id,
  'en',
  'Wing Foil Harnesses',
  'wing-foil-harnesses'
FROM categories c
WHERE c.slug = 'wing-foil-harnesses'
ON CONFLICT (category_id, language_code) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug;

INSERT INTO category_translations (id, category_id, language_code, name, slug)
SELECT
  gen_random_uuid(),
  c.id,
  'en',
  'Spreader Bars',
  'spreader-bars'
FROM categories c
WHERE c.slug = 'spreader-bars'
ON CONFLICT (category_id, language_code) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug;

INSERT INTO category_translations (id, category_id, language_code, name, slug)
SELECT
  gen_random_uuid(),
  c.id,
  'en',
  'Parts & Accessories',
  'harness-parts-accessories'
FROM categories c
WHERE c.slug = 'harness-parts-accessories'
ON CONFLICT (category_id, language_code) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug;

INSERT INTO category_translations (id, category_id, language_code, name, slug)
SELECT
  gen_random_uuid(),
  c.id,
  'en',
  'Performance PWC',
  'performance-pwc'
FROM categories c
WHERE c.slug = 'performance-pwc'
ON CONFLICT (category_id, language_code) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug;

INSERT INTO category_translations (id, category_id, language_code, name, slug)
SELECT
  gen_random_uuid(),
  c.id,
  'en',
  'PWC Collars & Pontoons',
  'pwc-collars-pontoons'
FROM categories c
WHERE c.slug = 'pwc-collars-pontoons'
ON CONFLICT (category_id, language_code) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug;

INSERT INTO category_translations (id, category_id, language_code, name, slug)
SELECT
  gen_random_uuid(),
  c.id,
  'en',
  'Performance Sleds',
  'performance-sleds'
FROM categories c
WHERE c.slug = 'performance-sleds'
ON CONFLICT (category_id, language_code) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug;

INSERT INTO category_translations (id, category_id, language_code, name, slug)
SELECT
  gen_random_uuid(),
  c.id,
  'en',
  'Inflation & Accessories',
  'inflation-accessories'
FROM categories c
WHERE c.slug = 'inflation-accessories'
ON CONFLICT (category_id, language_code) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug;

INSERT INTO category_translations (id, category_id, language_code, name, slug)
SELECT
  gen_random_uuid(),
  c.id,
  'en',
  'E-Inflation (Air Box)',
  'e-inflation'
FROM categories c
WHERE c.slug = 'e-inflation'
ON CONFLICT (category_id, language_code) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug;

INSERT INTO category_translations (id, category_id, language_code, name, slug)
SELECT
  gen_random_uuid(),
  c.id,
  'en',
  'Manual Pumps',
  'manual-pumps'
FROM categories c
WHERE c.slug = 'manual-pumps'
ON CONFLICT (category_id, language_code) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug;

INSERT INTO category_translations (id, category_id, language_code, name, slug)
SELECT
  gen_random_uuid(),
  c.id,
  'en',
  'Leashes',
  'leashes'
FROM categories c
WHERE c.slug = 'leashes'
ON CONFLICT (category_id, language_code) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug;

INSERT INTO category_translations (id, category_id, language_code, name, slug)
SELECT
  gen_random_uuid(),
  c.id,
  'en',
  'Foot Straps',
  'foot-straps'
FROM categories c
WHERE c.slug = 'foot-straps'
ON CONFLICT (category_id, language_code) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug;

INSERT INTO category_translations (id, category_id, language_code, name, slug)
SELECT
  gen_random_uuid(),
  c.id,
  'en',
  'Vehicle Accessories',
  'vehicle-accessories'
FROM categories c
WHERE c.slug = 'vehicle-accessories'
ON CONFLICT (category_id, language_code) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug;

INSERT INTO category_translations (id, category_id, language_code, name, slug)
SELECT
  gen_random_uuid(),
  c.id,
  'en',
  'Protection',
  'protection'
FROM categories c
WHERE c.slug = 'protection'
ON CONFLICT (category_id, language_code) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug;

INSERT INTO category_translations (id, category_id, language_code, name, slug)
SELECT
  gen_random_uuid(),
  c.id,
  'en',
  'Impact Vests',
  'impact-vests'
FROM categories c
WHERE c.slug = 'impact-vests'
ON CONFLICT (category_id, language_code) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug;

INSERT INTO category_translations (id, category_id, language_code, name, slug)
SELECT
  gen_random_uuid(),
  c.id,
  'en',
  'Helmets',
  'helmets'
FROM categories c
WHERE c.slug = 'helmets'
ON CONFLICT (category_id, language_code) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug;

INSERT INTO category_translations (id, category_id, language_code, name, slug)
SELECT
  gen_random_uuid(),
  c.id,
  'en',
  'Hand/Knee Protection',
  'hand-knee-protection'
FROM categories c
WHERE c.slug = 'hand-knee-protection'
ON CONFLICT (category_id, language_code) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug;

INSERT INTO category_translations (id, category_id, language_code, name, slug)
SELECT
  gen_random_uuid(),
  c.id,
  'en',
  'Bags',
  'bags'
FROM categories c
WHERE c.slug = 'bags'
ON CONFLICT (category_id, language_code) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug;

INSERT INTO category_translations (id, category_id, language_code, name, slug)
SELECT
  gen_random_uuid(),
  c.id,
  'en',
  'Wheeled Travel',
  'wheeled-travel-bags'
FROM categories c
WHERE c.slug = 'wheeled-travel-bags'
ON CONFLICT (category_id, language_code) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug;

INSERT INTO category_translations (id, category_id, language_code, name, slug)
SELECT
  gen_random_uuid(),
  c.id,
  'en',
  'Board Bags',
  'board-bags'
FROM categories c
WHERE c.slug = 'board-bags'
ON CONFLICT (category_id, language_code) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug;

INSERT INTO category_translations (id, category_id, language_code, name, slug)
SELECT
  gen_random_uuid(),
  c.id,
  'en',
  'Day Protection',
  'day-protection'
FROM categories c
WHERE c.slug = 'day-protection'
ON CONFLICT (category_id, language_code) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug;

INSERT INTO category_translations (id, category_id, language_code, name, slug)
SELECT
  gen_random_uuid(),
  c.id,
  'en',
  'Wetsuits',
  'wetsuits'
FROM categories c
WHERE c.slug = 'wetsuits'
ON CONFLICT (category_id, language_code) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug;

INSERT INTO category_translations (id, category_id, language_code, name, slug)
SELECT
  gen_random_uuid(),
  c.id,
  'en',
  'Men''s',
  'mens-wetsuits'
FROM categories c
WHERE c.slug = 'mens-wetsuits'
ON CONFLICT (category_id, language_code) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug;

INSERT INTO category_translations (id, category_id, language_code, name, slug)
SELECT
  gen_random_uuid(),
  c.id,
  'en',
  'Women''s',
  'womens-wetsuits'
FROM categories c
WHERE c.slug = 'womens-wetsuits'
ON CONFLICT (category_id, language_code) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug;

INSERT INTO category_translations (id, category_id, language_code, name, slug)
SELECT
  gen_random_uuid(),
  c.id,
  'en',
  'Wetsuit Accessories',
  'wetsuit-accessories'
FROM categories c
WHERE c.slug = 'wetsuit-accessories'
ON CONFLICT (category_id, language_code) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug;

INSERT INTO category_translations (id, category_id, language_code, name, slug)
SELECT
  gen_random_uuid(),
  c.id,
  'en',
  'Apparel',
  'apparel'
FROM categories c
WHERE c.slug = 'apparel'
ON CONFLICT (category_id, language_code) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug;

INSERT INTO category_translations (id, category_id, language_code, name, slug)
SELECT
  gen_random_uuid(),
  c.id,
  'en',
  'Robes & Ponchos',
  'robes-ponchos'
FROM categories c
WHERE c.slug = 'robes-ponchos'
ON CONFLICT (category_id, language_code) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug;

INSERT INTO category_translations (id, category_id, language_code, name, slug)
SELECT
  gen_random_uuid(),
  c.id,
  'en',
  'Technical Jackets',
  'technical-jackets'
FROM categories c
WHERE c.slug = 'technical-jackets'
ON CONFLICT (category_id, language_code) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug;

INSERT INTO category_translations (id, category_id, language_code, name, slug)
SELECT
  gen_random_uuid(),
  c.id,
  'en',
  'Water Wear',
  'water-wear'
FROM categories c
WHERE c.slug = 'water-wear'
ON CONFLICT (category_id, language_code) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug;

INSERT INTO category_translations (id, category_id, language_code, name, slug)
SELECT
  gen_random_uuid(),
  c.id,
  'en',
  'Hoodies',
  'hoodies'
FROM categories c
WHERE c.slug = 'hoodies'
ON CONFLICT (category_id, language_code) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug;

INSERT INTO category_translations (id, category_id, language_code, name, slug)
SELECT
  gen_random_uuid(),
  c.id,
  'en',
  'T-Shirts',
  't-shirts'
FROM categories c
WHERE c.slug = 't-shirts'
ON CONFLICT (category_id, language_code) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug;

INSERT INTO category_translations (id, category_id, language_code, name, slug)
SELECT
  gen_random_uuid(),
  c.id,
  'en',
  'Hats',
  'hats'
FROM categories c
WHERE c.slug = 'hats'
ON CONFLICT (category_id, language_code) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug;
