const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function run() {
    const client = await pool.connect();
    try {
        console.log('Seeding Homepage Collections...');

        const collections = [
            { title: 'New Products', slug: 'new-products', source: 'homepage' },
            { title: 'Best Sellers', slug: 'best-sellers', source: 'homepage' },
            { title: 'Featured Products', slug: 'featured-products', source: 'homepage' },
        ];

        for (const col of collections) {
            // Check if exists
            const existing = await client.query(
                'SELECT id FROM collections WHERE slug = $1 AND source = $2',
                [col.slug, col.source]
            );

            if (existing.rows.length === 0) {
                const res = await client.query(
                    `INSERT INTO collections (title, slug, source, handle, visible, sort_order, created_at, updated_at)
           VALUES ($1, $2, $3, $4, true, 0, NOW(), NOW())
           RETURNING id`,
                    [col.title, col.slug, col.source, col.slug]
                );
                console.log(`Created collection: ${col.title} (${res.rows[0].id})`);
            } else {
                // Update source to homepage so it shows up
                await client.query(
                    'UPDATE collections SET source = $1 WHERE slug = $2',
                    [col.source, col.slug]
                );
                console.log(`Updated collection to source='homepage': ${col.title}`);
            }
        }

        console.log('Done!');
    } catch (err) {
        console.error('Error seeding collections:', err);
    } finally {
        client.release();
        pool.end();
    }
}

run();
