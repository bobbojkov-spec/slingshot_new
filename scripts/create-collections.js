
require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function createCollectionsTables() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        console.log('Creating collections table...');
        await client.query(`
      CREATE TABLE IF NOT EXISTS collections (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        handle TEXT NOT NULL UNIQUE,
        description TEXT,
        image_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

        console.log('Creating collection_products table...');
        await client.query(`
      CREATE TABLE IF NOT EXISTS collection_products (
        collection_id UUID REFERENCES collections(id) ON DELETE CASCADE,
        product_id UUID REFERENCES products(id) ON DELETE CASCADE,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        PRIMARY KEY (collection_id, product_id)
      );
    `);

        // Add indexes for performance
        await client.query('CREATE INDEX IF NOT EXISTS idx_collections_handle ON collections(handle);');
        await client.query('CREATE INDEX IF NOT EXISTS idx_collection_products_collection_id ON collection_products(collection_id);');
        await client.query('CREATE INDEX IF NOT EXISTS idx_collection_products_product_id ON collection_products(product_id);');

        await client.query('COMMIT');
        console.log('Tables created successfully.');
    } catch (e) {
        await client.query('ROLLBACK');
        console.error('Error creating tables:', e);
    } finally {
        client.release();
        pool.end();
    }
}

createCollectionsTables();
