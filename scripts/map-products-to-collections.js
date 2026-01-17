
require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

const MAPPING = {
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
    'Wake Boot Parts': 'wake-parts', // Common parts mapping
    'Pumps': 'pumps',
    'Footstraps': 'foot-straps',
    'Trainer Kite': 'trainer-kites'
};

async function run() {
    try {
        console.log('Fetching Slingshot products...');
        const productsRes = await pool.query(`
            SELECT id, name, product_type 
            FROM products 
            WHERE brand IS NULL OR brand = 'Slingshot'
        `);
        const products = productsRes.rows;
        console.log(`Found ${products.length} Slingshot products.`);

        console.log('Fetching collections...');
        const collectionsRes = await pool.query("SELECT id, slug FROM collections WHERE source = 'slingshot'");
        const collections = collectionsRes.rows;
        const slugToId = collections.reduce((acc, c) => ({ ...acc, [c.slug]: c.id }), {});

        let associationCount = 0;

        for (const product of products) {
            const slug = MAPPING[product.product_type];
            if (slug && slugToId[slug]) {
                const collectionId = slugToId[slug];

                // Insert into collection_products
                await pool.query(`
                    INSERT INTO collection_products (collection_id, product_id, sort_order)
                    VALUES ($1, $2, 0)
                    ON CONFLICT (collection_id, product_id) DO NOTHING
                `, [collectionId, product.id]);

                associationCount++;
            }
        }

        console.log(`\n--- Association Complete ---`);
        console.log(`Associated ${associationCount} products to collections based on product_type.`);

    } catch (e) {
        console.error('Fatal error:', e);
    } finally {
        await pool.end();
    }
}

run();
