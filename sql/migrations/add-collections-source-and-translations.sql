-- Add source column to collections table and create translations table
-- This enables Slingshot and Ride Engine collections with multilingual support

-- 1. Add source column to existing collections table
ALTER TABLE collections 
ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'legacy';

-- 2. Add subtitle column for collection descriptions
ALTER TABLE collections
ADD COLUMN IF NOT EXISTS subtitle TEXT;

-- 3. Add slug column if not exists (for URL-friendly identifiers)
ALTER TABLE collections
ADD COLUMN IF NOT EXISTS slug VARCHAR(255);

-- 4. Create unique constraint on source + slug
CREATE UNIQUE INDEX IF NOT EXISTS idx_collections_source_slug 
ON collections(source, slug) WHERE slug IS NOT NULL;

-- 5. Add sort_order and visible columns if they don't exist
ALTER TABLE collections
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

ALTER TABLE collections
ADD COLUMN IF NOT EXISTS visible BOOLEAN DEFAULT true;

-- 6. Rename description column to subtitle in existing collection_translations table
ALTER TABLE collection_translations
RENAME COLUMN description TO subtitle;

-- Note: The table already exists with: id, collection_id, language_code, title, description, slug, created_at, updated_at
-- We're renaming description->subtitle to match our design

-- 7. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_collections_source ON collections(source);
CREATE INDEX IF NOT EXISTS idx_collections_visible ON collections(visible, sort_order);
CREATE INDEX IF NOT EXISTS idx_collections_slug ON collections(slug);
CREATE INDEX IF NOT EXISTS idx_collection_translations_collection ON collection_translations(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_translations_language ON collection_translations(language_code);

-- 8. Add updated_at trigger for collection_translations
CREATE OR REPLACE FUNCTION update_collection_translations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_collection_translations_updated_at ON collection_translations;
CREATE TRIGGER trigger_collection_translations_updated_at
BEFORE UPDATE ON collection_translations
FOR EACH ROW
EXECUTE FUNCTION update_collection_translations_updated_at();

-- 9. Backfill existing collections with English translations
INSERT INTO collection_translations (collection_id, language_code, title, subtitle)
SELECT 
  id,
  'en' as language_code,
  title,
  COALESCE(description, subtitle) as subtitle
FROM collections
WHERE id NOT IN (
  SELECT collection_id FROM collection_translations WHERE language_code = 'en'
)
AND title IS NOT NULL;

-- 10. Create Bulgarian translations as copies of English (to be edited later)
INSERT INTO collection_translations (collection_id, language_code, title, subtitle)
SELECT 
  ct.collection_id,
  'bg' as language_code,
  ct.title,
  ct.subtitle
FROM collection_translations ct
WHERE ct.language_code = 'en'
AND ct.collection_id NOT IN (
  SELECT collection_id FROM collection_translations WHERE language_code = 'bg'
);

COMMENT ON COLUMN collections.source IS 'Source of collection: slingshot, rideengine, or legacy';
COMMENT ON COLUMN collections.slug IS 'URL-friendly identifier from source website';
COMMENT ON COLUMN collections.subtitle IS 'Short description or tagline';
COMMENT ON TABLE collection_translations IS 'Multilingual titles and subtitles for collections';
