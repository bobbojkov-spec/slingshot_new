-- ============================================================================
-- MULTILINGUAL DATABASE MIGRATION
-- Phase 1: Create Translation Infrastructure
-- ============================================================================

-- 1. Create languages registry
CREATE TABLE IF NOT EXISTS languages (
  code VARCHAR(2) PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  native_name VARCHAR(50),
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Seed languages
INSERT INTO languages (code, name, native_name, is_default, is_active, sort_order) VALUES
  ('en', 'English', 'English', true, true, 1),
  ('bg', 'Bulgarian', 'Български', false, true, 2)
ON CONFLICT (code) DO NOTHING;

-- 2. Create product_translations table
CREATE TABLE IF NOT EXISTS product_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  language_code VARCHAR(2) NOT NULL REFERENCES languages(code),
  
  -- Translatable content
  title TEXT,
  description_html TEXT,
  description_html2 TEXT,
  specs_html TEXT,
  package_includes TEXT,
  tags TEXT[],
  
  -- SEO fields (language-specific)
  seo_title TEXT,
  seo_description TEXT,
  meta_keywords TEXT,
  og_title TEXT,
  og_description TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(product_id, language_code)
);

CREATE INDEX IF NOT EXISTS idx_product_translations_product_id ON product_translations(product_id);
CREATE INDEX IF NOT EXISTS idx_product_translations_language ON product_translations(language_code);
CREATE INDEX IF NOT EXISTS idx_product_translations_lookup ON product_translations(product_id, language_code);

-- 3. Create category_translations table
CREATE TABLE IF NOT EXISTS category_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  language_code VARCHAR(2) NOT NULL REFERENCES languages(code),
  
  -- Translatable content
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(category_id, language_code),
  UNIQUE(language_code, slug)
);

CREATE INDEX IF NOT EXISTS idx_category_translations_category_id ON category_translations(category_id);
CREATE INDEX IF NOT EXISTS idx_category_translations_language ON category_translations(language_code);
CREATE INDEX IF NOT EXISTS idx_category_translations_slug ON category_translations(language_code, slug);

-- 4. Create product_variant_translations table
CREATE TABLE IF NOT EXISTS product_variant_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  language_code VARCHAR(2) NOT NULL REFERENCES languages(code),
  
  -- Translatable content
  title TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(variant_id, language_code)
);

CREATE INDEX IF NOT EXISTS idx_variant_translations_variant_id ON product_variant_translations(variant_id);
CREATE INDEX IF NOT EXISTS idx_variant_translations_language ON product_variant_translations(language_code);

-- 5. Create product_type_translations table
CREATE TABLE IF NOT EXISTS product_type_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_type_id UUID NOT NULL REFERENCES product_types(id) ON DELETE CASCADE,
  language_code VARCHAR(2) NOT NULL REFERENCES languages(code),
  
  -- Translatable content
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(product_type_id, language_code),
  UNIQUE(language_code, slug)
);

CREATE INDEX IF NOT EXISTS idx_product_type_translations_type_id ON product_type_translations(product_type_id);
CREATE INDEX IF NOT EXISTS idx_product_type_translations_language ON product_type_translations(language_code);

-- Verify tables created
SELECT 
  tablename, 
  schemaname
FROM pg_tables 
WHERE tablename LIKE '%translation%' 
ORDER BY tablename;

-- Verify indexes
SELECT 
  indexname,
  tablename
FROM pg_indexes
WHERE indexname LIKE '%translation%'
ORDER BY tablename, indexname;

COMMIT;

