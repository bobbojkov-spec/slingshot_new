require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    const client = await pool.connect();
    try {
        console.log('Scanning for duplicate Collection Titles within same Source...');
        const res = await client.query(`
            SELECT title, source, COUNT(*), string_agg(slug, ', ') as slugs
            FROM collections
            GROUP BY title, source
            HAVING COUNT(*) > 1
        `);

        if (res.rows.length === 0) {
            console.log('No duplicates found!');
        } else {
            console.table(res.rows);
        }
    } catch (err) {
        console.error('Error:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

run();
