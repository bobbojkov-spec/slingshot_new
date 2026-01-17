
require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

/*
  CONFIGURATION RULES
  -------------------
  1. LEAF_COLLECTIONS: Define how to find products for specific sub-categories.
     - handle: Collection URL slug
     - title: Collection Display Name (EN)
     - matchType: 'title_or_tag' (simple search)
     - matchValues: array of strings to look for
  
  2. PARENT_COLLECTIONS: Define partial hierarchy.
     - handle: Parent Collection URL slug
     - children: Array of child collection handles.
     - logic: 'UNION' (Parent contains ALL products from children)

  3. SPECIAL_COLLECTIONS: Manual lists or specific logic.
     - handle: 'best-sellers', 'featured'
     - handlesList: string[] of product handles to force include.
*/

const LEAF_COLLECTIONS = [
    {
        handle: 'solar-shield',
        title: 'Day Protection Board Bags',
        bgTitle: 'Ежедневна защита за дъски',
        matchType: 'title_or_tag',
        matchValues: ['Day Protection', 'Solar Shield', 'Surfboard Bag', 'Day Strike']
    },
    {
        handle: 're_serve-bags',
        title: 'Wheeled Travel Bags',
        bgTitle: 'Чанти с колела',
        matchType: 'title_or_tag',
        matchValues: ['Wheel', 'Travel Coffin', 'Golf Coffin', 'Roller']
    },
    {
        handle: 'harnesses',
        title: 'Harnesses',
        bgTitle: 'Трапеци',
        matchType: 'title_or_tag',
        matchValues: ['Harness']
    }
];

const PARENT_COLLECTIONS = [
    {
        handle: 'bags',
        title: 'Bags',
        bgTitle: 'Чанти',
        children: ['solar-shield', 're_serve-bags'], // Bags contains Day Protection + Wheeled
        extraMatchValues: ['Bag', 'Duffle', 'Backpack'] // Plus any generic bags
    }
];

// Best Sellers - mimic "Manual" curation or "Smart" sold count
// Since we don't have sold count, we list specific handles here.
// You can update this list to change Best Sellers.
const BEST_SELLERS_HANDLES = [
    'day-strike-classic-board-bag-v3',
    'carbon-elite-v8-harness',
    'hyperlock-design-upgrade-kit',
    'us-fin-box-hardware-tab-screw',
    'thermal-block-classic-board-bag'
];

async function run() {
    const client = await pool.connect();
    try {
        console.log("--- Starting Splendid Hierarchy Sync ---");

        // Helper: Ensure collection exists
        async function ensureCollection(handle, title, bgTitle) {
            let res = await client.query('SELECT id FROM collections WHERE handle = $1', [handle]);
            let id;
            if (res.rows.length === 0) {
                res = await client.query(`
          INSERT INTO collections (title, handle, created_at, updated_at)
          VALUES ($1, $2, NOW(), NOW()) RETURNING id`,
                    [title, handle]
                );
                id = res.rows[0].id;
                console.log(`Created collection: ${title} (${handle})`);
            } else {
                id = res.rows[0].id;
            }
            // Ensure Translation
            if (bgTitle) {
                await client.query(`
            INSERT INTO collection_translations (collection_id, language_code, title, slug)
            VALUES ($1, 'bg', $2, $3)
            ON CONFLICT (collection_id, language_code) DO UPDATE SET title = EXCLUDED.title 
        `, [id, bgTitle, handle]);
            }
            return id;
        }

        // 1. Process Leaf Collections
        const leafProductIds = {}; // Map handle -> Set(ids)

        for (const rule of LEAF_COLLECTIONS) {
            const colId = await ensureCollection(rule.handle, rule.title, rule.bgTitle);

            // Find Identificators
            // Build dynamic ILIKE clause
            const conditions = rule.matchValues.map((_, i) => `(title ILIKE $${i + 1} OR $${i + 1} = ANY(tags))`).join(' OR ');
            const query = `SELECT id, title FROM products WHERE ${conditions}`;
            const res = await client.query(query, rule.matchValues.map(v => `%${v}%`));

            const pIds = res.rows.map(r => r.id);
            leafProductIds[rule.handle] = new Set(pIds);

            // Sync DB Link
            for (const pid of pIds) {
                await client.query(`INSERT INTO collection_products (collection_id, product_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [colId, pid]);
            }
            console.log(`[Leaf] ${rule.title}: Linked ${pIds.length} products.`);
        }

        // 2. Process Parent Collections (Hierarchy)
        for (const rule of PARENT_COLLECTIONS) {
            const colId = await ensureCollection(rule.handle, rule.title, rule.bgTitle);

            let allIds = new Set();

            // Add Children Products
            if (rule.children) {
                for (const childHandle of rule.children) {
                    const childIds = leafProductIds[childHandle] || new Set();
                    childIds.forEach(id => allIds.add(id));
                }
            }

            // Add Extra Matches
            if (rule.extraMatchValues) {
                const conditions = rule.extraMatchValues.map((_, i) => `(title ILIKE $${i + 1} OR $${i + 1} = ANY(tags))`).join(' OR ');
                const query = `SELECT id FROM products WHERE ${conditions}`;
                const res = await client.query(query, rule.extraMatchValues.map(v => `%${v}%`));
                res.rows.forEach(r => allIds.add(r.id));
            }

            // Sync
            for (const pid of allIds) {
                await client.query(`INSERT INTO collection_products (collection_id, product_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [colId, pid]);
            }
            console.log(`[Parent] ${rule.title}: Linked ${allIds.size} products (aggregating ${rule.children?.join(', ')} + matches).`);
        }

        // 3. Process Best Sellers (Dynamic via sold_count)
        // Ride Engine Logic: "Best selling" = order by sales volume.
        const bestSellerId = await ensureCollection('best-sellers', 'Best Sellers', 'Най-продавани');

        // Fetch top 10 by sold_count
        const bestRes = await client.query('SELECT id, title, sold_count FROM products ORDER BY sold_count DESC LIMIT 10');

        // Clear old links for strictly dynamic collection? 
        // For now, let's just UPSERT sort_order based on sales? 
        // Better: Just ensure they are linked. The Collection Page query usually handles the "Sorting" (ORDER BY ...).
        // But since this is a specific "Best Sellers" collection, we likely want it to *contain* the top N items.

        // Option A: Wipe and recreate links (cleanest for partial sync)
        // Option B: Add missing.
        // Let's go with Add Missing + Log.

        let bestSellerCount = 0;
        for (const p of bestRes.rows) {
            // If sold_count is 0, maybe don't include? Or just include if we have no sales data yet (it will pick random newest).
            // Let's assume we want at least some items.

            await client.query(`INSERT INTO collection_products (collection_id, product_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [bestSellerId, p.id]);
            bestSellerCount++;
        }
        console.log(`[Special] Best Sellers: Linked ${bestSellerCount} products based on sold_count.`);

    } catch (e) {
        console.error(e);
    } finally {
        client.release();
        pool.end();
    }
}

run();
