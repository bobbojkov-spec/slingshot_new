import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function main() {
    console.log('Adding SKU and Subtitle columns...');
    const client = await pool.connect();
    try {
        await client.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS sku TEXT;`);
        console.log('Added sku column.');

        await client.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS subtitle TEXT;`);
        console.log('Added subtitle column.');

        // Also add subtitle to translations if needed in future
        await client.query(`ALTER TABLE product_translations ADD COLUMN IF NOT EXISTS subtitle TEXT;`);
        console.log('Added subtitle column to product_translations.');

    } catch (err) {
        console.error('Error adding columns:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

main();
