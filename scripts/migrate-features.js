require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
    const client = await pool.connect();
    try {
        console.log('Adding features column...');
        await client.query("ALTER TABLE products ADD COLUMN IF NOT EXISTS features TEXT[] DEFAULT '{}'");
        console.log('Column added successfully.');

        // Optional: seed data for the specific product
        console.log('Seeding data for Lyte Webbing Connect...');
        const features = [
            "Lightweight Construction",
            "Lumbar Lock",
            "Low Profile Design",
            "Webbing Connection",
            "Comfort Grip"
        ];
        // Try both slug and handle just in case
        await client.query(
            "UPDATE products SET features = $1 WHERE slug = 'ride-engine-lyte-webbing-connect' OR handle = 'ride-engine-lyte-webbing-connect'",
            [features]
        );
        console.log('Data seeded.');

    } catch (e) {
        console.error(e);
    } finally {
        client.release();
        pool.end();
    }
}

run();
