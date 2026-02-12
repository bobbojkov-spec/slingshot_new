/**
 * Comprehensive image cleanup script
 *
 * 1. DELETE all product_images rows with external/Shopify URLs (not bucket paths)
 * 2. SET NULL on products.og_image_url with external URLs
 * 3. DELETE duplicate rows in product_images_railway
 * 4. S3-check all remaining product_images_railway entries - delete if file missing
 */
const { S3Client, HeadObjectCommand } = require('@aws-sdk/client-s3');
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const s3 = new S3Client({
    endpoint: process.env.RAILWAY_STORAGE_ENDPOINT,
    region: process.env.RAILWAY_STORAGE_REGION || 'us-east-1',
    credentials: {
        accessKeyId: process.env.RAILWAY_STORAGE_ACCESS_KEY_ID,
        secretAccessKey: process.env.RAILWAY_STORAGE_SECRET_ACCESS_KEY,
    },
});
const BUCKET = process.env.RAILWAY_STORAGE_BUCKET_PUBLIC || 'slingshotnewimages-hw-tht';

async function checkS3(key) {
    try {
        await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
        return true;
    } catch {
        return false;
    }
}

async function run() {
    console.log('========================================');
    console.log('STEP 1: Delete external URLs from product_images');
    console.log('========================================');
    const r1 = await pool.query(`
        DELETE FROM product_images
        WHERE url LIKE 'http%'
           OR url LIKE 's/files/%'
           OR url LIKE '/s/files/%'
        RETURNING id, product_id, url
    `);
    console.log(`Deleted ${r1.rowCount} external URL entries from product_images`);
    if (r1.rowCount > 0) {
        r1.rows.slice(0, 5).forEach(row => console.log(`  ${row.url.substring(0, 80)}`));
        if (r1.rowCount > 5) console.log(`  ... and ${r1.rowCount - 5} more`);
    }

    console.log('\n========================================');
    console.log('STEP 2: Clear external og_image_url from products');
    console.log('========================================');
    const r2 = await pool.query(`
        UPDATE products
        SET og_image_url = NULL
        WHERE og_image_url IS NOT NULL
          AND og_image_url <> ''
          AND (og_image_url LIKE 'http%' OR og_image_url LIKE 's/files/%')
        RETURNING id, slug, og_image_url
    `);
    console.log(`Cleared ${r2.rowCount} external og_image_url entries`);
    r2.rows.forEach(row => console.log(`  ${row.slug}`));

    console.log('\n========================================');
    console.log('STEP 3: Delete duplicates from product_images_railway');
    console.log('========================================');
    const r3 = await pool.query(`
        DELETE FROM product_images_railway
        WHERE id NOT IN (
            SELECT MIN(id::text)::uuid FROM product_images_railway
            GROUP BY product_id, storage_path
        )
        RETURNING id
    `);
    console.log(`Deleted ${r3.rowCount} duplicate entries from product_images_railway`);

    console.log('\n========================================');
    console.log('STEP 4: S3-check all product_images_railway entries');
    console.log('========================================');
    const r4 = await pool.query(`SELECT id, product_id, storage_path FROM product_images_railway ORDER BY product_id`);
    console.log(`Checking ${r4.rowCount} entries against S3...`);

    let missing = 0;
    let checked = 0;
    for (const row of r4.rows) {
        if (!row.storage_path) {
            await pool.query('DELETE FROM product_images_railway WHERE id = $1', [row.id]);
            missing++;
            continue;
        }
        const exists = await checkS3(row.storage_path);
        if (!exists) {
            console.log(`  MISSING: ${row.storage_path.substring(0, 80)}`);
            await pool.query('DELETE FROM product_images_railway WHERE id = $1', [row.id]);
            missing++;
        }
        checked++;
        if (checked % 500 === 0) {
            console.log(`  ... checked ${checked}/${r4.rowCount} (${missing} missing so far)`);
        }
    }
    console.log(`Checked ${checked} entries. Deleted ${missing} with missing S3 files.`);

    console.log('\n========================================');
    console.log('STEP 5: S3-check remaining product_images entries');
    console.log('========================================');
    const r5 = await pool.query(`SELECT id, product_id, url FROM product_images`);
    console.log(`Checking ${r5.rowCount} remaining product_images entries...`);
    let missing5 = 0;
    for (const row of r5.rows) {
        if (!row.url) continue;
        const exists = await checkS3(row.url);
        if (!exists) {
            console.log(`  MISSING: ${row.url.substring(0, 80)}`);
            await pool.query('DELETE FROM product_images WHERE id = $1', [row.id]);
            missing5++;
        }
    }
    console.log(`Deleted ${missing5} missing entries from product_images.`);

    console.log('\n========================================');
    console.log('SUMMARY');
    console.log('========================================');
    console.log(`product_images: deleted ${r1.rowCount} external URLs + ${missing5} missing S3`);
    console.log(`products.og_image_url: cleared ${r2.rowCount}`);
    console.log(`product_images_railway: deleted ${r3.rowCount} duplicates + ${missing} missing S3`);

    // Final counts
    const final1 = await pool.query('SELECT count(*) as cnt FROM product_images');
    const final2 = await pool.query('SELECT count(*) as cnt FROM product_images_railway');
    console.log(`\nFinal counts:`);
    console.log(`  product_images: ${final1.rows[0].cnt}`);
    console.log(`  product_images_railway: ${final2.rows[0].cnt}`);

    pool.end();
}

run().catch(e => { console.error(e); pool.end(); });
