
require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

const RAW_COLLECTIONS_DIR = path.join(__dirname, 'scrape-rideengine/rideengine_data/raw/collections');

async function importCollections() {
    const client = await pool.connect();
    try {
        const files = fs.readdirSync(RAW_COLLECTIONS_DIR).filter(f => f.endsWith('.json'));
        console.log(`Found ${files.length} collection files.`);

        for (const file of files) {
            const filePath = path.join(RAW_COLLECTIONS_DIR, file);
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

            console.log(`Processing collection: ${data.handle} (${data.title || data.handle})`);

            try {
                await client.query('BEGIN');

                // 1. Upsert Collection
                // Note: JSON might not have a clean "title" field if it was raw shopify data, 
                // but looking at "wing-foil-harnesses.json" I didn't see a top-level title, only handle.
                // I will use formatTitle(handle) if title is missing.
                const title = data.title || formatTitle(data.handle);

                const insertCollectionRes = await client.query(`
          INSERT INTO collections (title, handle, description, created_at, updated_at)
          VALUES ($1, $2, $3, NOW(), NOW())
          ON CONFLICT (handle) DO UPDATE 
          SET title = EXCLUDED.title, 
              updated_at = NOW()
          RETURNING id;
        `, [title, data.handle, data.description || '']);

                const collectionId = insertCollectionRes.rows[0].id;

                // 2. Link Products
                if (data.products && data.products.length > 0) {
                    let sortOrder = 0;
                    for (const prodData of data.products) {
                        // Determine our DB slug
                        const dbSlug = `ride-engine-${prodData.handle}`;

                        // Find product ID
                        const prodRes = await client.query(`SELECT id FROM products WHERE slug = $1`, [dbSlug]);

                        if (prodRes.rows.length > 0) {
                            const productId = prodRes.rows[0].id;

                            // Insert link
                            await client.query(`
                        INSERT INTO collection_products (collection_id, product_id, sort_order)
                        VALUES ($1, $2, $3)
                        ON CONFLICT (collection_id, product_id) DO UPDATE
                        SET sort_order = EXCLUDED.sort_order;
                    `, [collectionId, productId, sortOrder++]);
                        } else {
                            console.warn(`  [WARN] Product not found in DB: ${dbSlug} (Original: ${prodData.handle})`);
                        }
                    }
                }

                await client.query('COMMIT');
                console.log(`  > Successfully imported ${data.handle}`);

            } catch (err) {
                await client.query('ROLLBACK');
                console.error(`  [ERROR] Failed to import ${data.handle}:`, err);
            }
        }

    } catch (e) {
        console.error('Fatal error:', e);
    } finally {
        client.release();
        pool.end();
    }
}

function formatTitle(handle) {
    return handle
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

importCollections();
