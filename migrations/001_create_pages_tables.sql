-- Pages Management System Schema
-- Migration: 001_create_pages_tables.sql

-- Main pages table
CREATE TABLE IF NOT EXISTS pages (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  show_header BOOLEAN DEFAULT FALSE,
  header_order INTEGER,
  show_dropdown BOOLEAN DEFAULT FALSE,
  dropdown_order INTEGER,
  footer_column INTEGER CHECK (footer_column IN (1, 2, 3)),
  footer_order INTEGER,
  "order" INTEGER,
  seo_title TEXT,
  seo_description TEXT,
  seo_keywords TEXT,
  og_title TEXT,
  og_description TEXT,
  og_image_id INTEGER,
  canonical_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Page blocks table for content sections
CREATE TABLE IF NOT EXISTS page_blocks (
  id SERIAL PRIMARY KEY,
  page_id INTEGER NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('HERO', 'TEXT', 'TEXT_IMAGE', 'GALLERY', 'YOUTUBE', 'FEATURED_PRODUCTS')),
  position INTEGER NOT NULL,
  data JSONB,
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Gallery images for GALLERY blocks
CREATE TABLE IF NOT EXISTS page_gallery_images (
  id SERIAL PRIMARY KEY,
  block_id INTEGER NOT NULL REFERENCES page_blocks(id) ON DELETE CASCADE,
  media_id INTEGER NOT NULL,
  position INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_pages_slug ON pages(slug);
CREATE INDEX IF NOT EXISTS idx_pages_status ON pages(status);
CREATE INDEX IF NOT EXISTS idx_pages_order ON pages("order");
CREATE INDEX IF NOT EXISTS idx_page_blocks_page_id ON page_blocks(page_id);
CREATE INDEX IF NOT EXISTS idx_page_blocks_position ON page_blocks(page_id, position);
CREATE INDEX IF NOT EXISTS idx_page_gallery_block_id ON page_gallery_images(block_id);
CREATE INDEX IF NOT EXISTS idx_page_gallery_position ON page_gallery_images(block_id, position);

-- Comments
COMMENT ON TABLE pages IS 'Custom pages with SEO and navigation settings';
COMMENT ON TABLE page_blocks IS 'Content blocks for pages (HERO, TEXT, etc.)';
COMMENT ON TABLE page_gallery_images IS 'Images for GALLERY type blocks';
