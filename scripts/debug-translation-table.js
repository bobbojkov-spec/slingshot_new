
require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('railway') || process.env.DATABASE_URL?.includes('rlwy.net')
        ? { rejectUnauthorized: false }
        : undefined,
});

async function checkTranslationTable() {
    const client = await pool.connect();
    try {
        console.log('Checking collection_translations table...');
        const res = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'collection_translations';
        `);

        if (res.rows.length === 0) {
            console.log('Table "collection_translations" does not exist.');
        } else {
            console.log('Table "collection_translations" exists with columns:');
            console.table(res.rows);
        }
    } catch (e) {
        console.error('Error checking table:', e);
    } finally {
        client.release();
        await pool.end();
    }
}

checkTranslationTable();
