
require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
    try {
        const query = `
            SELECT c.slug, c.subtitle as en 
            FROM collections c 
            LEFT JOIN collection_translations ct ON c.id = ct.collection_id AND ct.language_code = 'bg'
            WHERE (ct.subtitle IS NULL OR ct.subtitle = '' OR ct.subtitle = c.subtitle)
        `;
        const res = await pool.query(query);
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
run();
