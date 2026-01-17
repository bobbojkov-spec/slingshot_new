#!/usr/bin/env node
/**
 * Upload Collection Images to S3
 * 
 * Uploads all local collection hero images to S3 bucket
 * and updates database to use S3 URLs
 */

require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const { S3Client, PutObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Railway Storage (S3-compatible) setup
const s3Client = new S3Client({
    region: process.env.RAILWAY_STORAGE_REGION || 'auto',
    endpoint: process.env.RAILWAY_STORAGE_ENDPOINT,
    credentials: {
        accessKeyId: process.env.RAILWAY_STORAGE_ACCESS_KEY_ID,
        secretAccessKey: process.env.RAILWAY_STORAGE_SECRET_KEY
    }
});

const BUCKET_NAME = process.env.RAILWAY_STORAGE_BUCKET_PUBLIC;
const CDN_URL = process.env.CDN_URL || process.env.RAILWAY_STORAGE_ENDPOINT;

async function checkS3Exists(key) {
    try {
        await s3Client.send(new HeadObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key
        }));
        return true;
    } catch (error) {
        return false;
    }
}

async function uploadToS3(localPath, key) {
    const fileContent = fs.readFileSync(localPath);

    await s3Client.send(new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: fileContent,
        ContentType: 'image/jpeg',
        CacheControl: 'public, max-age=31536000'
    }));
}

async function uploadCollectionImages() {
    const client = await pool.connect();

    try {
        console.log('🚀 Uploading collection images to S3...\n');
        console.log(`📦 Bucket: ${BUCKET_NAME}`);
        console.log(`🌐 CDN: ${CDN_URL}\n`);

        // Get all Slingshot collections
        const result = await client.query(
            `SELECT id, slug, image_url FROM collections WHERE source = 'slingshot' ORDER BY slug`
        );

        let uploaded = 0;
        let skipped = 0;
        let missing = 0;
        let updated = 0;

        for (const collection of result.rows) {
            const slug = collection.slug;
            const localPath = path.join(__dirname, '..', 'public', 'collections', `${slug}-hero.jpg`);
            const s3Key = `collections/${slug}-hero.jpg`;
            const s3Url = `${CDN_URL}/${s3Key}`;

            // Check if local file exists
            if (!fs.existsSync(localPath)) {
                console.log(`  ⚠️  ${slug.padEnd(35)} → No local file`);
                missing++;
                continue;
            }

            // Check if already in S3
            const existsInS3 = await checkS3Exists(s3Key);

            if (existsInS3) {
                console.log(`  ⏭️  ${slug.padEnd(35)} → Already in S3`);
                skipped++;

                // Update database if using local path
                if (collection.image_url && collection.image_url.startsWith('/collections')) {
                    await client.query(
                        'UPDATE collections SET image_url = $1 WHERE id = $2',
                        [s3Url, collection.id]
                    );
                    console.log(`      └─ Updated DB to use S3 URL`);
                    updated++;
                }
            } else {
                // Upload to S3
                await uploadToS3(localPath, s3Key);

                // Update database
                await client.query(
                    'UPDATE collections SET image_url = $1 WHERE id = $2',
                    [s3Url, collection.id]
                );

                console.log(`  ✅ ${slug.padEnd(35)} → Uploaded & DB updated`);
                uploaded++;
            }
        }

        console.log(`\n✅ Upload complete!`);
        console.log(`  📤 Uploaded: ${uploaded}`);
        console.log(`  ⏭️  Skipped (already in S3): ${skipped}`);
        console.log(`  🔄 DB updated: ${updated}`);
        console.log(`  ⚠️  Missing: ${missing}`);
        console.log(`  📝 Total: ${result.rows.length}`);

        console.log(`\n💡 You can now safely delete local images from:`);
        console.log(`   - slingshot-collections/`);
        console.log(`   - public/collections/`);

    } catch (error) {
        console.error('\n❌ Upload failed:', error.message);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

// Run upload
uploadCollectionImages().catch(error => {
    console.error(error);
    process.exit(1);
});
