
require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
    try {
        console.log("Populating Featured & Best Sellers with mixed products...");

        const collections = ['featured-products', 'best-sellers'];

        for (const slug of collections) {
            // Get Collection ID
            const cRes = await pool.query(`SELECT id FROM collections WHERE slug = $1`, [slug]);
            if (cRes.rows.length === 0) {
                console.log(`Collection ${slug} not found!`);
                continue;
            }
            const collectionId = cRes.rows[0].id;

            // Clear existing
            await pool.query(`DELETE FROM collection_products WHERE collection_id = $1`, [collectionId]);

            // Select 4 Slingshot Products
            const ssRes = await pool.query(`SELECT id FROM products WHERE brand = 'Slingshot' AND status='active' ORDER BY RANDOM() LIMIT 4`);

            // Select 4 Ride Engine Products
            const reRes = await pool.query(`SELECT id FROM products WHERE brand = 'Ride Engine' AND status='active' ORDER BY RANDOM() LIMIT 4`);

            const productIds = [...ssRes.rows.map(r => r.id), ...reRes.rows.map(r => r.id)];

            // Insert
            for (const pid of productIds) {
                await pool.query(`INSERT INTO collection_products (collection_id, product_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [collectionId, pid]);
            }
            console.log(`Populated ${slug} with ${productIds.length} mixed products.`);
        }

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
run();
