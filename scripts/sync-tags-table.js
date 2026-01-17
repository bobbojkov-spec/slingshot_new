
require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

function slugify(text) {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')     // Replace spaces with -
        .replace(/[^\w\-]+/g, '') // Remove all non-word chars
        .replace(/\-\-+/g, '-');  // Replace multiple - with single -
}

async function syncTags() {
    const client = await pool.connect();
    try {
        console.log('Fetching all products...');
        const res = await client.query('SELECT tags FROM products');
        const products = res.rows;

        const allTags = new Set();
        products.forEach(p => {
            if (Array.isArray(p.tags)) {
                p.tags.forEach(t => {
                    if (t && typeof t === 'string' && t.trim().length > 0) {
                        allTags.add(t.trim());
                    }
                });
            }
        });

        console.log(`Found ${allTags.size} unique tags.`);

        let inserted = 0;
        for (const tagName of allTags) {
            const slug = slugify(tagName);
            try {
                await client.query(`
                INSERT INTO tags (name, slug)
                VALUES ($1, $2)
                ON CONFLICT (slug) DO NOTHING
            `, [tagName, slug]);
                inserted++;
            } catch (err) {
                // Check if it's a unique constraint violation on name, if so, maybe skip or log
                if (err.code === '23505') { // unique_violation
                    // This might happen if 'Foo Bar' and 'foo-bar' both map to same slug 'foo-bar'
                    // OR if 'Foo' and 'Foo' (dupe) existed.
                    // We can just ignore conflicts.
                } else {
                    console.error(`Error inserting tag "${tagName}":`, err.message);
                }
            }
        }

        console.log(`Sync complete. Inserted/Verified logic run for ${inserted} tags.`);

    } catch (e) {
        console.error('Fatal error syncing tags:', e);
    } finally {
        client.release();
        await pool.end();
    }
}

syncTags();
