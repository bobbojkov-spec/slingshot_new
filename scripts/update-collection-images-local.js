#!/usr/bin/env node
/**
 * Update Collection Images to Use Local Paths
 * 
 * Updates all Slingshot collections to use local image paths
 * instead of CDN URLs
 */

require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function updateImagePaths() {
    const client = await pool.connect();

    try {
        console.log('🔄 Updating collection image paths to local...\n');

        // Get all Slingshot collections
        const result = await client.query(
            `SELECT id, slug FROM collections WHERE source = 'slingshot' ORDER BY slug`
        );

        let updated = 0;
        let missing = 0;

        for (const collection of result.rows) {
            const slug = collection.slug;
            const localImagePath = `/collections/${slug}-hero.jpg`;
            const publicPath = path.join(__dirname, '..', 'public', 'collections', `${slug}-hero.jpg`);

            // Check if local file exists
            if (fs.existsSync(publicPath)) {
                await client.query(
                    'UPDATE collections SET image_url = $1 WHERE id = $2',
                    [localImagePath, collection.id]
                );
                console.log(`  ✓ ${slug.padEnd(35)} → ${localImagePath}`);
                updated++;
            } else {
                console.log(`  ✗ ${slug.padEnd(35)} → MISSING`);
                missing++;
            }
        }

        console.log(`\n✅ Update complete!`);
        console.log(`  📊 Updated: ${updated}`);
        console.log(`  ⚠️  Missing: ${missing}`);
        console.log(`  📝 Total: ${result.rows.length}`);

    } catch (error) {
        console.error('\n❌ Update failed:', error.message);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

// Run update
updateImagePaths().catch(error => {
    console.error(error);
    process.exit(1);
});
