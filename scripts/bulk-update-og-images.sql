-- Bulk update: Set og_image_url to the first product image for all products
UPDATE products p
SET og_image_url = first_img.url,
    updated_at = NOW()
FROM (
  SELECT DISTINCT ON (product_id) 
    product_id, 
    url
  FROM product_images
  ORDER BY product_id, COALESCE(position, sort_order, 9999), id
) AS first_img
WHERE p.id = first_img.product_id
  AND (p.og_image_url IS NULL OR p.og_image_url = '');

-- Show results
SELECT 
  COUNT(*) as total_updated,
  COUNT(CASE WHEN og_image_url LIKE '%supabase%' THEN 1 END) as supabase_images,
  COUNT(CASE WHEN og_image_url LIKE '%shopify%' THEN 1 END) as shopify_images
FROM products
WHERE og_image_url IS NOT NULL;

