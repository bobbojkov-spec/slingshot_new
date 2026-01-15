-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Count Ride Engine products
SELECT COUNT(*) as ride_engine_products FROM "Product"
WHERE "canonicalSlug" LIKE 'ride-engine-%';

-- Count by sport
SELECT sport, COUNT(*) as count FROM "Product"
WHERE "canonicalSlug" LIKE 'ride-engine-%'
GROUP BY sport ORDER BY count DESC;

-- Products with variants
SELECT p.title, COUNT(v.id) as variant_count
FROM "Product" p
LEFT JOIN "ProductVariant" v ON p.id = v."productId"
WHERE p."canonicalSlug" LIKE 'ride-engine-%'
GROUP BY p.id, p.title
ORDER BY variant_count DESC
LIMIT 10;