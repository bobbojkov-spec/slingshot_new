require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    const client = await pool.connect();
    try {
        console.log('--- 1. Deleting Duplicates ---');
        const dupesToDelete = [
            'footstraps',
            'ride-engine-wetsuits-mens',
            'ride-engine-wetsuits-womens'
        ];

        for (const slug of dupesToDelete) {
            const res = await client.query('DELETE FROM collections WHERE slug = $1 RETURNING title', [slug]);
            if (res.rowCount > 0) {
                console.log(`Deleted: ${slug} (${res.rows[0].title})`);
            } else {
                console.log(`Not found/Already deleted: ${slug}`);
            }
        }

        console.log('\n--- 2. Backfilling Missing Translations (BG) ---');
        // Find collections that have an EN translation (or base title) but NO BG translation
        const missingRes = await client.query(`
            SELECT c.id, c.title 
            FROM collections c
            WHERE NOT EXISTS (
                SELECT 1 FROM collection_translations ct 
                WHERE ct.collection_id = c.id AND ct.language_code = 'bg'
            )
        `);

        console.log(`Found ${missingRes.rows.length} collections missing BG translations.`);

        for (const row of missingRes.rows) {
            console.log(`Backfilling: ${row.title}`);
            // For now, copy EN title to BG. 
            // In a real scenario, we might use a translation API, but this ensures they aren't empty.
            // Also need to check if there is an EN translation to copy from, or just use the base title (which is usually EN).

            await client.query(`
                INSERT INTO collection_translations (collection_id, language_code, title, subtitle, created_at, updated_at)
                VALUES ($1, 'bg', $2, '', NOW(), NOW())
            `, [row.id, row.title]);
        }

        console.log('Done.');

    } catch (err) {
        console.error('Error:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

run();
