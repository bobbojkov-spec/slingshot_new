#!/usr/bin/env node
/**
 * Restore Collection Image Paths
 * 
 * Fixes the database to use S3 bucket paths instead of external Shopify URLs
 * for collection hero images. Images are stored in bucket as: collections/[slug]/hero.jpg
 */

require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function restoreImagePaths() {
    try {
        console.log('🔧 Restoring collection image paths to S3 bucket...\n');

        // Get all Slingshot collections with external URLs
        const { rows: collections } = await pool.query(`
            SELECT id, slug, image_url 
            FROM collections 
            WHERE source = 'slingshot' 
            AND image_url LIKE 'http%'
        `);

        console.log(`Found ${collections.length} collections with external URLs.\n`);

        let updated = 0;

        for (const collection of collections) {
            // Convert slug to bucket path: collections/[slug]/hero.jpg
            const bucketPath = `collections/${collection.slug}/hero.jpg`;

            await pool.query(
                'UPDATE collections SET image_url = $1, updated_at = NOW() WHERE id = $2',
                [bucketPath, collection.id]
            );

            console.log(`✓ ${collection.slug}: ${bucketPath}`);
            updated++;
        }

        console.log(`\n✅ Updated ${updated} collection image paths to S3 bucket.`);

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

restoreImagePaths();
