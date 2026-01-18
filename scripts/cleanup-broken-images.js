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

async function checkFile(key) {
    try {
        await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
        return true;
    } catch (e) {
        if (e.name === 'NotFound' || e.$metadata?.httpStatusCode === 404) {
            return false;
        }
        // console.error(`Error checking ${key}:`, e.message);
        return false; // Treat error as missing for now if access denied/etc?
    }
}

function getKeyFromUrl(url) {
    if (!url) return null;
    let key = url;
    if (key.startsWith('http')) {
        // SAFEGUARD: Only check files in our bucket
        if (!key.includes('storage.railway.app') && !key.includes('slingshotnewimages')) {
            // External URL (Shopify, etc) - Skip check
            return null;
        }

        try {
            const urlObj = new URL(key);
            const pathParts = urlObj.pathname.split('/');
            const keyIndex = pathParts.indexOf('product-images');
            if (keyIndex !== -1) {
                key = pathParts.slice(keyIndex).join('/');
            } else if (pathParts.length > 2) {
                // Fallback: assume bucket is first segment
                key = pathParts.slice(2).join('/');
            }
        } catch (e) { return null; }
    }
    return key;
}

async function run() {
    console.log('Fetching images...');
    const res = await pool.query("SELECT id, product_id, url FROM product_images");
    console.log(`Checking ${res.rowCount} images in DB...`);

    let deleted = 0;
    for (const row of res.rows) {
        const key = getKeyFromUrl(row.url);
        if (!key) {
            console.log(`Skipping invalid URL id=${row.id}: ${row.url}`);
            continue;
        }

        const exists = await checkFile(key);
        if (!exists) {
            console.log(`MISSING: ${key} (ID: ${row.id}, Product: ${row.product_id})`);
            await pool.query("DELETE FROM product_images WHERE id = $1", [row.id]);
            deleted++;
        } else {
            // console.log(`OK: ${key}`);
        }
    }


    console.log(`Finished table 1. Deleted ${deleted} broken images.`);

    // Cleanup product_images_railway
    console.log('Fetching images from product_images_railway...');
    const res2 = await pool.query("SELECT id, product_id, storage_path FROM product_images_railway");
    console.log(`Checking ${res2.rowCount} railway images...`);

    let deleted2 = 0;
    for (const row of res2.rows) {
        const key = getKeyFromUrl(row.storage_path);
        if (!key) continue;

        const exists = await checkFile(key);
        if (!exists) {
            console.log(`MISSING (Railway): ${key} (ID: ${row.id})`);
            await pool.query("DELETE FROM product_images_railway WHERE id = $1", [row.id]);
            deleted2++;
        }
    }
    console.log(`Finished table 2. Deleted ${deleted2} broken images.`);

    pool.end();
}

run();
