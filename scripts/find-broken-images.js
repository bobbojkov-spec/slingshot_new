const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
    const client = pool;

    // 1. Check product_images table - find URLs NOT starting with product-images/
    console.log('=== product_images: URLs not starting with product-images/ ===');
    const r1 = await client.query(`
        SELECT id, product_id, url
        FROM product_images
        WHERE url IS NOT NULL
          AND url <> ''
          AND url NOT LIKE 'product-images/%'
        ORDER BY product_id
    `);
    console.log(`Found ${r1.rowCount} broken entries:`);
    for (const row of r1.rows) {
        console.log(`  id=${row.id} product_id=${row.product_id} url=${row.url}`);
    }

    // 2. Check product_images_railway table
    console.log('\n=== product_images_railway: paths not starting with product-images/ ===');
    const r2 = await client.query(`
        SELECT id, product_id, storage_path
        FROM product_images_railway
        WHERE storage_path IS NOT NULL
          AND storage_path <> ''
          AND storage_path NOT LIKE 'product-images/%'
        ORDER BY product_id
    `);
    console.log(`Found ${r2.rowCount} broken entries:`);
    for (const row of r2.rows) {
        console.log(`  id=${row.id} product_id=${row.product_id} path=${row.storage_path}`);
    }

    // 3. Check products.hero_image_url
    console.log('\n=== products.hero_image_url: not starting with product-images/ ===');
    const r3 = await client.query(`
        SELECT id, slug, hero_image_url
        FROM products
        WHERE hero_image_url IS NOT NULL
          AND hero_image_url <> ''
          AND hero_image_url NOT LIKE 'product-images/%'
    `);
    console.log(`Found ${r3.rowCount} broken entries:`);
    for (const row of r3.rows) {
        console.log(`  id=${row.id} slug=${row.slug} hero_image_url=${row.hero_image_url}`);
    }

    // 4. Check products.og_image_url
    console.log('\n=== products.og_image_url: not starting with product-images/ ===');
    const r4 = await client.query(`
        SELECT id, slug, og_image_url
        FROM products
        WHERE og_image_url IS NOT NULL
          AND og_image_url <> ''
          AND og_image_url NOT LIKE 'product-images/%'
    `);
    console.log(`Found ${r4.rowCount} broken entries:`);
    for (const row of r4.rows) {
        console.log(`  id=${row.id} slug=${row.slug} og_image_url=${row.og_image_url}`);
    }

    // 5. Check collections.image_url
    console.log('\n=== collections.image_url: not starting with product-images/ ===');
    const r5 = await client.query(`
        SELECT id, slug, image_url
        FROM collections
        WHERE image_url IS NOT NULL
          AND image_url <> ''
          AND image_url NOT LIKE 'product-images/%'
    `);
    console.log(`Found ${r5.rowCount} broken entries:`);
    for (const row of r5.rows) {
        console.log(`  id=${row.id} slug=${row.slug} image_url=${row.image_url}`);
    }

    // 6. Check product_colors.image_path
    console.log('\n=== product_colors.image_path: not starting with product-images/ ===');
    const r6 = await client.query(`
        SELECT id, product_id, color_name, image_path
        FROM product_colors
        WHERE image_path IS NOT NULL
          AND image_path <> ''
          AND image_path NOT LIKE 'product-images/%'
    `);
    console.log(`Found ${r6.rowCount} broken entries:`);
    for (const row of r6.rows) {
        console.log(`  id=${row.id} product_id=${row.product_id} color=${row.color_name} path=${row.image_path}`);
    }

    // Summary
    const total = r1.rowCount + r2.rowCount + r3.rowCount + r4.rowCount + r5.rowCount + r6.rowCount;
    console.log(`\n=== TOTAL: ${total} broken image references found ===`);

    pool.end();
}

run().catch(e => { console.error(e); pool.end(); });
