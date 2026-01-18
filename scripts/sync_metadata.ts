import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const INPUT_FILE = path.join(process.cwd(), 'scraped_data', 'product_metadata.json');

async function main() {
    console.log('Starting Metadata Sync...');

    if (!fs.existsSync(INPUT_FILE)) {
        console.error(`Input file not found: ${INPUT_FILE}`);
        return;
    }

    const rawData = fs.readFileSync(INPUT_FILE, 'utf-8');
    const records = JSON.parse(rawData);
    console.log(`Loaded ${records.length} records.`);

    const client = await pool.connect();

    try {
        // Fetch existing products
        const res = await client.query('SELECT id, name, slug FROM products');
        const dbProducts = res.rows;
        console.log(`Fetched ${dbProducts.length} products from DB.`);

        let updatedCount = 0;
        let missedCount = 0;

        for (const record of records) {
            if (!record.sku && !record.subtitle) continue;

            // 1. Try exact match by Name (normalized)
            let match = dbProducts.find(p => p.name.trim().toLowerCase() === record.name?.trim().toLowerCase());

            // 2. Try match by Slug (derived from URL)
            if (!match && record.url) {
                const urlSlug = record.url.split('/').pop()?.split('?')[0];
                if (urlSlug) {
                    match = dbProducts.find(p => p.slug === urlSlug);
                }
            }

            if (match) {
                // Update
                console.log(`Updating ${match.slug} (ID: ${match.id}) -> SKU: ${record.sku || 'N/A'}, Sub: ${record.subtitle || 'N/A'}`);
                await client.query(
                    `UPDATE products SET sku = COALESCE($1, sku), subtitle = COALESCE($2, subtitle) WHERE id = $3`,
                    [record.sku, record.subtitle, match.id]
                );
                // Also update subtitle in product_translations if column exists (it should)
                // We'll assume the English subtitle goes into the main translation record for now if needed, 
                // but usually product_translations is keyed by lang. Let's just stick to 'products' table as requested first.

                updatedCount++;
            } else {
                // console.warn(`  No match found for scraped product: "${record.name}" (URL: ${record.url})`);
                missedCount++;
            }
        }

        console.log(`Sync Complete.`);
        console.log(`  Updated: ${updatedCount}`);
        console.log(`  Missed: ${missedCount} (likely products not in our local DB subset)`);

    } catch (err) {
        console.error('Sync Error:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

main();
