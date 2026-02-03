-- Migration: Add homepage featured sections tables
-- Created: 2024-02-03

-- Table for featured collections on homepage "Shop by Categories" section
CREATE TABLE IF NOT EXISTS homepage_featured_collections (
    id SERIAL PRIMARY KEY,
    collection_id UUID NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(collection_id)
);

-- Add foreign key if collections table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'collections') THEN
        ALTER TABLE homepage_featured_collections
        ADD CONSTRAINT fk_homepage_featured_collections_collection
        FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE;
    END IF;
EXCEPTION WHEN duplicate_object THEN
    NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_homepage_featured_collections_order
ON homepage_featured_collections(sort_order ASC);

-- Table for featured keywords on homepage "Shop by Keywords" section
CREATE TABLE IF NOT EXISTS homepage_featured_keywords (
    id SERIAL PRIMARY KEY,
    tag_name_en TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tag_name_en)
);

CREATE INDEX IF NOT EXISTS idx_homepage_featured_keywords_order
ON homepage_featured_keywords(sort_order ASC);

-- Success message
SELECT 'Homepage featured sections tables created successfully' AS status;
