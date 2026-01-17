require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
    const client = await pool.connect();
    try {
        console.log('Starting migration for Visual Color System...');

        // 1. Create product_colors table
        console.log('Creating product_colors table...');
        await client.query(`
      CREATE TABLE IF NOT EXISTS product_colors (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        name TEXT,
        image_path TEXT NOT NULL,
        display_order INT DEFAULT 0,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

        // 2. Add product_color_id to product_variants
        console.log('Adding product_color_id to product_variants...');
        await client.query(`
      ALTER TABLE product_variants 
      ADD COLUMN IF NOT EXISTS product_color_id UUID REFERENCES product_colors(id) ON DELETE SET NULL;
    `);

        console.log('Migration completed successfully.');

    } catch (e) {
        console.error('Migration failed:', e);
    } finally {
        client.release();
        pool.end();
    }
}

run();
