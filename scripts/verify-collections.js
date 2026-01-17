const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function run() {
    const client = await pool.connect();
    try {
        const res = await client.query("SELECT title, slug, source FROM collections WHERE slug IN ('best-sellers', 'new-products', 'featured-products')");
        console.table(res.rows);
    } catch (err) {
        console.error(err);
    } finally {
        client.release();
        pool.end();
    }
}

run();
