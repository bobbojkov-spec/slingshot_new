-- Ride Engine Brand Collection
-- All products will be linked to this brand

-- ============================================================================
-- RIDE ENGINE BRAND COLLECTION
-- All Ride Engine products will be linked to this collection
-- ============================================================================

-- Create Ride Engine Brand Collection
INSERT INTO "Collection" (id, title, "canonicalSlug", description, "heroImageUrl", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'Ride Engine',
  'ride-engine',
  'Ride Engine - Premium watersports apparel, harnesses, wetsuits, and accessories',
  NULL,
  NOW(),
  NOW()
)
ON CONFLICT ("canonicalSlug") DO NOTHING;
