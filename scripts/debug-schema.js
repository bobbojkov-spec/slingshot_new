
require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
    try {
        const tables = ['products', 'product_variants', 'collections', 'collection_products'];
        for (const t of tables) {
            const res = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = $1`, [t]);
            console.log(`=== ${t} ===`);
            res.rows.forEach(r => console.log(`- ${r.column_name} (${r.data_type})`));
        }
    } catch (e) { console.error(e); } finally { pool.end(); }
}
run();
