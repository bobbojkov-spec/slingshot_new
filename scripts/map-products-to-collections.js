
require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

const KEYWORD_MAPPING = {
    // Collection Slug : [Keywords in Product Name]
    'dock-pump': ['pfish', 'launch', 'dock', 'alien air', 'one-lock', 'glide'],
    'wing-glide-zone': ['glide', 'zone'],
    'board-mounting-systems': ['track', 'mount', 'hardware', 'screw'],
    'foil-boards': ['foilboard', 'converter', 'simulator', 'alien air', 'flying fish', 'dwarf craft', 'high roller', 'shred sled'],
    'foil-masts': ['mast'],
    'foil-wings': ['wing front', 'wing rear', 'stabilizer'],
    'kites': ['kite', 'sst', 'rally', 'rpm', 'turbine', 'ghost', 'ufo', 'machine'],
    'bars': ['bar', 'sentry', 'compstick', 'guardian'],
    'twin-tips': ['board', 'asylum', 'misfit', 'vision', 'crisis', 'super natural', 'karolina', 'refraction'],
    'bindings': ['binding', 'boot', 'rad', 'jewel', 'shredtown', 'kmd', 'space mob'],
    'surfboards': ['surf', 'celero', 'sci-fly', 'mixer', 'tyrant'],
    'wakeboards': ['wake', 'nomad', 'native', 'windsor', 'terrain', 'solo', 'contrast', 'coalition', 'valley', 'pill', 'bishop', 'highline', 'volt'],
    'foil-packages': ['foil package', 'hover glide', 'phantasm'],
    'wings': ['wing', 'dart', 'slingwing', 'javelin'],
    'accessories': ['pump', 'leash', 'bag', 'travel', 'protection', 'vest'],
    'beginner-kitesurf': ['rally', 'crisis', 'sentry'],
    'beginner-wake': ['nomad', 'windsor', 'terrain'],
    'beginner-wing': ['slingwing', 'blaster', 'dart'],
    'best-gear-for-dock-pumping': ['pfish', 'launch', 'dock', 'alien air', 'quantum', 'one-lock', 'glide'],

    // Rideengine Mappings
    'ride-engine-changing-robes-ponchos': ['poncho', 'changing robe'],
    'ride-engine-robes-ponchos': ['poncho', 'changing robe'],
    'ride-engine-day-protection': ['day bag', 'surf bag'],
    'ride-engine-board-bags': ['board bag', 'travel bag'],
    'ride-engine-wheeled-travel-bags': ['wheeled', 'travel bag', 'roller'],
    'ride-engine-manual-pumps': ['pump', 'inflator'],
    'ride-engine-inflation-accessories': ['nozzle', 'hose', 'adaptor'],
    'ride-engine-e-inflation': ['electric', 'pump'],
    'ride-engine-harnesses': ['harness', 'elite', 'saber', 'momentum', 'lyte'],
    'ride-engine-wetsuits': ['wetsuit', 'access', 'apod'],
    'ride-engine-impact-vests': ['vest', 'impact'],
    'ride-engine-spreader-bars': ['spreader', 'unity'],
    'ride-engine-harness-accessories': ['slider', 'hook', 'leash'],
    'ride-engine-luggage-travel-bags': ['luggage', 'duffel', 'backpack'],
    'ride-engine-hand-knee-protection': ['knee', 'active'],
    'ride-engine-all-sale-products': ['sale', 'discount', 'clearance'],
    'ride-engine-bag-sale': ['bag', 'travel', 'duffel'],
    'ride-engine-protection': ['helmet', 'vest', 'impact', 'knee', 'protection'],
    'ride-engine-robes-ponchos': ['robe', 'poncho', 'towel'],
    'ride-engine-changing-robes-ponchos': ['robe', 'poncho', 'towel'],
    'ride-engine-hoodies': ['hoodie', 'hoody', 'pullover', 'fleece'],
    'ride-engine-wetsuits': ['wetsuit', 'steamer', 'spring', 'top'],
    'ride-engine-impact-vests': ['vest', 'impact', 'defend', 'sky hook'],
    'ride-engine-helmets': ['helmet', 'universe'],
    'ride-engine-performance-pwc': ['pwc', 'rescue', 'sled'],
    'ride-engine-performance-sleds': ['sled', 'rescue'],
    'ride-engine-technical-jackets': ['jacket', 'windbreaker', 'rain'],
    'ride-engine-t-shirts': ['tee', 'shirt', 'tank'],
    'ride-engine-hats': ['hat', 'cap', 'beanie'],
    'ride-engine-foot-straps': ['strap', 'binding'],
    'ride-engine-leashes': ['leash'],
    'ride-engine-pump-parts': ['nozzle', 'hose', 'adaptor', 'gauge'],
    'ride-engine-hyperlock-system': ['hyperlock', 'spreader', 'clip'],
};

// Also keep the Type Mapping as a fallback
const TYPE_MAPPING = {
    'Kites': 'kites',
    'Twin Tips': 'twin-tips',
    'Surfboards': 'surfboards',
    'Kite Bars': 'bars',
    'Kite Bar Parts': 'kite-parts',
    'Kite Accessories': 'kite-accessories',
    'Wings': 'wings',
    'Wing Boards': 'wing-boards',
    'Wing Foils': 'wing-foils',
    'Wing Parts': 'wing-parts',
    'Foil Boards': 'foil-boards',
    'Foil Front Wings': 'foil-front-wings',
    'Foil Masts': 'foil-masts',
    'Foil Stabilizers': 'foil-stabilizers',
    'Foil Parts': 'foil-parts',
    'Foil Packages': 'foil-packages',
    'Wakeboards': 'wakeboards',
    'Wake Boots': 'wake-boots',
    'Wakesurfers': 'wakesurf',
    'Wake Foil Boards': 'wake-foil-boards',
    'Wake Foils': 'wake-foils',
    'Wake Parts': 'wake-parts',
    'Wake Boot Parts': 'wake-parts',
    'Pumps': 'pumps',
    'Footstraps': 'foot-straps',
    'Trainer Kite': 'trainer-kites'
};

async function run() {
    try {
        console.log('Fetching Slingshot & Ride Engine products...');
        const productsRes = await pool.query(`
            SELECT id, name, product_type 
            FROM products 
            WHERE brand IS NULL OR brand = 'Slingshot' OR brand = 'Ride Engine'
        `);
        const products = productsRes.rows;
        console.log(`Found ${products.length} products.`);

        console.log('Fetching collections...');
        const collectionsRes = await pool.query("SELECT id, slug FROM collections WHERE source IN ('slingshot', 'rideengine')");
        const collections = collectionsRes.rows;
        const slugToId = collections.reduce((acc, c) => ({ ...acc, [c.slug]: c.id }), {});

        let associationCount = 0;

        for (const product of products) {
            const dbOps = [];
            const productNameLower = product.name.toLowerCase();

            // 1. Keyword Matching
            for (const [slug, keywords] of Object.entries(KEYWORD_MAPPING)) {
                if (slugToId[slug]) {
                    const match = keywords.some(k => productNameLower.includes(k.toLowerCase()));
                    if (match) {
                        dbOps.push(pool.query(`
                            INSERT INTO collection_products (collection_id, product_id, sort_order)
                            VALUES ($1, $2, 0)
                            ON CONFLICT (collection_id, product_id) DO NOTHING
                        `, [slugToId[slug], product.id]));
                    }
                }
            }

            // 2. Type Mapping Fallback
            const typeSlug = TYPE_MAPPING[product.product_type];
            if (typeSlug && slugToId[typeSlug]) {
                dbOps.push(pool.query(`
                    INSERT INTO collection_products (collection_id, product_id, sort_order)
                    VALUES ($1, $2, 0)
                    ON CONFLICT (collection_id, product_id) DO NOTHING
                `, [slugToId[typeSlug], product.id]));
            }

            const results = await Promise.all(dbOps);
            associationCount += results.filter(r => r.rowCount > 0).length;
        }

        console.log(`\n--- Association Complete ---`);
        console.log(`Associated ${associationCount} new product-collection links.`);

    } catch (e) {
        console.error('Fatal error:', e);
    } finally {
        await pool.end();
    }
}

run();
