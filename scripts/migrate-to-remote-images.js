
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const sharp = require('sharp');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

const s3 = new S3Client({
    endpoint: process.env.RAILWAY_STORAGE_ENDPOINT,
    region: process.env.RAILWAY_STORAGE_REGION,
    credentials: {
        accessKeyId: process.env.RAILWAY_STORAGE_ACCESS_KEY_ID,
        secretAccessKey: process.env.RAILWAY_STORAGE_SECRET_ACCESS_KEY,
    }
});

const BUCKET = process.env.RAILWAY_STORAGE_BUCKET_PUBLIC;

const VARIANTS = [
    { size: 'thumb', quality: 80, resize: { width: 300, fit: 'inside' } },
    { size: 'middle', quality: 85, resize: { width: 1000, fit: 'inside' } },
    { size: 'full', quality: 90, resize: { width: 1900, fit: 'inside' } },
];

async function uploadToS3(key, buffer, contentType) {
    await s3.send(new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        ACL: 'public-read'
    }));
    return key;
}

async function run() {
    try {
        console.log('Fetching collections with local or missing remote images...');
        const res = await pool.query(`
            SELECT id, slug, image_url 
            FROM collections 
            WHERE source = 'slingshot'
        `);

        console.log(`Checking ${res.rows.length} collections...`);

        const collectionsDir = path.join(process.cwd(), 'public/collections');

        for (const collection of res.rows) {
            let localFile = '';

            // Check if it's already a relative S3 path
            if (collection.image_url && collection.image_url.startsWith('collections/hero/')) {
                console.log(`⏩ Skipping ${collection.slug} (already remote)`);
                continue;
            }

            // If it's a local path like /collections/bars-hero.jpg
            if (collection.image_url && collection.image_url.startsWith('/collections/')) {
                const filename = path.basename(collection.image_url);
                localFile = path.join(collectionsDir, filename);
            } else {
                // Otherwise try to find it by slug (standard naming)
                localFile = path.join(collectionsDir, `${collection.slug}-hero.jpg`);
                if (!fs.existsSync(localFile)) {
                    localFile = path.join(collectionsDir, `${collection.slug}-hero.png`);
                }
            }

            if (!fs.existsSync(localFile)) {
                console.log(`⚠️  Local file not found for ${collection.slug}: ${localFile}`);
                continue;
            }

            // Skip if it's an HTML 404
            const initialBuffer = fs.readFileSync(localFile);
            const contentStart = initialBuffer.slice(0, 100).toString();
            if (contentStart.includes('<!DOCTYPE html') || contentStart.includes('<html')) {
                console.log(`  ❌ Skipping invalid image (HTML): ${collection.slug}`);
                continue;
            }

            console.log(`\n🚀 Migrating ${collection.slug} from ${localFile}...`);

            const buffer = fs.readFileSync(localFile);
            const baseBuffer = await sharp(buffer).jpeg({ quality: 100 }).toBuffer();

            const bundleId = Math.random().toString(36).substring(2, 12);
            const timestamp = Date.now();
            const baseFolder = `collections/hero/${collection.id}/${bundleId}`;
            const fileNameOnly = path.basename(localFile);

            let fullPath = '';

            for (const variant of VARIANTS) {
                const transformed = await sharp(baseBuffer)
                    .resize(variant.resize)
                    .jpeg({ quality: variant.quality })
                    .toBuffer();

                const key = `${baseFolder}/${variant.size}/${timestamp}-${fileNameOnly}`;
                await uploadToS3(key, transformed, 'image/jpeg');
                console.log(`  ✅ Uploaded ${variant.size}`);

                if (variant.size === 'full') {
                    fullPath = key;
                }
            }

            if (fullPath) {
                await pool.query('UPDATE collections SET image_url = $1 WHERE id = $2', [fullPath, collection.id]);
                console.log(`  🎉 DB Updated with path: ${fullPath}`);
            }
        }

        console.log('\n--- Migration Complete ---');

    } catch (e) {
        console.error('Fatal error:', e);
    } finally {
        await pool.end();
    }
}

run();
