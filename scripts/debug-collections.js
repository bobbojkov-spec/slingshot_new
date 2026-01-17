
require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function checkCollections() {
    try {
        const handles = ['bags', 'solar-shield', 're_serve-bags', 'best-sellers', 'featured'];
        console.log('Checking handles:', handles);
        for (const h of handles) {
            const res = await pool.query(`
            SELECT c.id, c.title, c.handle, 
            (SELECT COUNT(*) FROM collection_products cp WHERE cp.collection_id = c.id) as product_count 
            FROM collections c 
            WHERE c.handle = $1`,
                [h]
            );
            if (res.rows.length > 0) {
                console.log(`Found "${h}":`, res.rows[0]);
            } else {
                console.log(`"${h}" not found in DB.`);
            }
        }
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
checkCollections();
