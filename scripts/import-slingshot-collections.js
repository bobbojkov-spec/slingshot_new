#!/usr/bin/env node
/**
 * Import Slingshot Collections
 * 
 * Auto-imports all scraped Slingshot collections into the database
 * with source='slingshot' and creates English + Bulgarian translations
 */

require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Load scraped collections data
const collectionsPath = path.join(__dirname, '../slingshot-collections/all-collections.json');
const collections = JSON.parse(fs.readFileSync(collectionsPath, 'utf8'));

console.log(`📦 Importing ${collections.length} Slingshot collections...\n`);

async function importCollections() {
    let inserted = 0;
    let updated = 0;
    let skipped = 0;

    for (const collection of collections) {
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // Check if collection already exists (by source + slug, not handle)
            const existing = await client.query(
                'SELECT id FROM collections WHERE source = $1 AND slug = $2',
                ['slingshot', collection.slug]
            );

            let collectionId;
            // Use source-prefixed handle to avoid conflicts with existing collections
            const handle = `slingshot-${collection.slug}`;

            if (existing.rows.length > 0) {
                // Update existing collection
                collectionId = existing.rows[0].id;

                // Only update image_url if the current value is an external URL or null
                // Don't overwrite S3 bucket paths!
                const currentImageUrl = await client.query(
                    'SELECT image_url FROM collections WHERE id = $1',
                    [collectionId]
                );

                const shouldUpdateImage = !currentImageUrl.rows[0]?.image_url ||
                    currentImageUrl.rows[0].image_url.startsWith('http');

                if (shouldUpdateImage) {
                    // Use bucket path if we have the local file, otherwise use external URL
                    const bucketPath = `collections/${collection.slug}/hero.jpg`;

                    await client.query(
                        `UPDATE collections 
               SET title = $1, 
                   handle = $2, 
                   image_url = $3,
                   subtitle = $4,
                   updated_at = NOW()
               WHERE id = $5`,
                        [
                            collection.title,
                            handle,
                            bucketPath, // Always prefer bucket path
                            collection.subtitle,
                            collectionId
                        ]
                    );
                } else {
                    // Keep existing bucket path, just update other fields
                    await client.query(
                        `UPDATE collections 
               SET title = $1, 
                   handle = $2,
                   subtitle = $3,
                   updated_at = NOW()
               WHERE id = $4`,
                        [
                            collection.title,
                            handle,
                            collection.subtitle,
                            collectionId
                        ]
                    );
                }
                updated++;
            } else {
                // Insert new collection
                const bucketPath = `collections/${collection.slug}/hero.jpg`;

                const insertResult = await client.query(
                    `INSERT INTO collections (source, slug, handle, title, image_url, subtitle, visible, sort_order)
           VALUES ($1, $2, $3, $4, $5, $6, true, 0)
           RETURNING id`,
                    [
                        'slingshot',
                        collection.slug,
                        handle,
                        collection.title,
                        bucketPath, // Use bucket path
                        collection.subtitle
                    ]
                );
                collectionId = insertResult.rows[0].id;
                inserted++;
            }

            // Upsert English translation
            await client.query(
                `INSERT INTO collection_translations (collection_id, language_code, title, subtitle)
         VALUES ($1, 'en', $2, $3)
         ON CONFLICT (collection_id, language_code) 
         DO UPDATE SET 
           title = EXCLUDED.title,
           subtitle = EXCLUDED.subtitle,
           updated_at = NOW()`,
                [collectionId, collection.title, collection.subtitle]
            );

            // Upsert Bulgarian translation (same as English for now, to be translated later)
            await client.query(
                `INSERT INTO collection_translations (collection_id, language_code, title, subtitle)
         VALUES ($1, 'bg', $2, $3)
         ON CONFLICT (collection_id, language_code) 
         DO UPDATE SET
           subtitle = EXCLUDED.subtitle,
           updated_at = NOW()`,
                [collectionId, collection.title, collection.subtitle]
            );

            await client.query('COMMIT');

            // Log progress
            if ((inserted + updated) % 10 === 0) {
                console.log(`  ✓ Processed ${inserted + updated} / ${collections.length}...`);
            }

        } catch (error) {
            await client.query('ROLLBACK');
            console.error(`  ❌ Error importing "${collection.title}":`, error.message);
            skipped++;
        } finally {
            client.release();
        }
    }

    console.log('\n✅ Import completed successfully!');
    console.log(`  📊 Inserted: ${inserted}`);
    console.log(`  🔄 Updated: ${updated}`);
    console.log(`  ⏭️  Skipped: ${skipped}`);
    console.log(`  📝 Total: ${inserted + updated} / ${collections.length}`);

    await pool.end();
}

// Run import
importCollections().catch(error => {
    console.error(error);
    process.exit(1);
});
