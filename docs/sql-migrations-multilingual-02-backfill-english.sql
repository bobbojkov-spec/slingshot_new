-- ============================================================================
-- MULTILINGUAL DATABASE MIGRATION
-- Phase 2: Backfill English (EN) Translations
-- ============================================================================

-- This script copies existing English content from main tables into translation tables
-- with language_code='en'. Original columns remain untouched for backward compatibility.

BEGIN;

-- 1. Backfill product_translations with English content
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
  id as product_id,
  'en' as language_code,
  COALESCE(title, name) as title,
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
FROM products
ON CONFLICT (product_id, language_code) DO UPDATE SET
  title = EXCLUDED.title,
  description_html = EXCLUDED.description_html,
  description_html2 = EXCLUDED.description_html2,
  specs_html = EXCLUDED.specs_html,
  package_includes = EXCLUDED.package_includes,
  tags = EXCLUDED.tags,
  seo_title = EXCLUDED.seo_title,
  seo_description = EXCLUDED.seo_description,
  meta_keywords = EXCLUDED.meta_keywords,
  og_title = EXCLUDED.og_title,
  og_description = EXCLUDED.og_description,
  updated_at = NOW();

-- Check product translations
SELECT 
  COUNT(*) as total_products,
  COUNT(CASE WHEN language_code = 'en' THEN 1 END) as english_translations
FROM product_translations;

-- 2. Backfill category_translations with English content
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
  id as category_id,
  'en' as language_code,
  name,
  slug,
  description,
  created_at,
  updated_at
FROM categories
ON CONFLICT (category_id, language_code) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  updated_at = NOW();

-- Check category translations
SELECT 
  COUNT(*) as total_categories,
  COUNT(CASE WHEN language_code = 'en' THEN 1 END) as english_translations
FROM category_translations;

-- 3. Backfill product_variant_translations with English content
INSERT INTO product_variant_translations (
  variant_id,
  language_code,
  title,
  created_at,
  updated_at
)
SELECT 
  id as variant_id,
  'en' as language_code,
  title,
  created_at,
  updated_at
FROM product_variants
WHERE title IS NOT NULL
ON CONFLICT (variant_id, language_code) DO UPDATE SET
  title = EXCLUDED.title,
  updated_at = NOW();

-- Check variant translations
SELECT 
  COUNT(*) as total_variants,
  COUNT(CASE WHEN language_code = 'en' THEN 1 END) as english_translations
FROM product_variant_translations;

-- 4. Backfill product_type_translations with English content
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
  id as product_type_id,
  'en' as language_code,
  name,
  slug,
  description,
  created_at,
  updated_at
FROM product_types
ON CONFLICT (product_type_id, language_code) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  updated_at = NOW();

-- Check product type translations
SELECT 
  COUNT(*) as total_types,
  COUNT(CASE WHEN language_code = 'en' THEN 1 END) as english_translations
FROM product_type_translations;

-- Final verification: Translation coverage report
SELECT 
  'products' as entity,
  COUNT(DISTINCT p.id) as total_records,
  COUNT(DISTINCT pt.product_id) as has_english,
  ROUND(100.0 * COUNT(DISTINCT pt.product_id) / NULLIF(COUNT(DISTINCT p.id), 0), 2) as coverage_pct
FROM products p
LEFT JOIN product_translations pt ON pt.product_id = p.id AND pt.language_code = 'en'

UNION ALL

SELECT 
  'categories' as entity,
  COUNT(DISTINCT c.id),
  COUNT(DISTINCT ct.category_id),
  ROUND(100.0 * COUNT(DISTINCT ct.category_id) / NULLIF(COUNT(DISTINCT c.id), 0), 2)
FROM categories c
LEFT JOIN category_translations ct ON ct.category_id = c.id AND ct.language_code = 'en'

UNION ALL

SELECT 
  'variants' as entity,
  COUNT(DISTINCT v.id),
  COUNT(DISTINCT vt.variant_id),
  ROUND(100.0 * COUNT(DISTINCT vt.variant_id) / NULLIF(COUNT(DISTINCT v.id), 0), 2)
FROM product_variants v
LEFT JOIN product_variant_translations vt ON vt.variant_id = v.id AND vt.language_code = 'en'

UNION ALL

SELECT 
  'product_types' as entity,
  COUNT(DISTINCT pt.id),
  COUNT(DISTINCT ptt.product_type_id),
  ROUND(100.0 * COUNT(DISTINCT ptt.product_type_id) / NULLIF(COUNT(DISTINCT pt.id), 0), 2)
FROM product_types pt
LEFT JOIN product_type_translations ptt ON ptt.product_type_id = pt.id AND ptt.language_code = 'en';

COMMIT;

-- Expected result: 100% coverage for all entities

