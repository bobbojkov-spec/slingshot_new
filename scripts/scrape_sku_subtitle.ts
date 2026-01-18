import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import puppeteer from 'puppeteer';

dotenv.config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function main() {
    console.log('Starting SKU & Subtitle Scraper...');
    const client = await pool.connect();
    let browser;

    try {
        // Fetch all products with their slugs
        const res = await client.query('SELECT id, slug, name FROM products ORDER BY id DESC');
        const products = res.rows;
        console.log(`Found ${products.length} products to check.`);

        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();

        // Set viewport to desktop to ensure elements are visible
        await page.setViewport({ width: 1280, height: 800 });

        for (const [index, product] of products.entries()) {
            // Construct URL
            // Assuming standard Shopify URL structure or the one we used before: https://slingshotsports.com/products/${slug}
            // Some might have different paths, but let's try this first.
            const url = `https://slingshotsports.com/products/${product.slug}`;
            console.log(`[${index + 1}/${products.length}] visiting ${url}...`);

            try {
                // Navigate with a shorter timeout as we just need basic HTML
                const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

                if (!response || !response.ok()) {
                    console.log(`  Failed to load page: ${response?.status()}`);
                    continue;
                }

                // Extract Data
                const data = await page.evaluate(() => {
                    const skuElement = document.querySelector('.product-single__sku');
                    const sku = skuElement ? (skuElement as HTMLElement).innerText.trim() : null;

                    // Subtitle strategy: Look for .product-block text that is mostly uppercase and contains slashes
                    // User example: <div class="product-block">BOOST HIGHER / LOOP BIGGER / FLY FARTHER</div>
                    const blockElements = document.querySelectorAll('.product-block');
                    let subtitle = null;

                    for (const el of Array.from(blockElements)) {
                        const text = (el as HTMLElement).innerText.trim();
                        // Heuristic: Is uppercase? Contains slash? Not too long?
                        if (text && text === text.toUpperCase() && text.includes('/') && text.length < 100 && text.length > 5) {
                            subtitle = text;
                            break;
                        }
                    }

                    return { sku, subtitle };
                });

                if (data.sku || data.subtitle) {
                    console.log(`  Found: SKU=${data.sku}, Subtitle=${data.subtitle}`);

                    // Update DB
                    await client.query(
                        `UPDATE products SET sku = COALESCE($1, sku), subtitle = COALESCE($2, subtitle) WHERE id = $3`,
                        [data.sku, data.subtitle, product.id]
                    );

                    // Also verify if we need to update translations (English default)
                    // If we added the column to product_translations, we should probably fill it too for 'en' or 'bg' if appropriate.
                    // The user asked to "scrape all slingshot product for them. make new columns. and fill the database".
                    // Just updating `products` table is likely sufficient for now as `page.tsx` reads from `product` object which usually maps from `products` table.
                } else {
                    console.log(`  No SKU/Subtitle found.`);
                }

                // Small delay to be nice
                await new Promise(r => setTimeout(r, 1000));

            } catch (pErr) {
                console.error(`  Error processing ${url}:`, pErr instanceof Error ? pErr.message : pErr);
            }
        }

    } catch (err) {
        console.error('Fatal Script Error:', err);
    } finally {
        if (browser) await browser.close();
        client.release();
        await pool.end();
        console.log('Finished.');
    }
}

main();
