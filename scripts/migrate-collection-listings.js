const { Pool } = require('pg');

async function migrate() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined
    });

    const client = await pool.connect();

    try {
        console.log('Checking for collection_listings table...');
        await client.query(`
      CREATE TABLE IF NOT EXISTS collection_listings (
        parent_id UUID REFERENCES collections(id) ON DELETE CASCADE,
        child_id UUID REFERENCES collections(id) ON DELETE CASCADE,
        sort_order INT DEFAULT 0,
        PRIMARY KEY (parent_id, child_id)
      );
    `);
        console.log('Table collection_listings is ready.');

    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
