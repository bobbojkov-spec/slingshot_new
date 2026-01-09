import { query } from '../lib/db';
import * as dotenv from 'dotenv';
dotenv.config();

async function checkImages() {
    const slug = 'dwarf-craft-v4'; // Hardcoded for debugging based on user report
    try {
        // 1. Get Product ID
        const pRes = await query(`SELECT id, name FROM products WHERE slug = $1`, [slug]);
        if (pRes.rows.length === 0) {
            console.log(`Product ${slug} not found`);
            return;
        }
        const product = pRes.rows[0];
        console.log(`Product: ${product.name} (${product.id})`);

        // 2. Get Images
        const iRes = await query(`
      SELECT id, bundle_id, size, display_order, storage_path 
      FROM product_images_railway 
      WHERE product_id = $1 
      ORDER BY display_order ASC, size ASC
    `, [product.id]);

        console.table(iRes.rows);

    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}
checkImages();
