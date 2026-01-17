require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    const client = await pool.connect();
    try {
        console.log('Backfilling missing collection translations...');
        const res = await client.query(`
            INSERT INTO collection_translations (collection_id, language_code, title)
            SELECT c.id, 'bg', c.title
            FROM collections c
            WHERE NOT EXISTS (
                SELECT 1 FROM collection_translations ct 
                WHERE ct.collection_id = c.id AND ct.language_code = 'bg'
            )
            RETURNING collection_id, title;
        `);
        console.log(`Backfilled ${res.rowCount} translations.`);
        res.rows.forEach(r => console.log(` - ${r.title}`));
    } catch (err) {
        console.error('Error:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

run();
