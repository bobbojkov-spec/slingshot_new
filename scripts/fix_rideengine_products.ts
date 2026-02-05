import { Pool } from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

dotenv.config({ path: '.env.local' });

const SCRAPED_DATA_PATH = '/Users/borislavbojkov/dev/rideengine-eu-scrape/scraped_data.json';
const RIDEENGINE_COLLECTION_ID = '1c8bb71a-6de8-4b87-9ed7-c80527b8f8a4';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function main() {
    const data = JSON.parse(fs.readFileSync(SCRAPED_DATA_PATH, 'utf8'));
    const client = await pool.connect();

    try {
        console.log('Fixing products and linking to Ride Engine collection...');

        const { rows: products } = await client.query("SELECT id, handle FROM products WHERE product_type = 'Scraped'");
        const prodMap = new Map(products.map(p => [p.handle, p.id]));

        let fixedHeroes = 0;
        let fixedImages = 0;
        let linkedProducts = 0;

        for (const prod of data.products) {
            const dbId = prodMap.get(prod.handle);
            if (!dbId) continue;

            // 1. Fix Hero and Video
            const images = prod.images || [];
            const rawHero = prod.heroImage || (images.length > 0 ? images[0] : null);
            const heroUrl = rawHero ? (rawHero.startsWith('//') ? `https:${rawHero}` : rawHero) : null;
            const videoUrl = prod.heroVideo ? (prod.heroVideo.startsWith('//') ? `https:${prod.heroVideo}` : prod.heroVideo) : null;

            await client.query(
                "UPDATE products SET hero_image_url = $1, video_url = $2 WHERE id = $3",
                [heroUrl, videoUrl, dbId]
            );
            fixedHeroes++;

            // 2. Fix All Product Images (clear and re-insert with https:)
            await client.query("DELETE FROM product_images WHERE product_id = $1", [dbId]);
            if (images.length > 0) {
                for (let i = 0; i < images.length; i++) {
                    const url = images[i].startsWith('//') ? `https:${images[i]}` : images[i];
                    await client.query(
                        "INSERT INTO product_images (id, product_id, url, sort_order) VALUES ($1, $2, $3, $4)",
                        [uuidv4(), dbId, url, i]
                    );
                }
                fixedImages += images.length;
            }

            // 3. Link to Master Collection
            await client.query(
                "INSERT INTO collection_products (collection_id, product_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
                [RIDEENGINE_COLLECTION_ID, dbId]
            );
            linkedProducts++;
        }

        console.log('\nFix Summary:');
        console.log(`- Products updated with Hero/Video: ${fixedHeroes}`);
        console.log(`- Total images re-indexed with https: ${fixedImages}`);
        console.log(`- Products linked to Ride Engine Category: ${linkedProducts}`);

    } finally {
        client.release();
        await pool.end();
    }
}

main().catch(console.error);
