
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

function slugify(text) {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-');
}

async function syncTags() {
    const client = await pool.connect();
    try {
        console.log('Fetching all unique tags from products and translations...');
        const res = await client.query(`
            WITH AllTags AS (
                SELECT unnest(tags) as tag FROM products
                UNION
                SELECT unnest(tags) as tag FROM product_translations
            )
            SELECT DISTINCT tag FROM AllTags WHERE tag IS NOT NULL AND tag != ''
        `);
        const uniqueTags = res.rows.map(r => r.tag.trim());
        console.log(`Found ${uniqueTags.length} unique tags.`);

        let inserted = 0;
        let verified = 0;

        for (const tag of uniqueTags) {
            const slug = slugify(tag);

            // Check if exists in tags table (on name_en or name_bg)
            const existing = await client.query('SELECT id FROM tags WHERE name_en = $1 OR name_bg = $1', [tag]);

            if (existing.rows.length === 0) {
                try {
                    await client.query(`
                        INSERT INTO tags (name_en, slug)
                        VALUES ($1, $2)
                        ON CONFLICT (name_en) DO NOTHING
                    `, [tag, slug]);
                    inserted++;
                } catch (err) {
                    console.error(`Error inserting tag "${tag}":`, err.message);
                }
            } else {
                verified++;
            }
        }

        console.log(`Sync complete. Inserted: ${inserted}, Verified/Existing: ${verified}`);

    } catch (e) {
        console.error('Fatal error syncing tags:', e);
    } finally {
        client.release();
        await pool.end();
    }
}

syncTags();
