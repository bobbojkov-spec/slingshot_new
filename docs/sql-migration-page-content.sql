-- Add content fields and simple footer boolean to Pages table

ALTER TABLE pages ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE pages ADD COLUMN IF NOT EXISTS content_bg TEXT;
ALTER TABLE pages ADD COLUMN IF NOT EXISTS show_footer BOOLEAN DEFAULT FALSE;
