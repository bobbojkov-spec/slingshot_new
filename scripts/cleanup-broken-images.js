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
const KNOWN_HOSTS = [
    'slingshotnewimages-hw-tht.storage.railway.app',
    'slingshotnewimages-hw-tht.t3.storageapi.dev',
    'storage.railway.app',
];

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

function getKeyFromUrl(value) {
    if (!value) return null;

    if (!value.startsWith('http')) {
        const stripped = value.replace(/^\/+/, '');
        return stripped || null;
    }

    if (!KNOWN_HOSTS.some(host => value.includes(host))) {
        return null;
    }

    try {
        const { pathname } = new URL(value);
        const cleaned = pathname.replace(/^\//, '');
        if (!cleaned) return null;

        const segments = cleaned.split('/');
        const bucketIndex = segments.findIndex(segment => segment === BUCKET || segment === 'product-images');
        if (bucketIndex > 0) {
            return segments.slice(bucketIndex).join('/');
        }

        return cleaned;
    } catch (e) {
        return null;
    }
}

const columnTargets = [
    { table: 'products', idColumn: 'id', column: 'hero_image_url' },
    { table: 'products', idColumn: 'id', column: 'og_image_url' },
    { table: 'collections', idColumn: 'id', column: 'image_url' },
    { table: 'product_colors', idColumn: 'id', column: 'image_path' },
    { table: 'promotions', idColumn: 'id', column: 'image_url' },
];

async function cleanupAdditionalColumns(client) {
    let total = 0;

    for (const target of columnTargets) {
        const { table, idColumn, column } = target;
        console.log(`Checking ${table}.${column}...`);
        const res = await client.query(
            `SELECT ${idColumn}, ${column} FROM ${table} WHERE ${column} IS NOT NULL AND ${column} <> ''`
        );

        for (const row of res.rows) {
            const imageValue = row[column];
            const key = getKeyFromUrl(imageValue);
            if (!key) continue;

            const exists = await checkFile(key);
            if (!exists) {
                console.log(`Clearing ${table}.${column} for ${idColumn}=${row[idColumn]} (missing ${key})`);
                await client.query(
                    `UPDATE ${table} SET ${column} = NULL WHERE ${idColumn} = $1`,
                    [row[idColumn]]
                );
                total++;
            }
        }
        console.log(`   -> Done checking ${table}.${column}`);
    }

    console.log(`Finished column cleanup. Cleared ${total} broken references.`);
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

    await cleanupAdditionalColumns(pool);

    pool.end();
}

run();
