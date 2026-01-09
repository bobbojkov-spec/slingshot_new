import { query } from '../lib/db';
import * as dotenv from 'dotenv';
dotenv.config();

async function checkCounts() {
    try {
        // 1. Get all categories
        const cats = await query(`SELECT slug, name FROM categories WHERE status = 'active'`);
        console.log(`Found ${cats.rows.length} active categories.`);

        for (const cat of cats.rows) {
            // 2. Count products for each
            const countRes = await query(`
        SELECT COUNT(*) as total 
        FROM products p 
        JOIN categories c ON p.category_id = c.id 
        WHERE c.slug = $1 AND p.status = 'active'
      `, [cat.slug]);

            const count = countRes.rows[0].total;
            console.log(`Category: ${cat.name} (slug: ${cat.slug}) -> ${count} products`);

            if (parseInt(count) === 0) {
                console.error(`❌ ZERO PRODUCTS for ${cat.slug}! This will result in specific filters returning nothing.`);
            } else {
                console.log(`✅ OK`);
            }
        }

    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}
checkCounts();
