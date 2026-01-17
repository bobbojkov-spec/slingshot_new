const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const manualMapping = {
    'hyperlock': 'hyperlock-system',
    'air-box-mini': 'inflation-accessories',
    'air-box-mini-electric-pump': 'inflation-accessories',
    're_serve-golf-coffin': 'bags',
    're_serve-surf-travel-coffin': 'bags',
    're_serve-wing-travel-coffin': 'bags'
};

async function run() {
    const client = await pool.connect();
    try {
        const pageMapping = JSON.parse(fs.readFileSync('rideengine-media/page-mapping.json', 'utf8'));

        const res = await client.query("SELECT id, handle, title FROM collections WHERE source = 'rideengine'");
        console.log(`Checking ${res.rows.length} RideEngine collections for videos...`);

        let updatedCount = 0;
        for (const row of res.rows) {
            // 1. Check direct handle match
            let mappingKey = Object.keys(pageMapping).find(k => k === row.handle);

            // 2. Check manual mapping
            if (!mappingKey) {
                mappingKey = Object.keys(manualMapping).find(k => manualMapping[k] === row.handle);
            }

            // 3. Check partial title match
            if (!mappingKey) {
                mappingKey = Object.keys(pageMapping).find(k => row.title.toLowerCase().includes(k.toLowerCase()));
            }

            if (mappingKey) {
                const mapping = pageMapping[mappingKey];
                if (mapping && mapping.videos && mapping.videos.length > 0) {
                    const bestVideo = mapping.videos.find(v => v.includes('1080p')) || mapping.videos[0];
                    await client.query("UPDATE collections SET video_url = $1 WHERE id = $2", [bestVideo, row.id]);
                    console.log(`✅ Updated ${row.title} (handle: ${row.handle}) with video from page: ${mappingKey}`);
                    updatedCount++;
                }
            }
        }

        console.log(`📊 Updated ${updatedCount} collections with videos.`);
        console.log('✅ Done!');
    } finally {
        client.release();
        await pool.end();
    }
}

run();
