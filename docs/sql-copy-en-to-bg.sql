-- ============================================================================
-- COPY ENGLISH TRANSLATIONS TO BULGARIAN (1:1 PLACEHOLDER)
-- ============================================================================
-- This script copies all English translations to Bulgarian where BG is empty
-- This creates placeholder Bulgarian content that can be AI-translated later
-- ============================================================================

-- 1. Update existing Bulgarian translations with English content (where BG is empty)
UPDATE product_translations pt_bg
SET 
  title = pt_en.title,
  description_html = pt_en.description_html,
  description_html2 = pt_en.description_html2,
  specs_html = pt_en.specs_html,
  package_includes = pt_en.package_includes,
  tags = pt_en.tags,
  seo_title = pt_en.seo_title,
  seo_description = pt_en.seo_description,
  updated_at = NOW()
FROM product_translations pt_en
WHERE pt_bg.product_id = pt_en.product_id
  AND pt_bg.language_code = 'bg'
  AND pt_en.language_code = 'en'
  AND (
    pt_bg.title IS NULL OR pt_bg.title = '' OR
    pt_bg.description_html IS NULL OR pt_bg.description_html = '' OR
    pt_bg.description_html2 IS NULL OR pt_bg.description_html2 = ''
  );

-- 2. Insert Bulgarian translations for products that don't have them yet
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
  created_at,
  updated_at
)
SELECT 
  pt_en.product_id,
  'bg' as language_code,
  pt_en.title,
  pt_en.description_html,
  pt_en.description_html2,
  pt_en.specs_html,
  pt_en.package_includes,
  pt_en.tags,
  pt_en.seo_title,
  pt_en.seo_description,
  NOW() as created_at,
  NOW() as updated_at
FROM product_translations pt_en
WHERE pt_en.language_code = 'en'
  AND NOT EXISTS (
    SELECT 1 
    FROM product_translations pt_bg 
    WHERE pt_bg.product_id = pt_en.product_id 
      AND pt_bg.language_code = 'bg'
  );

-- 3. Show results
SELECT 
  COUNT(*) as total_products_with_translations,
  COUNT(CASE WHEN language_code = 'en' THEN 1 END) as english_translations,
  COUNT(CASE WHEN language_code = 'bg' THEN 1 END) as bulgarian_translations
FROM product_translations;

-- 4. Show sample of copied data
SELECT 
  p.title as product_name,
  pt_en.title as english_title,
  pt_bg.title as bulgarian_title,
  LENGTH(pt_en.description_html) as en_desc_length,
  LENGTH(pt_bg.description_html) as bg_desc_length
FROM products p
LEFT JOIN product_translations pt_en ON p.id = pt_en.product_id AND pt_en.language_code = 'en'
LEFT JOIN product_translations pt_bg ON p.id = pt_bg.product_id AND pt_bg.language_code = 'bg'
LIMIT 10;

