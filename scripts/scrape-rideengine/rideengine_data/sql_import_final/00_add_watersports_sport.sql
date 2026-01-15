-- ============================================================================
-- ADD WATERSPORTS SPORT TYPE
-- For brands like Ride Engine that span all water sports
-- Frontend should filter this out from sport-specific pages
-- ============================================================================

-- Add new value to Sport enum
ALTER TYPE "Sport" ADD VALUE IF NOT EXISTS 'WATERSPORTS';

-- Verify the enum
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = 'Sport'::regtype
ORDER BY enumlabel;

-- Expected values:
-- FOIL
-- KITE
-- SUP
-- WAKE
-- WATERSPORTS
-- WING
