
import { query } from '../lib/db';

async function main() {
    console.log('Checking for localhost URLs...');

    const products = await query(`
    SELECT id, name, og_image_url 
    FROM products 
    WHERE og_image_url IS NOT NULL
    LIMIT 5
  `, []);

    const collections = await query(`
    SELECT id, title, image_url 
    FROM collections 
    WHERE image_url IS NOT NULL
    LIMIT 5
  `, []);

    console.log(`Found ${products.rows.length} products with localhost images.`);
    if (products.rows.length > 0) {
        console.log('Sample Product:', products.rows[0]);
    }

    console.log(`Found ${collections.rows.length} collections with localhost images.`);
    if (collections.rows.length > 0) {
        console.log('Sample Collection:', collections.rows[0]);
    }
}

main().catch(console.error);
