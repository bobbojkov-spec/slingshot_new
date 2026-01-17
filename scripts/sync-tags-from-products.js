
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function syncTags() {
    const client = await pool.connect();
    try {
        console.log('Fetching all products...');
        const res = await client.query('SELECT id, tags FROM products');
        const products = res.rows;

        console.log(`Found ${products.length} products.`);

        let addedCount = 0;
        const seen = new Set(); // To avoid hammering DB for same tag in this run

        for (const p of products) {
            if (!Array.isArray(p.tags)) continue;

            for (const tag of p.tags) {
                const cleanTag = tag.trim();
                if (!cleanTag) continue;

                // Normalize for check? The DB usually handles case sensitive but user wants to manage them.
                // We assume tags are stored as slugs or names.
                // Let's insert if not exists.

                if (seen.has(cleanTag.toLowerCase())) continue;
                seen.add(cleanTag.toLowerCase());

                // Check if exists
                const existing = await client.query('SELECT id FROM tags WHERE name = $1', [cleanTag]);

                if (existing.rows.length === 0) {
                    // Insert
                    // We assume `slug` is needed. Generate slug from name.
                    const slug = cleanTag.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

                    try {
                        await client.query(
                            'INSERT INTO tags (name, slug) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING',
                            [cleanTag, slug]
                        );
                        addedCount++;
                        // console.log(`Added tag: ${cleanTag}`);
                    } catch (e) {
                        console.error(`Error adding tag ${cleanTag}:`, e.message);
                    }
                }
            }
        }

        console.log(`Sync Complete. Added ${addedCount} new tags.`);

    } catch (err) {
        console.error('Error syncing tags:', err);
    } finally {
        client.release();
        pool.end();
    }
}

syncTags();
