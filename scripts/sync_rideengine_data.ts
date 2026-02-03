import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SCRAPED_DATA_PATH = path.join(process.cwd(), 'scraped_data', 'rideengine_sync_data.json');
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const DRY_RUN = process.argv.includes('--dry-run');

async function main() {
    if (DRY_RUN) console.log('🏃 DRY RUN MODE - No database changes will be committed.');
    if (!fs.existsSync(SCRAPED_DATA_PATH)) {
        console.error(`Scraped data file not found at ${SCRAPED_DATA_PATH}`);
        process.exit(1);
    }

    const scrapedData = JSON.parse(fs.readFileSync(SCRAPED_DATA_PATH, 'utf-8'));
    console.log(`Loaded ${scrapedData.length} products from scraped data.`);

    const client = await pool.connect();
    let updatedProductsCount = 0;
    let updatedVariantsCount = 0;
    let missedProductsCount = 0;

    try {
        for (const item of scrapedData) {
            console.log(`Processing: ${item.title} (${item.handle})...`);

            // 1. Try to find the product in our DB
            const productRes = await client.query(
                `SELECT id, title, handle FROM products 
                 WHERE (shopify_product_id = $1 OR handle = $2 OR title ILIKE $3) 
                 AND (brand = 'Ride Engine' OR vendor = 'Ride Engine')
                 LIMIT 1`,
                [String(item.id), item.handle, item.title]
            );

            if (productRes.rows.length === 0) {
                console.log(`  [MISS] Product not found in database.`);
                missedProductsCount++;
                continue;
            }

            const productId = productRes.rows[0].id;
            const dbTitle = productRes.rows[0].title;
            console.log(`  [MATCH] Found in DB as: ${dbTitle} (Internal ID: ${productId})`);

            // 2. Update Product SKU, Features, and Shopify ID
            if (!DRY_RUN) {
                await client.query(
                    `UPDATE products 
                     SET sku = COALESCE(sku, $1), 
                         specs_html = COALESCE($2, specs_html),
                         shopify_product_id = COALESCE(shopify_product_id, $3),
                         updated_at = NOW()
                     WHERE id = $4`,
                    [item.sku, item.features_html, String(item.id), productId]
                );
            } else {
                console.log(`  [DRY RUN] Would update product ${productId} with SKU: ${item.sku} and Shopify ID: ${item.id}`);
            }
            updatedProductsCount++;

            // 3. Update Variants (Price, Compare-at Price, SKU, Shopify ID)
            for (const variant of item.variants) {
                const isDiscounted = variant.compare_at_price && (Number(variant.compare_at_price) > Number(variant.price));

                if (!DRY_RUN) {
                    await client.query(
                        `UPDATE product_variants 
                         SET price = CASE WHEN $1 = true THEN $2 ELSE price END, 
                             compare_at_price = CASE WHEN $1 = true THEN $3 ELSE compare_at_price END, 
                             sku = COALESCE(sku, $4),
                             shopify_variant_id = COALESCE(shopify_variant_id, $5),
                             title = COALESCE(title, $6),
                             updated_at = NOW()
                         WHERE (shopify_variant_id = $5 OR (product_id = $7 AND (title = $6 OR name_en = $6 OR title = 'Default Title')))`,
                        [
                            isDiscounted,
                            variant.price.toString(),
                            variant.compare_at_price ? variant.compare_at_price.toString() : null,
                            variant.sku,
                            String(variant.id),
                            variant.title,
                            productId
                        ]
                    );
                    updatedVariantsCount++;
                } else {
                    console.log(`    [DRY RUN] Variant ${variant.title}: ${isDiscounted ? 'DISCOUNT FOUND (Will update price)' : 'No discount (Will only update SKU/ID if needed)'}`);
                    updatedVariantsCount++;
                }
            }
        }

        console.log('\nSync Summary:');
        console.log(`- Products updated: ${updatedProductsCount}`);
        console.log(`- Variants updated: ${updatedVariantsCount}`);
        console.log(`- Products missed: ${missedProductsCount}`);

    } catch (err) {
        console.error('Error during sync:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
