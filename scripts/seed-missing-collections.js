
require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

const COLLECTIONS_TO_SEED = [
    {
        title: 'Day Protection Board Bags',
        handle: 'solar-shield',
        description: 'Lightweight protection for your board from sun and scratches.',
        bgTitle: 'Ежедневна защита за дъски',
        searchTerms: ['Day Protection', 'Solar Shield']
    },
    {
        title: 'Wheeled Travel Bags',
        handle: 're_serve-bags', // Matching the user's URL observation
        description: 'Heavy duty travel bags with wheels for your gear.',
        bgTitle: 'Чанти с колела',
        searchTerms: ['Wheel', 'Travel Coffin', 'Golf Coffin']
    },
    {
        title: 'Best Sellers',
        handle: 'best-sellers',
        description: 'Our most popular products.',
        bgTitle: 'Най-продавани',
        specialTag: 'Best Seller',
        autoPickCount: 5
    },
    {
        title: 'Featured',
        handle: 'featured',
        description: 'Highlights from our latest collection.',
        bgTitle: 'Препоръчани',
        specialTag: 'Featured',
        autoPickCount: 5
    }
];

async function run() {
    const client = await pool.connect();
    try {
        for (const col of COLLECTIONS_TO_SEED) {
            console.log(`Processing collection: ${col.title}`);

            // 1. Create or Get Collection
            let res = await client.query('SELECT id FROM collections WHERE handle = $1', [col.handle]);
            let collectionId;

            if (res.rows.length === 0) {
                res = await client.query(`
          INSERT INTO collections (title, handle, description, created_at, updated_at)
          VALUES ($1, $2, $3, NOW(), NOW())
          RETURNING id
        `, [col.title, col.handle, col.description]);
                collectionId = res.rows[0].id;
                console.log(`  -> Created new collection ID: ${collectionId}`);
            } else {
                collectionId = res.rows[0].id;
                console.log(`  -> Found existing collection ID: ${collectionId}`);
            }

            // 2. Add Translation (BG)
            await client.query(`
        INSERT INTO collection_translations (collection_id, language_code, title, description, slug)
        VALUES ($1, 'bg', $2, '', $3)
        ON CONFLICT (collection_id, language_code) 
        DO UPDATE SET title = EXCLUDED.title
      `, [collectionId, col.bgTitle, col.handle]);

            // 3. Populate Products
            let productsToAdd = [];

            if (col.searchTerms) {
                // Search by title or tags
                const searchQuery = `
          SELECT id, title FROM products 
          WHERE ` + col.searchTerms.map((_, i) => `(title ILIKE $${i + 1} OR $${i + 1} = ANY(tags))`).join(' OR ');

                const searchRes = await client.query(searchQuery, col.searchTerms.map(t => `%${t}%`));
                productsToAdd = searchRes.rows;
                console.log(`  -> Found ${productsToAdd.length} matching products.`);

            } else if (col.specialTag) {
                // Logic: Pick 'autoPickCount' random products (or specific popular ones if we knew IDs)
                // and ensure they have the tag.

                // Find products that ALREADY have the tag?
                const existingTagged = await client.query(`SELECT id, title FROM products WHERE $1 = ANY(tags)`, [col.specialTag]);

                if (existingTagged.rows.length < col.autoPickCount) {
                    // Need to tag more products. Let's pick some "Bags" or "Harnesses" or generally populated items to look good.
                    const limit = col.autoPickCount - existingTagged.rows.length;
                    const candidates = await client.query(`
            SELECT id, title, tags FROM products 
            WHERE NOT ($1 = ANY(tags)) 
            LIMIT $2
          `, [col.specialTag, limit]);

                    for (const p of candidates.rows) {
                        let newTags = p.tags || [];
                        if (!newTags.includes(col.specialTag)) {
                            newTags.push(col.specialTag);
                        }
                        await client.query(`UPDATE products SET tags = $1 WHERE id = $2`, [newTags, p.id]);
                        console.log(`  -> Tagged "${p.title}" as ${col.specialTag}`);
                        productsToAdd.push(p);
                    }
                    // Also include already tagged
                    productsToAdd = [...productsToAdd, ...existingTagged.rows];
                } else {
                    productsToAdd = existingTagged.rows;
                }
            }

            // 4. Link Products to Collection
            for (const p of productsToAdd) {
                await client.query(`
          INSERT INTO collection_products (collection_id, product_id)
          VALUES ($1, $2)
          ON CONFLICT DO NOTHING
        `, [collectionId, p.id]);
            }
            console.log(`  -> Linked ${productsToAdd.length} products to collection.`);
        }

    } catch (e) {
        console.error('Error running seed script:', e);
    } finally {
        client.release();
        pool.end();
    }
}

run();
