#!/usr/bin/env node
/**
 * Migrate Products from Product Types to Collections
 * 
 * Maps products that belong to product types to their corresponding collections.
 * This allows collections to replace product types functionality.
 */

require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Mapping of collection slugs to product type names
const COLLECTION_TO_PRODUCT_TYPE_MAP = {
    // Kite
    'kites': 'Kites',
    'bars': 'Bars',
    'twin-tips': 'Twin Tips',
    'surfboards': 'Surfboards',
    'kite-foil-boards': 'Kite Foil Boards',
    'kite-foils': 'Kite Foils',
    'kite-accessories': 'Kite Accessories',
    'foot-straps': 'Foot Straps',
    'trainer-kites': 'Trainer Kites',
    'kite-parts': 'Kite Parts',

    // Foil
    'foil-boards': 'Foil Boards',
    'foil-front-wings': 'Foil Front Wings',
    'foil-packages': 'Foil Packages',
    'foil-masts': 'Foil Masts',
    'foil-stabilizers': 'Foil Stabilizers',
    'foil-parts': 'Foil Parts',

    // Wake
    'wakeboards': 'Wakeboards',
    'wake-boots': 'Wake Boots',
    'wake-foil-boards': 'Wake Foil Boards',
    'wake-foils': 'Wake Foils',
    'wake-accessories': 'Wake Accessories',
    'wake-parts': 'Wake Parts',
    'wakesurf': 'Wakesurf',

    // Wing
    'wings': 'Wings',
    'wing-boards': 'Wing Boards',
    'wing-foils': 'Wing Foils',
    'wing-accessories': 'Wing Accessories',
    'wing-parts': 'Wing Parts',
    'wing-sup-boards': 'Wing SUP Boards',

    // Accessories
    'apparel': 'Apparel',
    'pumps': 'Pumps',
    'board-mounting-systems': 'Board Mounting Systems',
    'gummy-straps': 'Gummy Straps',
};

async function migrateProducts() {
    const client = await pool.connect();

    try {
        console.log('🔄 Migrating products from Product Types to Collections...\n');

        let totalMigrated = 0;
        let totalSkipped = 0;
        let totalNotFound = 0;

        for (const [collectionSlug, productTypeName] of Object.entries(COLLECTION_TO_PRODUCT_TYPE_MAP)) {
            // Get collection ID
            const collectionResult = await client.query(
                'SELECT id FROM collections WHERE source = $1 AND slug = $2',
                ['slingshot', collectionSlug]
            );

            if (collectionResult.rows.length === 0) {
                console.log(`  ⚠️  Collection "${collectionSlug}" not found - skipping`);
                totalNotFound++;
                continue;
            }

            const collectionId = collectionResult.rows[0].id;

            // Get all products with this product type
            const productsResult = await client.query(
                'SELECT id FROM products WHERE product_type = $1',
                [productTypeName]
            );

            if (productsResult.rows.length === 0) {
                console.log(`  ⏭️  "${collectionSlug.padEnd(30)}" → No products for "${productTypeName}"`);
                totalSkipped++;
                continue;
            }

            // Check if collection already has products
            const existingResult = await client.query(
                'SELECT COUNT(*) as count FROM collection_products WHERE collection_id = $1',
                [collectionId]
            );

            const existingCount = parseInt(existingResult.rows[0].count);

            if (existingCount > 0) {
                console.log(`  ⏭️  "${collectionSlug.padEnd(30)}" → Already has ${existingCount} products`);
                totalSkipped++;
                continue;
            }

            // Insert products into collection
            for (let i = 0; i < productsResult.rows.length; i++) {
                const productId = productsResult.rows[i].id;
                await client.query(
                    `INSERT INTO collection_products (collection_id, product_id, sort_order)
           VALUES ($1, $2, $3)
           ON CONFLICT DO NOTHING`,
                    [collectionId, productId, i]
                );
            }

            console.log(`  ✅ "${collectionSlug.padEnd(30)}" → Added ${productsResult.rows.length} products from "${productTypeName}"`);
            totalMigrated++;
        }

        console.log(`\n✅ Migration complete!`);
        console.log(`  📊 Collections migrated: ${totalMigrated}`);
        console.log(`  ⏭️  Skipped: ${totalSkipped}`);
        console.log(`  ⚠️  Not found: ${totalNotFound}`);

    } catch (error) {
        console.error('\n❌ Migration failed:', error.message);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

// Run migration
migrateProducts().catch(error => {
    console.error(error);
    process.exit(1);
});
