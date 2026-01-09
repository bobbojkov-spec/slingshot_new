
import 'dotenv/config';
import { query } from '../lib/db';

async function fixOgImages() {
    console.log('Fixing OG images...');
    const res = await query(`
    UPDATE products p
    SET og_image_url = (
        SELECT url FROM product_images pi 
        WHERE pi.product_id = p.id 
        ORDER BY sort_order ASC, position ASC 
        LIMIT 1
    )
    WHERE (og_image_url LIKE '%supabase%' OR og_image_url IS NULL)
    AND EXISTS (
        SELECT 1 FROM product_images pi 
        WHERE pi.product_id = p.id
    )
    RETURNING id, og_image_url;
  `);
    console.log(`Updated ${res.rowCount} products with new OG images from Railway.`);
    process.exit(0);
}

fixOgImages();
