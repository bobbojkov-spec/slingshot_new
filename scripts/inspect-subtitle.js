
require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
    try {
        const res = await pool.query(`SELECT subtitle FROM collections WHERE slug = 'ride-engine-manual-pumps'`);
        if (res.rows.length > 0) {
            console.log('Subtitle:', JSON.stringify(res.rows[0].subtitle));
        } else {
            console.log('Collection not found');
        }
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
run();
