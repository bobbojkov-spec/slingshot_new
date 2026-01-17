#!/usr/bin/env node
/**
 * Fix Collection Image Paths to Use Thumb Version
 * 
 * Queries S3 bucket to find the 300px thumb versions of collection hero images
 * and updates the database to use them instead of full versions
 */

require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const s3 = new S3Client({
    endpoint: process.env.RAILWAY_STORAGE_ENDPOINT,
    region: process.env.RAILWAY_STORAGE_REGION,
    credentials: {
        accessKeyId: process.env.RAILWAY_STORAGE_ACCESS_KEY_ID,
        secretAccessKey: process.env.RAILWAY_STORAGE_SECRET_ACCESS_KEY,
    }
});

const BUCKET = process.env.RAILWAY_STORAGE_BUCKET_PUBLIC;

async function listS3Objects(prefix) {
    const command = new ListObjectsV2Command({
        Bucket: BUCKET,
        Prefix: prefix,
        MaxKeys: 1000
    });

    const response = await s3.send(command);
    return response.Contents || [];
}

async function fixCollectionImagePaths() {
    try {
        console.log('🔍 Searching S3 for collection thumb images...\n');

        // Get all collections
        const { rows: collections } = await pool.query(`
            SELECT id, slug, image_url 
            FROM collections 
            WHERE source = 'slingshot'
            ORDER BY slug
        `);

        let updated = 0;
        let notFound = 0;

        for (const collection of collections) {
            const prefix = `collections/hero/${collection.id}/`;

            try {
                // List all objects for this collection
                const objects = await listS3Objects(prefix);

                // Find the thumb version
                const thumbObject = objects.find(obj =>
                    obj.Key && obj.Key.includes('/thumb/')
                );

                if (thumbObject) {
                    const thumbPath = thumbObject.Key;

                    // Update database
                    await pool.query(
                        'UPDATE collections SET image_url = $1, updated_at = NOW() WHERE id = $2',
                        [thumbPath, collection.id]
                    );

                    console.log(`✓ ${collection.slug.padEnd(35)} → ${thumbPath}`);
                    updated++;
                } else {
                    console.log(`⚠ ${collection.slug.padEnd(35)} → No thumb found`);
                    notFound++;
                }
            } catch (error) {
                console.error(`❌ Error processing ${collection.slug}:`, error.message);
            }
        }

        console.log(`\n✅ Updated ${updated} collections to use thumb (300px) images`);
        console.log(`⚠️  Not found: ${notFound}`);

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

fixCollectionImagePaths();
