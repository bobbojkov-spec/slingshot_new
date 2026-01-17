require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    const client = await pool.connect();
    try {
        const slug = 'championship-freestyle';
        const res = await client.query('SELECT * FROM collections WHERE slug = $1', [slug]);
        if (res.rows.length === 0) {
            console.log(`Collection '${slug}' NOT FOUND.`);
        } else {
            console.log(`Collection '${slug}' FOUND:`, res.rows[0]);
        }
    } catch (err) {
        console.error('Error:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

run();
