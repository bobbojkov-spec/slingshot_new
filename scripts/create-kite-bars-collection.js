require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
    try {
        console.log('Creating kite-bars collection...');

        // 1. Check if it exists
        const res = await pool.query("SELECT id FROM collections WHERE slug = 'kite-bars'");
        let collectionId;

        if (res.rows.length === 0) {
            // Create it
            const insert = await pool.query(`
                INSERT INTO collections (slug, handle, title, subtitle, source, visible, sort_order)
                VALUES ('kite-bars', 'kite-bars', 'Kite Bars', 'Performance control systems', 'slingshot', true, 0)
                RETURNING id
            `);
            collectionId = insert.rows[0].id;
            console.log('Created collection ID:', collectionId);
        } else {
            collectionId = res.rows[0].id;
            console.log('Collection already exists ID:', collectionId);
        }

        // 2. Populate it with products of type 'Kites' or 'Kite Bars'
        // Actually purely 'Kite Bars' type
        const products = await pool.query(`
            SELECT id, name FROM products WHERE product_type = 'Kite Bars'
        `);

        console.log(`Found ${products.rows.length} Kite Bar products.`);

        for (const p of products.rows) {
            await pool.query(`
                INSERT INTO collection_products (collection_id, product_id, sort_order)
                VALUES ($1, $2, 0)
                ON CONFLICT DO NOTHING
            `, [collectionId, p.id]);
        }

        console.log('Population complete.');

    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

run();
