const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function createFootstrapsCollection() {
    try {
        // 1. Create or Get Collection
        const slug = 'footstraps';
        const title = 'Footstraps';

        let res = await pool.query("SELECT id FROM collections WHERE slug = $1", [slug]);
        let collectionId;

        if (res.rows.length === 0) {
            console.log(`Creating collection '${title}'...`);
            const insertRes = await pool.query(`
        INSERT INTO collections (title, slug, handle, description, visible, source, sort_order)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
      `, [title, slug, slug, 'High performance footstraps and bindings.', true, 'slingshot', 0]);
            collectionId = insertRes.rows[0].id;
        } else {
            console.log(`Collection '${title}' already exists.`);
            collectionId = res.rows[0].id;
        }

        // 2. Find Products
        // Types: 'Footstraps', 'Foot Straps'
        const productsRes = await pool.query(`
      SELECT id, name FROM products 
      WHERE product_type IN ('Footstraps', 'Foot Straps')
    `);

        const products = productsRes.rows;
        console.log(`Found ${products.length} products.`);

        // 3. Add to Collection
        for (const p of products) {
            await pool.query(`
        INSERT INTO collection_products (collection_id, product_id)
        VALUES ($1, $2)
        ON CONFLICT (collection_id, product_id) DO NOTHING
      `, [collectionId, p.id]);
        }

        console.log(`Populated collection '${title}' with ${products.length} products.`);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        pool.end();
    }
}

createFootstrapsCollection();
