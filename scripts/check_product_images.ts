
import { query } from '../lib/db';

const PRODUCT_ID = '1d64a74c-2de1-415a-972f-56a2e2b99806';

async function main() {
    console.log(`Checking images for product: ${PRODUCT_ID}`);

    try {
        // 1. Get counts by size
        const countRes = await query(`
            SELECT size, COUNT(*) as count 
            FROM product_images_railway 
            WHERE product_id = $1 
            GROUP BY size
        `, [PRODUCT_ID]);

        console.log('\n--- Image Counts by Size ---');
        console.table(countRes.rows);

        // 2. List all images to check for duplicates in paths or names
        const listRes = await query(`
            SELECT id, size, storage_path, display_order 
            FROM product_images_railway 
            WHERE product_id = $1 
            ORDER BY size, display_order
        `, [PRODUCT_ID]);

        console.log('\n--- Detailed Image List ---');
        console.table(listRes.rows.map(r => ({
            id: r.id,
            size: r.size,
            // truncating path for readability if too long
            path: r.storage_path.length > 80 ? '...' + r.storage_path.slice(-75) : r.storage_path,
            order: r.display_order
        })));

    } catch (e) {
        console.error(e);
    }
}

main();
