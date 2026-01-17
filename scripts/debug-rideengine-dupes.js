require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    const client = await pool.connect();
    try {
        const slugs = [
            'ride-engine-womens-wetsuits',
            'ride-engine-wetsuits-womens',
            'ride-engine-wetsuits-mens',
            'ride-engine-mens-wetsuits'
        ];

        console.log('Checking Ride Engine Duplicates...');
        const res = await client.query(`
            SELECT c.id, c.title, c.slug, c.source, COUNT(cp.product_id) as product_count 
            FROM collections c
            LEFT JOIN collection_products cp ON c.id = cp.collection_id
            WHERE c.slug = ANY($1)
            GROUP BY c.id, c.title, c.slug, c.source
        `, [slugs]);

        console.table(res.rows);
    } catch (err) {
        console.error('Error:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

run();
