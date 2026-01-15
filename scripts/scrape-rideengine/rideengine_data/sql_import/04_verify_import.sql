-- ============================================================================
-- IMPORT VERIFICATION
-- ============================================================================

-- Count Ride Engine products
SELECT COUNT(*) as ride_engine_products
FROM products
WHERE canonical_slug LIKE 'ride-engine-%';

-- Count categories
SELECT COUNT(*) as total_categories FROM categories;

-- Products by category
SELECT c.name, COUNT(pc.product_id) as product_count
FROM categories c
LEFT JOIN product_categories pc ON c.id = pc.category_id
GROUP BY c.id, c.name
ORDER BY product_count DESC
LIMIT 20;