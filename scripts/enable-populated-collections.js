
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function enablePopulatedCollections() {
    const client = await pool.connect();
    try {
        console.log('Checking for populated invisible collections...');

        // Find collections with products that are NOT visible
        const res = await client.query(`
            SELECT c.id, c.slug, c.title, c.visible, COUNT(cp.product_id) as product_count
            FROM collections c
            JOIN collection_products cp ON c.id = cp.collection_id
            GROUP BY c.id
            HAVING COUNT(cp.product_id) > 0
        `);

        console.log(`Found ${res.rows.length} populated collections.`);

        let updatedCount = 0;
        for (const col of res.rows) {
            if (!col.visible) {
                console.log(`Enabling invisible collection: ${col.slug} (${col.product_count} products)`);
                await client.query('UPDATE collections SET visible = true WHERE id = $1', [col.id]);
                updatedCount++;
            } else {
                // console.log(`Collection ${col.slug} is already visible.`);
            }
        }

        console.log(`Enabled ${updatedCount} collections.`);

        // Specifically check ride-engine-harness-sale
        const hardcodedCheck = await client.query("SELECT * FROM collections WHERE slug = 'ride-engine-harness-sale'");
        if (hardcodedCheck.rows.length === 0) {
            console.warn("WARNING: 'ride-engine-harness-sale' does NOT exist in the database!");
            // Check for partial match
            const partial = await client.query("SELECT slug FROM collections WHERE slug LIKE '%harness-sale%'");
            if (partial.rows.length > 0) {
                console.log("Found similar slugs:", partial.rows.map(r => r.slug));
            }
        } else {
            console.log("'ride-engine-harness-sale' exists and is visible=" + hardcodedCheck.rows[0].visible);
        }

    } catch (e) {
        console.error(e);
    } finally {
        client.release();
        pool.end();
    }
}

enablePopulatedCollections();
