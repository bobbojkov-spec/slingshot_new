const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    const client = await pool.connect();
    try {
        const pageMapping = JSON.parse(fs.readFileSync('rideengine-media/page-mapping.json', 'utf8'));

        const res = await client.query("SELECT id, handle, title FROM collections WHERE source = 'rideengine'");
        console.log(`Updating ${res.rows.length} RideEngine collections images...`);

        for (const row of res.rows) {
            const mapping = pageMapping[row.handle];
            if (mapping && mapping.images && mapping.images.length > 0) {
                const bestImage = mapping.images.find(img => img.includes('width=2000')) || mapping.images[0];
                await client.query("UPDATE collections SET image_url = $1 WHERE id = $2", [bestImage, row.id]);
                console.log(`✅ Updated ${row.title}`);
            }
        }

        console.log('✅ Done!');
    } finally {
        client.release();
        await pool.end();
    }
}

run();
