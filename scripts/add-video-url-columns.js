require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    const client = await pool.connect();
    try {
        console.log('Adding video_url to collections...');
        await client.query(`
            ALTER TABLE collections 
            ADD COLUMN IF NOT EXISTS video_url TEXT;
        `);

        console.log('Adding video_url to products...');
        await client.query(`
            ALTER TABLE products 
            ADD COLUMN IF NOT EXISTS video_url TEXT;
        `);

        console.log('Schema updated successfully.');
    } catch (err) {
        console.error('Error updating schema:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

run();
