-- ============================================================================
-- RIDE ENGINE BRAND COLLECTION
-- ============================================================================

-- Create Ride Engine brand as a collection
INSERT INTO "Collection" (id, title, "canonicalSlug", description, "heroImageUrl", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'Ride Engine',
  'ride-engine',
  'Official Ride Engine products - premium watersports equipment',
  NULL,
  NOW(),
  NOW()
)
ON CONFLICT ("canonicalSlug") DO NOTHING;
