
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const sharp = require('sharp');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { crypto } = require('crypto');

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
        const collectionsDir = path.join(process.cwd(), 'public/collections');
        const files = fs.readdirSync(collectionsDir).filter(f => f.endsWith('.jpg') || f.endsWith('.png'));

        console.log(`Found ${files.length} hero images to process.`);

        for (const filename of files) {
            // derive slug from filename (e.g. "kite-main-hero.jpg" -> "kite-main")
            const slug = filename.replace('-hero.jpg', '').replace('-hero.png', '');

            // Find collection by slug
            const res = await pool.query('SELECT id FROM collections WHERE slug = $1', [slug]);
            if (res.rows.length === 0) {
                console.log(`⚠️  Collection not found for slug: ${slug} (file: ${filename})`);
                continue;
            }

            const collectionId = res.rows[0].id;
            console.log(`\nProcessing: ${filename} for collection ${slug} (${collectionId})`);

            const filePath = path.join(collectionsDir, filename);
            const buffer = fs.readFileSync(filePath);

            // Basic check for HTML/Invalid content
            const contentStart = buffer.slice(0, 100).toString();
            if (contentStart.includes('<!DOCTYPE html') || contentStart.includes('<html')) {
                console.log(`  ❌ Skipping invalid image (HTML content detected): ${filename}`);
                continue;
            }

            const baseBuffer = await sharp(buffer).jpeg({ quality: 100 }).toBuffer();

            const bundleId = Math.random().toString(36).substring(2, 12);
            const timestamp = Date.now();
            const baseFolder = `collections/hero/${collectionId}/${bundleId}`;

            let fullPath = '';

            for (const variant of VARIANTS) {
                const transformed = await sharp(baseBuffer)
                    .resize(variant.resize)
                    .jpeg({ quality: variant.quality })
                    .toBuffer();

                const key = `${baseFolder}/${variant.size}/${timestamp}-${filename}`;
                await uploadToS3(key, transformed, 'image/jpeg');
                console.log(`  ✅ Uploaded ${variant.size}`);

                if (variant.size === 'full') {
                    fullPath = key;
                }
            }

            if (fullPath) {
                await pool.query('UPDATE collections SET image_url = $1 WHERE id = $2', [fullPath, collectionId]);
                console.log(`  🎉 DB Updated with path: ${fullPath}`);
            }
        }

        console.log('\n--- Hero Image Sync Complete ---');

    } catch (e) {
        console.error('Fatal error:', e);
    } finally {
        await pool.end();
    }
}

run();
