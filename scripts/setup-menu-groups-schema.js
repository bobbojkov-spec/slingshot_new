const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function run() {
    const client = await pool.connect();
    try {
        console.log('Creating menu_groups table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS menu_groups (
                id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                title TEXT NOT NULL,
                source VARCHAR(50) NOT NULL, -- 'slingshot' or 'rideengine'
                sort_order INT DEFAULT 0,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );
        `);

        console.log('Creating menu_group_collections table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS menu_group_collections (
                menu_group_id UUID REFERENCES menu_groups(id) ON DELETE CASCADE,
                collection_id UUID REFERENCES collections(id) ON DELETE CASCADE,
                sort_order INT DEFAULT 0,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                PRIMARY KEY (menu_group_id, collection_id)
            );
        `);

        console.log('Schema setup complete!');
    } catch (err) {
        console.error('Error setting up schema:', err);
    } finally {
        client.release();
        pool.end();
    }
}

run();
