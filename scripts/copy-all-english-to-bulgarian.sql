-- First, migrate existing data from legacy columns to English translations

-- 1. Categories: Copy from categories.name/description to category_translations (EN)
INSERT INTO category_translations (category_id, language_code, name, description, created_at, updated_at)
SELECT 
  c.id,
  'en' as language_code,
  c.name,
  c.description,
  NOW(),
  NOW()
FROM categories c
WHERE c.name IS NOT NULL
ON CONFLICT (category_id, language_code) DO UPDATE SET
  name = COALESCE(NULLIF(category_translations.name, ''), EXCLUDED.name),
  description = COALESCE(NULLIF(category_translations.description, ''), EXCLUDED.description),
  updated_at = NOW();

-- 2. Product Types: Copy from product_types.name to product_type_translations (EN)
INSERT INTO product_type_translations (product_type_id, language_code, name, description, created_at, updated_at)
SELECT 
  pt.id,
  'en' as language_code,
  pt.name,
  NULL, -- no description in legacy table
  NOW(),
  NOW()
FROM product_types pt
WHERE pt.name IS NOT NULL
ON CONFLICT (product_type_id, language_code) DO UPDATE SET
  name = COALESCE(NULLIF(product_type_translations.name, ''), EXCLUDED.name),
  updated_at = NOW();

-- 3. Variants: Copy from product_variants.title to product_variant_translations (EN)
INSERT INTO product_variant_translations (variant_id, language_code, title, created_at, updated_at)
SELECT 
  pv.id,
  'en' as language_code,
  pv.title,
  NOW(),
  NOW()
FROM product_variants pv
WHERE pv.title IS NOT NULL
ON CONFLICT (variant_id, language_code) DO UPDATE SET
  title = COALESCE(NULLIF(product_variant_translations.title, ''), EXCLUDED.title),
  updated_at = NOW();

-- Now copy all English to Bulgarian
INSERT INTO category_translations (category_id, language_code, name, description, created_at, updated_at)
SELECT 
  ct_en.category_id,
  'bg' as language_code,
  ct_en.name,
  ct_en.description,
  NOW(),
  NOW()
FROM category_translations ct_en
WHERE ct_en.language_code = 'en'
ON CONFLICT (category_id, language_code) DO UPDATE SET
  name = COALESCE(NULLIF(category_translations.name, ''), EXCLUDED.name),
  description = COALESCE(NULLIF(category_translations.description, ''), EXCLUDED.description),
  updated_at = NOW();

INSERT INTO product_type_translations (product_type_id, language_code, name, description, created_at, updated_at)
SELECT 
  ptt_en.product_type_id,
  'bg' as language_code,
  ptt_en.name,
  ptt_en.description,
  NOW(),
  NOW()
FROM product_type_translations ptt_en
WHERE ptt_en.language_code = 'en'
ON CONFLICT (product_type_id, language_code) DO UPDATE SET
  name = COALESCE(NULLIF(product_type_translations.name, ''), EXCLUDED.name),
  description = COALESCE(NULLIF(product_type_translations.description, ''), EXCLUDED.description),
  updated_at = NOW();

INSERT INTO product_variant_translations (variant_id, language_code, title, created_at, updated_at)
SELECT 
  pvt_en.variant_id,
  'bg' as language_code,
  pvt_en.title,
  NOW(),
  NOW()
FROM product_variant_translations pvt_en
WHERE pvt_en.language_code = 'en'
ON CONFLICT (variant_id, language_code) DO UPDATE SET
  title = COALESCE(NULLIF(product_variant_translations.title, ''), EXCLUDED.title),
  updated_at = NOW();

-- Show statistics
SELECT 
  'Categories' as entity,
  COUNT(CASE WHEN language_code = 'en' THEN 1 END) as english_count,
  COUNT(CASE WHEN language_code = 'bg' THEN 1 END) as bulgarian_count
FROM category_translations
UNION ALL
SELECT 
  'Product Types',
  COUNT(CASE WHEN language_code = 'en' THEN 1 END),
  COUNT(CASE WHEN language_code = 'bg' THEN 1 END)
FROM product_type_translations
UNION ALL
SELECT 
  'Product Variants',
  COUNT(CASE WHEN language_code = 'en' THEN 1 END),
  COUNT(CASE WHEN language_code = 'bg' THEN 1 END)
FROM product_variant_translations
UNION ALL
SELECT 
  'Products',
  COUNT(CASE WHEN language_code = 'en' THEN 1 END),
  COUNT(CASE WHEN language_code = 'bg' THEN 1 END)
FROM product_translations;
