import { Pool } from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

dotenv.config({ path: '.env.local' });

const SCRAPED_DATA_PATH = '/Users/borislavbojkov/dev/rideengine-eu-scrape/scraped_data.json';
const DEFAULT_COLOR_ID = '3c442fd5-1041-4adb-bd82-4943f6f3f593'; // blue

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const DRY_RUN = process.argv.includes('--dry-run');

const APPROVED_COLLECTION_HANDLES = new Set([
    'backpacks',
    'travel-duffle-luggage',
    'gear-bags',
    'mens-spring-suits',
    'mens-onsen-wetsuits',
    'womens-onsen-wetsuits',
    'womens-sensor-wetsuits',
    'roof-rack-accessories',
    'harness-parts-and-accessories',
    'harness-hooks-and-accessories',
    'hardgood-accessories',
    'boardshorts-and-changing-robes',
    'sup-surf-parts-acc'
]);

async function main() {
    if (DRY_RUN) console.log('🏃 DRY RUN MODE - No database changes will be committed.');

    if (!fs.existsSync(SCRAPED_DATA_PATH)) {
        console.error('Scraped data file not found!');
        return;
    }

    const data = JSON.parse(fs.readFileSync(SCRAPED_DATA_PATH, 'utf8'));
    console.log(`Loaded ${data.products.length} products and ${data.collections.length} collections from scrape.`);

    const client = await pool.connect();

    try {
        // 1. Fetch Existing Identifiers
        const { rows: existingProducts } = await client.query('SELECT title, handle FROM products');
        const { rows: existingVariants } = await client.query('SELECT sku FROM product_variants');
        const { rows: existingCollections } = await client.query('SELECT handle FROM collections');

        const productHandles = new Set(existingProducts.map(p => p.handle.toLowerCase()));
        const productNames = new Set(existingProducts.map(p => p.title.toLowerCase()));
        const variantSkus = new Set(existingVariants.map(v => v.sku?.toLowerCase()).filter(Boolean));
        const collectionHandles = new Set(existingCollections.map(c => c.handle.toLowerCase()));

        console.log(`Initial DB State: ${productHandles.size} products, ${variantSkus.size} skus, ${collectionHandles.size} collections.`);

        // 2. Import/Update Collections
        const collectionIdMap = new Map<string, string>(); // handle -> uuid

        // Fetch all collections to populate the map and check for missing heroes
        const { rows: allCollections } = await client.query('SELECT id, handle, image_url FROM collections');
        const existingColMap = new Map(allCollections.map(c => [c.handle.toLowerCase(), c]));
        allCollections.forEach(c => collectionIdMap.set(c.handle.toLowerCase(), c.id));

        let newCollectionsCount = 0;
        let updatedCollectionsCount = 0;

        for (const col of data.collections) {
            const handle = col.handle.toLowerCase();
            const existing = existingColMap.get(handle);

            if (existing) {
                // Update existing collection hero image if missing
                if (!existing.image_url && col.heroImage) {
                    console.log(`  Updating Collection Hero: ${col.title}`);
                    if (!DRY_RUN) {
                        await client.query(
                            'UPDATE collections SET image_url = $1, video_url = $2, updated_at = NOW() WHERE id = $3',
                            [col.heroImage, col.heroVideo || null, existing.id]
                        );
                    }
                    updatedCollectionsCount++;
                }
                continue;
            }

            // ONLY import if it's in the approved list
            if (!APPROVED_COLLECTION_HANDLES.has(handle)) {
                // console.log(`  Skipping Collection (Not in approved list): ${col.title}`);
                continue;
            }

            console.log(`  Importing Collection: ${col.title}`);
            const id = uuidv4();
            if (!DRY_RUN) {
                await client.query(
                    `INSERT INTO collections (id, title, handle, description, image_url, video_url, subtitle, source, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
                    [id, col.title, col.handle, col.description, col.heroImage, col.heroVideo, col.subtitle, 'Ride Engine EU']
                );
            }
            collectionIdMap.set(handle, id);
            collectionHandles.add(handle);
            newCollectionsCount++;
        }

        // 3. Import Products
        let newProductsCount = 0;
        let newVariantsCount = 0;

        for (const prod of data.products) {
            const handle = prod.handle.toLowerCase();
            const title = prod.title.toLowerCase();

            const hasExistingSku = prod.variants.some((v: any) => v.sku && variantSkus.has(v.sku.toLowerCase()));

            if (productHandles.has(handle) || productNames.has(title) || hasExistingSku) {
                continue;
            }

            console.log(`  Importing Product: ${prod.title}`);
            const productId = uuidv4();

            if (!DRY_RUN) {
                // Insert Product
                await client.query(
                    `INSERT INTO products (id, shopify_product_id, title, handle, description_html, specs_html, brand, subtitle, hero_image_url, video_url, vendor, product_type, status, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())`,
                    [
                        productId, String(prod.id), prod.title, prod.handle,
                        prod.description, prod.specsHtml, prod.brand,
                        prod.subtitle || null, prod.heroImage || null, prod.heroVideo || null,
                        prod.brand, 'Scraped', 'active'
                    ]
                );

                // Insert Variants & Availability
                for (const variant of prod.variants) {
                    const variantId = uuidv4();
                    await client.query(
                        `INSERT INTO product_variants (id, shopify_variant_id, product_id, title, price, sku, compare_at_price, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
                        [variantId, String(variant.id), productId, variant.title, variant.price, variant.sku, variant.compareAtPrice]
                    );

                    await client.query(
                        `INSERT INTO product_variant_availability (variant_id, color_id, stock_qty, is_active, updated_at)
             VALUES ($1, $2, $3, $4, NOW())`,
                        [variantId, DEFAULT_COLOR_ID, 100, true]
                    );
                    newVariantsCount++;
                }

                // Insert Images
                if (prod.images && prod.images.length > 0) {
                    for (let i = 0; i < prod.images.length; i++) {
                        await client.query(
                            `INSERT INTO product_images (id, product_id, url, sort_order)
               VALUES ($1, $2, $3, $4)`,
                            [uuidv4(), productId, prod.images[i], i]
                        );
                    }
                }
            }

            productHandles.add(handle);
            productNames.add(title);
            newProductsCount++;
        }

        // 4. Link Products to Collections
        console.log('\nLinking products to collections...');
        // Refresh product handle map to include both old and new
        const { rows: productsFromDb } = await client.query('SELECT id, handle FROM products');
        const productHandleToId = new Map(productsFromDb.map(p => [p.handle.toLowerCase(), p.id]));

        let linksCount = 0;
        for (const col of data.collections) {
            const colId = collectionIdMap.get(col.handle.toLowerCase());
            if (!colId) continue;

            // Fetch products for this collection from Shopify products.json
            try {
                const prodRes = await fetch(`https://rideengine.eu/collections/${col.handle}/products.json`);
                if (!prodRes.ok) continue;
                const { products } = await prodRes.json() as any;

                for (const p of products) {
                    const productId = productHandleToId.get(p.handle.toLowerCase());
                    if (productId) {
                        if (!DRY_RUN) {
                            await client.query(
                                `INSERT INTO collection_products (collection_id, product_id)
                 VALUES ($1, $2)
                 ON CONFLICT DO NOTHING`,
                                [colId, productId]
                            );
                        }
                        linksCount++;
                    }
                }
            } catch (e: any) {
                console.error(`  Failed to link for collection ${col.handle}:`, e.message);
            }
        }

        console.log('\nImport Summary:');
        console.log(`- Collections added: ${newCollectionsCount}`);
        console.log(`- Collections updated with Hero: ${updatedCollectionsCount}`);
        console.log(`- Products added: ${newProductsCount}`);
        console.log(`- Variants added: ${newVariantsCount}`);
        console.log(`- Product-Collection links established: ${linksCount}`);
        console.log(`- Stock set to 100 for all new variants.`);

    } catch (err) {
        console.error('Error during import:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
