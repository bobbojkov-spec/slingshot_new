import { query } from '../lib/db';
import * as dotenv from 'dotenv';
dotenv.config();

async function checkImages() {
    try {
        console.log('--- Checking Product Images ---');

        // 1. Check product_images_railway (Source of Truth)
        const res = await query(`
      SELECT product_id, storage_path 
      FROM product_images_railway 
      LIMIT 5
    `);
        console.log('Table: product_images_railway');
        console.table(res.rows);

        // 2. Check products table (og_image_url fallback)
        const resProducts = await query(`
      SELECT slug, og_image_url
      FROM products
      LIMIT 5
    `);
        console.log('Table: products (og_image_url)');
        console.table(resProducts.rows);

    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}
checkImages();
