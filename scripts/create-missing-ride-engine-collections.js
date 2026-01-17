
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const rideEngineMenu = [
    {
        title: "HARNESSES",
        items: [
            { name: "Hyperlock System", handle: "hyperlock-system" },
            { name: "Harnesses", handle: "harnesses" },
            { name: "Wing Foil Harnesses", handle: "wing-foil-harnesses" },
            { name: "Spreader Bars", handle: "spreader-bars" },
            { name: "Harness Parts & Accessories", handle: "harness-parts-accessories" },
        ]
    },
    {
        title: "PERFORMANCE PWC",
        items: [
            { name: "PWC Collars and Pontoons", handle: "pwc-collars-and-pontoons" },
            { name: "Performance Sled", handle: "performance-sled" },
        ]
    },
    {
        title: "INFLATION & ACCESSORIES",
        items: [
            { name: "E-Inflation", handle: "e-inflation" },
            { name: "Manual Pump", handle: "manual-pump" },
            { name: "Leashes", handle: "leashes" },
            { name: "Foot Straps", handle: "foot-straps" },
            { name: "Vehicle Accessories", handle: "vehicle-accessories" },
        ]
    },
    {
        title: "PROTECTION",
        items: [
            { name: "Impact Vests", handle: "impact-vests" },
            { name: "Helmets", handle: "helmets" },
            { name: "Hand and Knee Protection", handle: "hand-and-knee-protection" },
        ]
    },
    {
        title: "BAGS",
        items: [
            { name: "Wheeled Travel Board Bags", handle: "wheeled-travel-board-bags" },
            { name: "Day Protection Board Bags", handle: "day-protection-board-bags" },
        ]
    },
    {
        title: "WETSUITS",
        items: [
            { name: "Wetsuits Mens", handle: "wetsuits-mens" },
            { name: "Wetsuits Womens", handle: "wetsuits-womens" },
            { name: "Wetsuit Accessories", handle: "wetsuit-accessories" },
        ]
    },
    {
        title: "APPAREL",
        items: [
            { name: "Robes & Ponchos", handle: "robes-and-ponchos" },
            { name: "Technical Jackets", handle: "technical-jackets" },
            { name: "Water Wear", handle: "water-wear" },
            { name: "Hoodies & Sweatshirts", handle: "hoodies-and-sweatshirts" },
            { name: "T-Shirts", handle: "t-shirts" },
            { name: "Hats", handle: "hats" },
        ]
    },
    {
        title: "SALE",
        items: [
            { name: "Harness Sale", handle: "harness-sale" },
            { name: "Protection Sale", handle: "protection-sale" },
            { name: "Bag Sale", handle: "bag-sale" },
            { name: "Apparel Sale", handle: "apparel-sale" },
            { name: "Accessories Sale", handle: "accessories-sale" },
        ]
    }
];

async function createCollections() {
    const client = await pool.connect();
    try {
        console.log('Creating missing Ride Engine collections...');

        for (const cat of rideEngineMenu) {
            for (const item of cat.items) {
                const slug = `ride-engine-${item.handle}`;
                const title = item.name; // Use English name as title

                // Check if exists
                const res = await client.query("SELECT id FROM collections WHERE slug = $1", [slug]);

                if (res.rows.length === 0) {
                    console.log(`Creating: ${slug} (${title})`);
                    const insertRes = await client.query(`
                        INSERT INTO collections (slug, title, handle, description, visible, source, sort_order)
                        VALUES ($1, $2, $3, '', true, 'rideengine', 0)
                        RETURNING id
                    `, [slug, title, slug]);

                    const newId = insertRes.rows[0].id;

                    // Create Translation
                    await client.query(`
                        INSERT INTO collection_translations (collection_id, language_code, title, description, slug)
                        VALUES ($1, 'en', $2, '', $3)
                        ON CONFLICT DO NOTHING
                    `, [newId, title, slug]);

                } else {
                    console.log(`Exists: ${slug}`);
                }
            }
        }

    } catch (e) {
        console.error(e);
    } finally {
        client.release();
        pool.end();
    }
}

createCollections();
