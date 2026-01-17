const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// Definition of Ride Engine collections to create/sync
const collections = [
    { slug: 'ride-engine-hyperlock-system', title: 'Hyperlock System', types: [], keywords: ['Hyperlock'] },
    { slug: 'ride-engine-harnesses', title: 'Harnesses', types: ['Harnesses'], keywords: [] },
    { slug: 'ride-engine-wing-foil-harnesses', title: 'Wing Foil Harnesses', types: [], keywords: ['Wing', 'Harness'] }, // Intersection logic needed or just keyword
    { slug: 'ride-engine-spreader-bars', title: 'Spreader Bars', types: ['Spreader Bars'], keywords: [] },
    { slug: 'ride-engine-harness-parts-accessories', title: 'Harness Parts & Accessories', types: ['Harness Lines', 'Spare Parts'], keywords: ['Harness'] },

    { slug: 'ride-engine-pwc-collars-and-pontoons', title: 'PWC Collars and Pontoons', types: ['PWC Accessories'], keywords: ['Collar', 'Pontoon'] },
    { slug: 'ride-engine-performance-sled', title: 'Performance Sled', types: ['PWC Accessories'], keywords: ['Sled'] },

    { slug: 'ride-engine-e-inflation', title: 'E-Inflation', types: ['Pumps'], keywords: ['Micro', 'Air Box'] }, // Guessing keywords
    { slug: 'ride-engine-manual-pump', title: 'Manual Pump', types: ['Pumps'], keywords: ['Macro'] },
    { slug: 'ride-engine-leashes', title: 'Leashes', types: ['Leashes'], keywords: [] },
    { slug: 'ride-engine-foot-straps', title: 'Foot Straps', types: ['Foot Straps', 'Footstraps'], keywords: [] },
    { slug: 'ride-engine-vehicle-accessories', title: 'Vehicle Accessories', types: ['Accessories'], keywords: ['Vehicle', 'Car', 'Seat'] },

    { slug: 'ride-engine-impact-vests', title: 'Impact Vests', types: ['Impact Vests'], keywords: [] },
    { slug: 'ride-engine-helmets', title: 'Helmets', types: ['Helmets'], keywords: [] },
    { slug: 'ride-engine-hand-and-knee-protection', title: 'Hand and Knee Protection', types: ['Protection'], keywords: [] },

    { slug: 'ride-engine-wheeled-travel-board-bags', title: 'Wheeled Travel Board Bags', types: ['Board Bags', 'Bags'], keywords: ['Wheeled', 'Roller', 'Coffin'] },
    { slug: 'ride-engine-day-protection-board-bags', title: 'Day Protection Board Bags', types: ['Board Bags'], keywords: ['Day', 'Sleeve', 'Sock'] },

    { slug: 'ride-engine-wetsuits-mens', title: 'Mens Wetsuits', types: ['Wetsuits'], keywords: ['Men'] }, // Keyword filter
    { slug: 'ride-engine-wetsuits-womens', title: 'Womens Wetsuits', types: ['Wetsuits'], keywords: ['Women'] },
    { slug: 'ride-engine-wetsuit-accessories', title: 'Wetsuit Accessories', types: ['Wetsuit Accessories', 'Wetsuit Boots', 'Gloves', 'Hats'], keywords: [] },

    { slug: 'ride-engine-robes-and-ponchos', title: 'Robes & Ponchos', types: ['Changing Robes'], keywords: [] },
    { slug: 'ride-engine-technical-jackets', title: 'Technical Jackets', types: ['Technical Jackets'], keywords: [] },
    { slug: 'ride-engine-water-wear', title: 'Water Wear', types: ['Water Wear'], keywords: [] },
    { slug: 'ride-engine-hoodies-and-sweatshirts', title: 'Hoodies & Sweatshirts', types: ['Sweatshirts'], keywords: [] },
    { slug: 'ride-engine-t-shirts', title: 'T-Shirts', types: ['Shirts'], keywords: [] },
    { slug: 'ride-engine-hats', title: 'Hats', types: ['Hats'], keywords: [] },
];

async function syncCollections() {
    try {
        for (const def of collections) {
            console.log(`Processing ${def.title} (${def.slug})...`);

            // 1. Create Collection
            let collectionId;
            const res = await pool.query("SELECT id FROM collections WHERE slug = $1", [def.slug]);

            if (res.rows.length === 0) {
                const insertRes = await pool.query(`
          INSERT INTO collections (title, slug, handle, description, visible, source, sort_order)
          VALUES ($1, $2, $7, $3, $4, $5, $6)
          RETURNING id
        `, [def.title, def.slug, `${def.title} collection from Ride Engine`, true, 'rideengine', 0, def.slug]);
                collectionId = insertRes.rows[0].id;
                console.log(`  Created collection.`);
            } else {
                collectionId = res.rows[0].id;
            }

            // 2. Find Products (Ride Engine Brand Only generally, or mapped)
            // Basic query conditions
            const typeParams = def.types.map((_, i) => `$${i + 1}`);
            let query = `SELECT id, name, product_type FROM products WHERE 1=1`;
            const params = [];

            // Filter by Types
            if (def.types.length > 0) {
                query += ` AND product_type IN (${typeParams.join(',')})`;
                params.push(...def.types);
            }

            // Filter by Keywords (Name match)
            // If keywords exist, it must match AT LEAST ONE keyword (OR logic usually, or restriction?)
            // Let's assume restriction if types are present AND we need to narrow down (e.g. Wheeled Bags).
            // Or if types are empty, we search by keyword only.

            let keywordConditions = [];
            if (def.keywords.length > 0) {
                def.keywords.forEach(kw => {
                    params.push(`%${kw}%`);
                    keywordConditions.push(`name ILIKE $${params.length}`);
                });

                if (def.types.length > 0) {
                    // Narrow down types with keywords (AND)
                    // e.g. Wetsuits AND (Men)
                    query += ` AND (${keywordConditions.join(' OR ')})`;
                } else {
                    // Only keywords
                    query += ` AND (${keywordConditions.join(' OR ')})`;
                }
            }

            const productsRes = await pool.query(query, params);
            const products = productsRes.rows;
            console.log(`  Found ${products.length} potential products.`);

            // 3. Link Products
            if (products.length > 0) {
                let linkedCount = 0;
                for (const p of products) {
                    // Ensure we only link products that seem to be Ride Engine? 
                    // Or just trust the types/keywords?
                    // Safer to trust types/names for now.
                    try {
                        await pool.query(`
                    INSERT INTO collection_products (collection_id, product_id)
                    VALUES ($1, $2)
                    ON CONFLICT DO NOTHING
                `, [collectionId, p.id]);
                        linkedCount++;
                    } catch (e) { }
                }
                console.log(`  Linked ${linkedCount} products.`);
            }
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        pool.end();
    }
}

syncCollections();
