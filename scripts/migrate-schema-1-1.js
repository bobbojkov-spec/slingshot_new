
require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
    const client = await pool.connect();
    try {
        console.log("Starting Schema Migration 1:1...");

        await client.query('BEGIN');

        // 1. Products: sold_count
        await client.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS sold_count INTEGER DEFAULT 0`);
        console.log("- Added sold_count to products");

        // 2. Product Variants: inventory_policy
        await client.query(`ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS inventory_policy TEXT DEFAULT 'deny'`);
        console.log("- Added inventory_policy to product_variants");

        // 3. Product Options Normalization

        // product_options
        await client.query(`
      CREATE TABLE IF NOT EXISTS product_options (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        product_id UUID REFERENCES products(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        position INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
        console.log("- Created product_options table");

        // product_option_values
        await client.query(`
      CREATE TABLE IF NOT EXISTS product_option_values (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        option_id UUID REFERENCES product_options(id) ON DELETE CASCADE,
        value TEXT NOT NULL,
        position INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
        console.log("- Created product_option_values table");

        // variant_option_values (Many-to-Many linking variants to specific values)
        await client.query(`
      CREATE TABLE IF NOT EXISTS variant_option_values (
        variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
        option_value_id UUID REFERENCES product_option_values(id) ON DELETE CASCADE,
        PRIMARY KEY (variant_id, option_value_id)
      )
    `);
        console.log("- Created variant_option_values table");

        await client.query('COMMIT');
        console.log("Migration Complete.");

    } catch (e) {
        await client.query('ROLLBACK');
        console.error("Migration Failed:", e);
    } finally {
        client.release();
        pool.end();
    }
}

run();
