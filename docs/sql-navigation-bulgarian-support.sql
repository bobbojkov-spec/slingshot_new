-- ==============================================================================
-- NAVIGATION BULGARIAN LANGUAGE SUPPORT
-- Adds menu_group to product_types and ensures BG translations for categories
-- ==============================================================================

BEGIN;

-- 1. Add menu_group column to product_types table
-- Values: 'gear', 'accessories', 'categories' (structural keys, not display text)
ALTER TABLE product_types 
ADD COLUMN IF NOT EXISTS menu_group TEXT DEFAULT 'gear';

-- Create index for navigation queries
CREATE INDEX IF NOT EXISTS idx_product_types_menu_group 
ON product_types(menu_group, visible, status);

-- 2. Set appropriate menu_group values for existing product_types
-- This is a starter mapping - adjust based on your actual product types
UPDATE product_types SET menu_group = 'gear' 
WHERE name IN ('Kites', 'Kite Bars', 'Boards', 'Foils', 'Wings', 'Wakeboards', 'Wake Boots', 
               'Kite Bar Parts', 'Foil Boards', 'Foil Parts', 'Kite Parts', 'Board Parts', 
               'Foil Packages', 'Wake Board Parts');

UPDATE product_types SET menu_group = 'accessories' 
WHERE name IN ('Footstraps', 'Harnesses', 'Helmets', 'Impact Vests', 'Leashes', 
               'Pumps', 'Bags', 'Pads');

UPDATE product_types SET menu_group = 'categories' 
WHERE name NOT IN ('Kites', 'Kite Bars', 'Boards', 'Foils', 'Wings', 'Wakeboards', 'Wake Boots', 
                   'Kite Bar Parts', 'Foil Boards', 'Foil Parts', 'Kite Parts', 'Board Parts', 
                   'Foil Packages', 'Wake Board Parts', 'Footstraps', 'Harnesses', 'Helmets', 
                   'Impact Vests', 'Leashes', 'Pumps', 'Bags', 'Pads')
   AND menu_group IS NULL;

-- 3. Ensure categories table has basic structure
-- (Categories represent sports: KITE, WING, WAKE, FOIL, SUP)
ALTER TABLE categories ADD COLUMN IF NOT EXISTS sport TEXT;

-- Map categories to sports if not already done
-- Note: Adjust these based on your actual category names
UPDATE categories SET sport = 'KITE' WHERE name ILIKE '%kite%' OR name ILIKE '%кайт%';
UPDATE categories SET sport = 'WING' WHERE name ILIKE '%wing%' OR name ILIKE '%уинг%' OR name ILIKE '%крило%';
UPDATE categories SET sport = 'WAKE' WHERE name ILIKE '%wake%' OR name ILIKE '%уейк%';
UPDATE categories SET sport = 'FOIL' WHERE name ILIKE '%foil%' OR name ILIKE '%фойл%';
UPDATE categories SET sport = 'SUP' WHERE name ILIKE '%sup%' OR name ILIKE '%съп%';

-- 4. Ensure Bulgarian translations exist for all categories
-- Insert BG translations for categories (copy from EN if not exists)
INSERT INTO category_translations (category_id, language_code, name, slug, description)
SELECT 
  c.id,
  'bg' as language_code,
  COALESCE(ct_en.name, c.name) as name,
  COALESCE(ct_en.slug, c.slug) || '-bg' as slug,
  COALESCE(ct_en.description, c.description) as description
FROM categories c
LEFT JOIN category_translations ct_en ON ct_en.category_id = c.id AND ct_en.language_code = 'en'
WHERE NOT EXISTS (
  SELECT 1 FROM category_translations ct_bg 
  WHERE ct_bg.category_id = c.id AND ct_bg.language_code = 'bg'
);

-- 5. Sample Bulgarian category translations
-- Adjust these based on your actual category names
UPDATE category_translations SET name = 'Кайт' WHERE language_code = 'bg' AND name ILIKE '%kite%';
UPDATE category_translations SET name = 'Уинг' WHERE language_code = 'bg' AND name ILIKE '%wing%';
UPDATE category_translations SET name = 'Уейкборд' WHERE language_code = 'bg' AND name ILIKE '%wake%';
UPDATE category_translations SET name = 'Фойл' WHERE language_code = 'bg' AND name ILIKE '%foil%';
UPDATE category_translations SET name = 'SUP борд' WHERE language_code = 'bg' AND name ILIKE '%sup%';
UPDATE category_translations SET name = 'Дъски' WHERE language_code = 'bg' AND name ILIKE '%board%';

-- 6. Ensure Bulgarian translations exist for all product_types
-- Insert BG translations for product_types (copy from EN if not exists)
INSERT INTO product_type_translations (product_type_id, language_code, name, slug, description)
SELECT 
  pt.id,
  'bg' as language_code,
  COALESCE(ptt_en.name, pt.name) as name,
  COALESCE(ptt_en.slug, pt.slug) || '-bg' as slug,
  COALESCE(ptt_en.description, pt.description) as description
FROM product_types pt
LEFT JOIN product_type_translations ptt_en ON ptt_en.product_type_id = pt.id AND ptt_en.language_code = 'en'
WHERE NOT EXISTS (
  SELECT 1 FROM product_type_translations ptt_bg 
  WHERE ptt_bg.product_type_id = pt.id AND ptt_bg.language_code = 'bg'
);

-- 7. Sample Bulgarian product type translations
-- Common translations - adjust based on actual product type names
UPDATE product_type_translations SET name = 'Кайтове' WHERE language_code = 'bg' AND name ILIKE 'kites' AND name NOT ILIKE '%parts%';
UPDATE product_type_translations SET name = 'Уингове' WHERE language_code = 'bg' AND name ILIKE 'wings';
UPDATE product_type_translations SET name = 'Дъски' WHERE language_code = 'bg' AND name ILIKE 'boards' AND name NOT ILIKE '%foil%' AND name NOT ILIKE '%wake%';
UPDATE product_type_translations SET name = 'Фойлове' WHERE language_code = 'bg' AND name ILIKE '%foil%' AND name NOT ILIKE '%parts%';
UPDATE product_type_translations SET name = 'Кайт барове' WHERE language_code = 'bg' AND name ILIKE 'kite bars' OR name ILIKE 'kite bar' AND name NOT ILIKE '%parts%';
UPDATE product_type_translations SET name = 'Уейкбордове' WHERE language_code = 'bg' AND name ILIKE 'wakeboards';
UPDATE product_type_translations SET name = 'Уейк обувки' WHERE language_code = 'bg' AND name ILIKE 'wake boots';
UPDATE product_type_translations SET name = 'Фойл дъски' WHERE language_code = 'bg' AND name ILIKE 'foil boards';
UPDATE product_type_translations SET name = 'Части за кайт бар' WHERE language_code = 'bg' AND name ILIKE 'kite bar parts';
UPDATE product_type_translations SET name = 'Части за фойл' WHERE language_code = 'bg' AND name ILIKE 'foil parts';
UPDATE product_type_translations SET name = 'Части за кайт' WHERE language_code = 'bg' AND name ILIKE 'kite parts';
UPDATE product_type_translations SET name = 'Части за дъска' WHERE language_code = 'bg' AND name ILIKE 'board parts';
UPDATE product_type_translations SET name = 'Части за уейкборд' WHERE language_code = 'bg' AND name ILIKE 'wake board parts' OR name ILIKE 'wakeboard parts';
UPDATE product_type_translations SET name = 'Части за уейк обувки' WHERE language_code = 'bg' AND name ILIKE 'wake boot parts';
UPDATE product_type_translations SET name = 'Колани' WHERE language_code = 'bg' AND name ILIKE 'footstraps';
UPDATE product_type_translations SET name = 'Харнеси' WHERE language_code = 'bg' AND name ILIKE 'harnesses';
UPDATE product_type_translations SET name = 'Каски' WHERE language_code = 'bg' AND name ILIKE 'helmets';
UPDATE product_type_translations SET name = 'Предпазни жилетки' WHERE language_code = 'bg' AND name ILIKE 'impact vests';
UPDATE product_type_translations SET name = 'Въжета' WHERE language_code = 'bg' AND name ILIKE 'leashes';
UPDATE product_type_translations SET name = 'Помпи' WHERE language_code = 'bg' AND name ILIKE 'pumps';
UPDATE product_type_translations SET name = 'Чанти' WHERE language_code = 'bg' AND name ILIKE 'bags';
UPDATE product_type_translations SET name = 'Подложки' WHERE language_code = 'bg' AND name ILIKE 'pads';
UPDATE product_type_translations SET name = 'Фойл пакети' WHERE language_code = 'bg' AND name ILIKE 'foil packages';

-- 8. Verify translations
SELECT 
  'Categories' as table_name,
  c.name as english_name,
  ct_bg.name as bulgarian_name,
  c.sport
FROM categories c
LEFT JOIN category_translations ct_bg ON ct_bg.category_id = c.id AND ct_bg.language_code = 'bg'
ORDER BY c.name
LIMIT 10;

SELECT 
  'Product Types' as table_name,
  pt.name as english_name,
  pt.menu_group,
  ptt_bg.name as bulgarian_name
FROM product_types pt
LEFT JOIN product_type_translations ptt_bg ON ptt_bg.product_type_id = pt.id AND ptt_bg.language_code = 'bg'
ORDER BY pt.menu_group, pt.name
LIMIT 20;

COMMIT;

-- ==============================================================================
-- NOTES:
-- 1. menu_group values are structural keys: 'gear', 'accessories', 'categories'
-- 2. Display labels for menu_group are translated in frontend dictionary
-- 3. Category names (sports) are translated via category_translations table
-- 4. Product type names are translated via product_type_translations table
-- 5. Slugs remain English-based for now (can be localized later if needed)
-- ==============================================================================

