-- Ride Engine Collection
-- Compatible with Prisma schema

-- Create Ride Engine Brand Collection
INSERT INTO "Collection" (id, title, "canonicalSlug", description, "heroImageUrl", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'Ride Engine',
  'ride-engine',
  'Premium watersports equipment from Ride Engine',
  NULL,
  NOW(),
  NOW()
)
ON CONFLICT ("canonicalSlug") DO NOTHING;
