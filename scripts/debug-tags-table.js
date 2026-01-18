
require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('railway') || process.env.DATABASE_URL?.includes('rlwy.net')
        ? { rejectUnauthorized: false }
        : undefined,
});

async function checkTagsTable() {
    const client = await pool.connect();
    try {
        const searchTerm = '%win%';
        console.log(`Running search query for "${searchTerm}"...`);

        const res = await client.query(
            `SELECT name, slug FROM tags 
       WHERE name ILIKE $1 
       LIMIT 5`,
            [searchTerm]
        );

        console.log('Search success. Rows:', res.rows);

    } catch (e) {
        console.error('Error running search query:', e);
    } finally {
        client.release();
        await pool.end();
    }
}

checkTagsTable();
