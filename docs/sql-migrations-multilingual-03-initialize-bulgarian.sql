-- ============================================================================
-- MULTILINGUAL DATABASE MIGRATION
-- Phase 3: Initialize Bulgarian (BG) Translations
-- ============================================================================

-- This script duplicates all English translations into Bulgarian as placeholders.
-- Bulgarian text will be identical to English initially, ready for AI translation.

BEGIN;

-- 1. Duplicate product translations EN → BG
INSERT INTO product_translations (
  product_id,
  language_code,
  title,
  description_html,
  description_html2,
  specs_html,
  package_includes,
  tags,
  seo_title,
  seo_description,
  meta_keywords,
  og_title,
  og_description,
  created_at,
  updated_at
)
SELECT 
  product_id,
  'bg' as language_code,
  title,
  description_html,
  description_html2,
  specs_html,
  package_includes,
  tags,
  seo_title,
  seo_description,
  meta_keywords,
  og_title,
  og_description,
  NOW() as created_at,
  NOW() as updated_at
FROM product_translations
WHERE language_code = 'en'
ON CONFLICT (product_id, language_code) DO NOTHING;

-- Verify product BG translations
SELECT 
  COUNT(*) as total_bg_products
FROM product_translations
WHERE language_code = 'bg';

-- 2. Duplicate category translations EN → BG (with BG-specific slugs)
INSERT INTO category_translations (
  category_id,
  language_code,
  name,
  slug,
  description,
  created_at,
  updated_at
)
SELECT 
  category_id,
  'bg' as language_code,
  name,
  slug || '-bg' as slug,  -- Make slug unique per language
  description,
  NOW() as created_at,
  NOW() as updated_at
FROM category_translations
WHERE language_code = 'en'
ON CONFLICT (category_id, language_code) DO NOTHING;

-- Verify category BG translations
SELECT 
  COUNT(*) as total_bg_categories
FROM category_translations
WHERE language_code = 'bg';

-- 3. Duplicate variant translations EN → BG
INSERT INTO product_variant_translations (
  variant_id,
  language_code,
  title,
  created_at,
  updated_at
)
SELECT 
  variant_id,
  'bg' as language_code,
  title,
  NOW() as created_at,
  NOW() as updated_at
FROM product_variant_translations
WHERE language_code = 'en'
ON CONFLICT (variant_id, language_code) DO NOTHING;

-- Verify variant BG translations
SELECT 
  COUNT(*) as total_bg_variants
FROM product_variant_translations
WHERE language_code = 'bg';

-- 4. Duplicate product type translations EN → BG (with BG-specific slugs)
INSERT INTO product_type_translations (
  product_type_id,
  language_code,
  name,
  slug,
  description,
  created_at,
  updated_at
)
SELECT 
  product_type_id,
  'bg' as language_code,
  name,
  slug || '-bg' as slug,  -- Make slug unique per language
  description,
  NOW() as created_at,
  NOW() as updated_at
FROM product_type_translations
WHERE language_code = 'en'
ON CONFLICT (product_type_id, language_code) DO NOTHING;

-- Verify product type BG translations
SELECT 
  COUNT(*) as total_bg_product_types
FROM product_type_translations
WHERE language_code = 'bg';

-- Final verification: Language coverage report
SELECT 
  'products' as entity,
  COUNT(CASE WHEN language_code = 'en' THEN 1 END) as english_count,
  COUNT(CASE WHEN language_code = 'bg' THEN 1 END) as bulgarian_count,
  ROUND(100.0 * COUNT(CASE WHEN language_code = 'bg' THEN 1 END) / 
        NULLIF(COUNT(CASE WHEN language_code = 'en' THEN 1 END), 0), 2) as bg_coverage_pct
FROM product_translations

UNION ALL

SELECT 
  'categories' as entity,
  COUNT(CASE WHEN language_code = 'en' THEN 1 END),
  COUNT(CASE WHEN language_code = 'bg' THEN 1 END),
  ROUND(100.0 * COUNT(CASE WHEN language_code = 'bg' THEN 1 END) / 
        NULLIF(COUNT(CASE WHEN language_code = 'en' THEN 1 END), 0), 2)
FROM category_translations

UNION ALL

SELECT 
  'variants' as entity,
  COUNT(CASE WHEN language_code = 'en' THEN 1 END),
  COUNT(CASE WHEN language_code = 'bg' THEN 1 END),
  ROUND(100.0 * COUNT(CASE WHEN language_code = 'bg' THEN 1 END) / 
        NULLIF(COUNT(CASE WHEN language_code = 'en' THEN 1 END), 0), 2)
FROM product_variant_translations

UNION ALL

SELECT 
  'product_types' as entity,
  COUNT(CASE WHEN language_code = 'en' THEN 1 END),
  COUNT(CASE WHEN language_code = 'bg' THEN 1 END),
  ROUND(100.0 * COUNT(CASE WHEN language_code = 'bg' THEN 1 END) / 
        NULLIF(COUNT(CASE WHEN language_code = 'en' THEN 1 END), 0), 2)
FROM product_type_translations;

COMMIT;

-- Expected result: 100% BG coverage (matching EN count)

-- Sample query to see side-by-side comparison
SELECT 
  p.id,
  en.title as english_title,
  bg.title as bulgarian_title,
  en.language_code as en_lang,
  bg.language_code as bg_lang
FROM products p
LEFT JOIN product_translations en ON en.product_id = p.id AND en.language_code = 'en'
LEFT JOIN product_translations bg ON bg.product_id = p.id AND bg.language_code = 'bg'
LIMIT 10;

