require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    const client = await pool.connect();
    try {
        console.log('Running migration: Adding title_bg and slug to menu_groups...');

        await client.query(`
            ALTER TABLE menu_groups 
            ADD COLUMN IF NOT EXISTS title_bg TEXT,
            ADD COLUMN IF NOT EXISTS slug TEXT;
        `);

        console.log('Migration successful.');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

run();
