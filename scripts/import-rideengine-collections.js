const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('railway') || process.env.DATABASE_URL?.includes('rlwy.net')
        ? { rejectUnauthorized: false }
        : undefined,
});

async function run() {
    const client = await pool.connect();
    try {
        console.log('🚀 Starting RideEngine Collections Import...');

        // 1. Load Data
        const allCollections = JSON.parse(fs.readFileSync('scripts/scrape-rideengine/rideengine_data/raw/all_collections.json', 'utf8'));
        const pageMapping = JSON.parse(fs.readFileSync('rideengine-media/page-mapping.json', 'utf8'));

        console.log(`📊 Found ${allCollections.collections.length} collections in JSON.`);

        // 2. Process Collections
        for (const item of allCollections.collections) {
            const handle = item.handle;
            const title = item.title || handle.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
            const slug = `ride-engine-${handle}`; // Namespace the slug

            // Find hero image from mapping
            let heroImageUrl = null;
            const mapping = pageMapping[handle];
            if (mapping && mapping.images && mapping.images.length > 0) {
                // Try to find a good quality one (width=2000 or similar)
                const bestImage = mapping.images.find(img => img.includes('width=2000')) || mapping.images[0];
                heroImageUrl = bestImage;
            }

            console.log(`📦 Importing collection: ${title} (${slug})`);

            // 3. Upsert Collection
            const colRes = await client.query(`
        INSERT INTO collections (title, slug, handle, description, image_url, source, visible, sort_order, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
        ON CONFLICT (handle) DO UPDATE 
        SET title = EXCLUDED.title,
            description = EXCLUDED.description,
            handle = EXCLUDED.handle,
            image_url = EXCLUDED.image_url,
            visible = EXCLUDED.visible,
            updated_at = NOW()
        RETURNING id;
      `, [
                title,
                slug,
                handle,
                item.description || '',
                heroImageUrl,
                'rideengine',
                true,
                100 // Default sort order
            ]);

            const collectionId = colRes.rows[0].id;
            console.log(`   ✅ Collection created with ID: ${collectionId}`);

            // 4. Create Translation (English)
            await client.query(`
        INSERT INTO collection_translations (collection_id, language_code, title, subtitle, created_at, updated_at)
        VALUES ($1, $2, $3, $4, NOW(), NOW())
        ON CONFLICT (collection_id, language_code) DO UPDATE
        SET title = EXCLUDED.title,
            subtitle = EXCLUDED.subtitle,
            updated_at = NOW();
      `, [collectionId, 'en', title, item.description || '']);

            // 5. Link Products
            if (item.products && item.products.length > 0) {
                process.stdout.write(`   🔗 Linking products: `);
                for (const productData of item.products) {
                    // Find product by handle or title
                    let prodRes = await client.query('SELECT id FROM products WHERE handle = $1', [productData.handle]);

                    if (prodRes.rows.length === 0) {
                        prodRes = await client.query('SELECT id FROM products WHERE title = $1', [productData.title]);
                    }

                    if (prodRes.rows.length > 0) {
                        const productId = prodRes.rows[0].id;
                        await client.query(`
              INSERT INTO collection_products (collection_id, product_id, created_at)
              VALUES ($1, $2, NOW())
              ON CONFLICT (collection_id, product_id) DO NOTHING;
            `, [collectionId, productId]);
                        process.stdout.write('.');
                    } else {
                        process.stdout.write('x');
                    }
                }
                process.stdout.write('\n');
            }
        }

        console.log('✅ Import complete!');
    } catch (err) {
        console.error('❌ Import failed:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

run();
