const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });
const { S3Client, HeadObjectCommand } = require('@aws-sdk/client-s3');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const s3 = new S3Client({
    endpoint: process.env.RAILWAY_STORAGE_ENDPOINT,
    region: process.env.RAILWAY_STORAGE_REGION || 'us-east-1',
    credentials: {
        accessKeyId: process.env.RAILWAY_STORAGE_ACCESS_KEY_ID,
        secretAccessKey: process.env.RAILWAY_STORAGE_SECRET_ACCESS_KEY,
    },
});
const BUCKET = process.env.RAILWAY_STORAGE_BUCKET_PUBLIC;

// FIXED: no longer strips product-images/
const prefixesToRemove = ['slingshotnewimages-hw-tht'];
function fixedGetKeyFromUrl(value) {
    if (!value) return null;
    let key = value.startsWith('/') ? value.slice(1) : value;
    let cleaning = true;
    while (cleaning) {
        cleaning = false;
        for (const prefix of prefixesToRemove) {
            if (key.startsWith(prefix + '/')) {
                key = key.slice(prefix.length + 1);
                cleaning = true;
            }
        }
    }
    return key || null;
}

async function checkExists(key) {
    try {
        await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
        return true;
    } catch { return false; }
}

async function run() {
    // Test product-images/ paths
    const r = await pool.query("SELECT storage_path FROM product_images_railway WHERE storage_path LIKE 'product-images/%' LIMIT 3");
    console.log('=== product-images/ paths (FIXED) ===');
    for (const row of r.rows) {
        const key = fixedGetKeyFromUrl(row.storage_path);
        const exists = await checkExists(key);
        console.log(exists ? 'OK' : 'BROKEN', key);
    }

    // Test ride-engine/ paths
    const r2 = await pool.query("SELECT storage_path FROM product_images_railway WHERE storage_path LIKE 'ride-engine/%' LIMIT 3");
    console.log('\n=== ride-engine/ paths (FIXED) ===');
    for (const row of r2.rows) {
        const key = fixedGetKeyFromUrl(row.storage_path);
        const exists = await checkExists(key);
        console.log(exists ? 'OK' : 'BROKEN', key);
    }

    // Test collections/ paths
    const r3 = await pool.query("SELECT image_url FROM collections WHERE image_url LIKE 'collections/%' LIMIT 3");
    console.log('\n=== collections/ paths (FIXED) ===');
    for (const row of r3.rows) {
        const key = fixedGetKeyFromUrl(row.image_url);
        const exists = await checkExists(key);
        console.log(exists ? 'OK' : 'BROKEN', key);
    }

    pool.end();
}
run();
