import { Pool } from 'pg';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

// Use absolute path for .env.local
const envPath = path.join(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

async function downloadToBuffer(url: string): Promise<Buffer | null> {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
    } catch (e) {
        console.error(`  Error downloading ${url}:`, e);
        return null;
    }
}

async function main() {
    // DYNAMICALLY import storage AFTER dotenv
    const { uploadPublicImage, STORAGE_BUCKETS } = await import('../lib/railway/storage');

    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
    const client = await pool.connect();

    try {
        console.log('Migrating Ride Engine product images to Railway storage...');
        console.log('Using endpoint:', process.env.RAILWAY_STORAGE_ENDPOINT);

        // 1. Fetch all scraped products
        const { rows: products } = await client.query(
            "SELECT id, handle, hero_image_url FROM products WHERE product_type = 'Scraped'"
        );

        for (const product of products) {
            console.log(`\nProcessing ${product.handle} (${product.id})...`);

            // 2. Handle Hero Image
            if (product.hero_image_url && product.hero_image_url.includes('cdn.shopify.com')) {
                const buffer = await downloadToBuffer(product.hero_image_url);
                if (buffer) {
                    const fileName = product.hero_image_url.split('/').pop()?.split('?')[0] || `hero-${product.id}.jpg`;
                    const storagePath = `product-images/${product.id}/${fileName}`;

                    try {
                        const upload = await uploadPublicImage(storagePath, buffer, {
                            contentType: 'image/jpeg',
                            bucket: STORAGE_BUCKETS.PUBLIC
                        });

                        if (upload) {
                            await client.query(
                                "UPDATE products SET hero_image_url = $1 WHERE id = $2",
                                [storagePath, product.id]
                            );
                            console.log(`  Updated Hero: ${storagePath}`);
                        }
                    } catch (err) {
                        console.error(`  Failed to upload Hero for ${product.handle}:`, err);
                    }
                }
            }

            // 3. Handle Gallery Images
            const { rows: imageRows } = await client.query(
                "SELECT id, url FROM product_images WHERE product_id = $1",
                [product.id]
            );

            for (const img of imageRows) {
                if (img.url && img.url.includes('cdn.shopify.com')) {
                    const buffer = await downloadToBuffer(img.url);
                    if (buffer) {
                        const fileName = img.url.split('/').pop()?.split('?')[0] || `img-${img.id}.jpg`;
                        const storagePath = `product-images/${product.id}/${fileName}`;

                        try {
                            const upload = await uploadPublicImage(storagePath, buffer, {
                                contentType: 'image/jpeg',
                                bucket: STORAGE_BUCKETS.PUBLIC
                            });

                            if (upload) {
                                // Update product_images_railway
                                const bundleId = uuidv4();
                                await client.query(`
                                    INSERT INTO product_images_railway 
                                    (id, bundle_id, product_id, image_url, storage_path, size, display_order, created_at)
                                    VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
                                `, [uuidv4(), bundleId, product.id, img.url, storagePath, 'thumb', 0]);

                                await client.query(`
                                    INSERT INTO product_images_railway 
                                    (id, bundle_id, product_id, image_url, storage_path, size, display_order, created_at)
                                    VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
                                `, [uuidv4(), bundleId, product.id, img.url, storagePath, 'big', 0]);

                                console.log(`  Migrated Image: ${storagePath}`);
                            }
                        } catch (err) {
                            console.error(`  Failed to upload Image ${img.id} for ${product.handle}:`, err);
                        }
                    }
                }
            }
        }

        console.log('\nMigration Complete!');

    } finally {
        client.release();
        await pool.end();
    }
}

main().catch(error => {
    console.error('Unhandled script error:', error);
    process.exit(1);
});
