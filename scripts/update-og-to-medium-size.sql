-- Update all og_image_url from /original/ to /medium/ for better OG image size
UPDATE products
SET og_image_url = REPLACE(og_image_url, '/original/', '/medium/'),
    updated_at = NOW()
WHERE og_image_url LIKE '%/original/%';

-- Show results
SELECT 
  COUNT(*) as total_products_with_og,
  COUNT(CASE WHEN og_image_url LIKE '%/medium/%' THEN 1 END) as using_medium,
  COUNT(CASE WHEN og_image_url LIKE '%/original/%' THEN 1 END) as using_original
FROM products
WHERE og_image_url IS NOT NULL;

