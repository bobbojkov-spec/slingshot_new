require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const TARGET_SLUG = 'cable-quick-start';
const TARGET_URL = 'https://slingshotsports.com/en-eu/collections/cable-quick-start';

async function run() {
    const client = await pool.connect();
    try {
        console.log(`Fetching ${TARGET_URL}...`);
        const res = await fetch(TARGET_URL);
        if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
        const html = await res.text();
        const doc = new JSDOM(html).window.document;

        // Try getting og:image
        const ogImage = doc.querySelector('meta[property="og:image"]')?.content;
        console.log(`Found Source Image: ${ogImage}`);

        if (ogImage) {
            console.log(`Updating collection '${TARGET_SLUG}'...`);
            await client.query(`
                UPDATE collections 
                SET image_url = $1, updated_at = NOW()
                WHERE slug = $2
            `, [ogImage, TARGET_SLUG]);
            console.log('Update successful.');
        } else {
            console.error('No image found to update.');
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

run();
