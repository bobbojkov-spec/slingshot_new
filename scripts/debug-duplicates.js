require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    const client = await pool.connect();
    try {
        console.log('Searching for "foot" collections...');
        const res = await client.query(`
            SELECT c.id, c.title, c.slug, c.source, COUNT(cp.product_id) as product_count 
            FROM collections c
            LEFT JOIN collection_products cp ON c.id = cp.collection_id
            WHERE c.title ILIKE '%foot%' OR c.slug ILIKE '%foot%'
            GROUP BY c.id, c.title, c.slug, c.source
        `);
        console.table(res.rows);
    } catch (err) {
        console.error('Error:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

run();
