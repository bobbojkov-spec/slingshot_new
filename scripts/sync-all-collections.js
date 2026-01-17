const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function syncCollections() {
    try {
        console.log('Starting Sync of All Product Types to Collections...');
        const client = await pool.connect();

        // 1. Fetch all product types from DB (used in navigation)
        // Querying active products' types to be safe, or just product_types table?
        // Navigation uses product_types joined with categories.

        // Let's get distinct product types from products table to ensure we cover used types
        // OR from product_types table.
        const typesRes = await client.query(`SELECT * FROM product_types WHERE slug IS NOT NULL`);
        const types = typesRes.rows;
        console.log(`Found ${types.length} product types.`);

        for (const type of types) {
            // Check if collection exists
            const colRes = await client.query("SELECT * FROM collections WHERE handle = $1 OR slug = $1", [type.slug]);

            let collectionId;
            let action = 'none';

            if (colRes.rows.length === 0) {
                console.log(`Creating collection for type: ${type.name} (${type.slug})`);
                // Create
                const insertRes = await client.query(`
               INSERT INTO collections (title, slug, handle, description, visible, source)
               VALUES ($1, $2, $3, '', true, 'slingshot')
               RETURNING id
           `, [type.name, type.slug, type.slug]);
                collectionId = insertRes.rows[0].id;
                action = 'created';
            } else {
                // Exists
                collectionId = colRes.rows[0].id;
                // console.log(`Collection exists: ${type.slug}`);
            }

            // Sync Products
            // Find products of this type
            const prodsRes = await client.query("SELECT id FROM products WHERE product_type = $1", [type.name]);
            const productIds = prodsRes.rows.map(r => r.id);

            if (productIds.length > 0) {
                // Link them
                let links = 0;
                for (const pid of productIds) {
                    const check = await client.query(
                        "SELECT 1 FROM collection_products WHERE collection_id = $1 AND product_id = $2",
                        [collectionId, pid]
                    );
                    if (check.rows.length === 0) {
                        await client.query(
                            "INSERT INTO collection_products (collection_id, product_id) VALUES ($1, $2)",
                            [collectionId, pid]
                        );
                        links++;
                    }
                }
                if (links > 0 || action === 'created') {
                    console.log(`Linked ${links} products to ${type.slug} (${action})`);
                }
            }
        }

        console.log('Sync Complete.');

    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}

syncCollections();
