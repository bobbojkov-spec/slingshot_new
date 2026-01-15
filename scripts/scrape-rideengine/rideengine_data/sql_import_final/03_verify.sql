-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Count Ride Engine products
SELECT COUNT(*) as total_ride_engine_products FROM "Product"
WHERE "canonicalSlug" LIKE 'ride-engine-%';

-- Products by type
SELECT "productType", COUNT(*) as count FROM "Product"
WHERE "canonicalSlug" LIKE 'ride-engine-%'
GROUP BY "productType" ORDER BY count DESC;

-- Ride Engine brand collection
SELECT c.title, COUNT(cp."productId") as product_count
FROM "Collection" c
LEFT JOIN "CollectionProduct" cp ON c.id = cp."collectionId"
WHERE c."canonicalSlug" = 'ride-engine'
GROUP BY c.id, c.title;

-- Products with variants
SELECT p.title, COUNT(v.id) as variant_count
FROM "Product" p
LEFT JOIN "ProductVariant" v ON p.id = v."productId"
WHERE p."canonicalSlug" LIKE 'ride-engine-%'
GROUP BY p.id, p.title
ORDER BY variant_count DESC
LIMIT 10;