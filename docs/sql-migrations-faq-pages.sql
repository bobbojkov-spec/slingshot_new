-- 1. Add bilingual title to Pages
-- PostgreSQL does not support "AFTER column_name", columns are added at the end.
ALTER TABLE pages ADD COLUMN IF NOT EXISTS title_bg VARCHAR(255) DEFAULT NULL;

-- 2. Create FAQ Items Table (The Pool)
-- Used SERIAL instead of AUTO_INCREMENT
CREATE TABLE IF NOT EXISTS faq_items (
    id SERIAL PRIMARY KEY,
    question_en TEXT NOT NULL,
    question_bg TEXT,
    answer_en TEXT NOT NULL,
    answer_bg TEXT,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Seed Initial Pages
-- Used ON CONFLICT (slug) instead of ON DUPLICATE KEY UPDATE.
-- Assumes 'slug' has a unique constraint.
INSERT INTO pages (slug, title, title_bg, status, show_header, show_footer, footer_column, footer_order) VALUES
('about-us', 'About Us', 'За нас', 'published', true, true, 1, 10),
('contact', 'Contact', 'Контакт', 'published', true, true, 1, 20),
('faq', 'FAQ', 'Често задавани въпроси', 'published', true, true, 1, 30),
('gdpr', 'GDPR', 'Лични данни (GDPR)', 'published', false, true, 1, 40)
ON CONFLICT (slug) DO UPDATE SET
title_bg = EXCLUDED.title_bg,
status = EXCLUDED.status,
show_footer = EXCLUDED.show_footer,
footer_column = EXCLUDED.footer_column;
