-- Migration: Add sport column to menu_groups for Slingshot mega menu structure
-- This allows each sport (Kite, WAKE, Wing, Foil) to have its own menu groups

-- 1. Add sport column to menu_groups table
ALTER TABLE menu_groups 
ADD COLUMN IF NOT EXISTS sport VARCHAR(50);

-- 2. Add index for efficient querying by source + sport
CREATE INDEX IF NOT EXISTS idx_menu_groups_source_sport 
ON menu_groups(source, sport);

-- 3. Add comment explaining the column
COMMENT ON COLUMN menu_groups.sport IS 'Sport category for Slingshot: kite, wake, wing, foil. NULL for Ride Engine or legacy groups.';

-- 4. Update existing Slingshot menu groups to default to 'kite' (or keep NULL for backward compatibility)
-- This is optional - you may want to manually assign sports after migration
-- UPDATE menu_groups SET sport = 'kite' WHERE source = 'slingshot' AND sport IS NULL;

-- 5. Create a view for easy menu structure retrieval
CREATE OR REPLACE VIEW menu_groups_by_sport AS
SELECT 
    mg.*,
    COALESCE(mg.sport, 'all') as sport_normalized,
    (SELECT COUNT(*)::int FROM menu_group_collections mgc WHERE mgc.menu_group_id = mg.id) as collection_count
FROM menu_groups mg
ORDER BY mg.source, mg.sport, mg.sort_order, mg.title;

-- Note: After migration, use the admin UI to:
-- 1. Create menu groups for each sport (kite, wake, wing, foil)
-- 2. Assign collections to the appropriate sport-specific menu groups
-- 3. Update navigation to fetch menu structure by sport
