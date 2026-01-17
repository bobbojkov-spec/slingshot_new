require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const BASE_URL = 'https://slingshotsports.com';
const TARGET_COLLECTION_SLUG = 'championship-freestyle';
const TARGET_URL = `${BASE_URL}/en-eu/collections/${TARGET_COLLECTION_SLUG}`;

async function fetchHtml(url) {
    console.log(`Fetching ${url}...`);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
    return await res.text();
}

async function run() {
    const client = await pool.connect();
    try {
        console.log(`Starting sync for missing collection: ${TARGET_COLLECTION_SLUG}`);

        // 1. Scrape Collection Meta
        const html = await fetchHtml(TARGET_URL);
        const dom = new JSDOM(html);
        const doc = dom.window.document;

        const title = doc.querySelector('h1')?.textContent?.trim() || 'Championship Freestyle';
        // Try to find description - heuristic
        const desc = doc.querySelector('.collection-description')?.textContent?.trim() || '';

        // Find Hero Image (heuristic - look for large image near top or meta og:image)
        let heroImage = doc.querySelector('meta[property="og:image"]')?.content;

        console.log(`Found Collection: ${title}`);

        // Check if collection exists
        const existingColl = await client.query('SELECT id FROM collections WHERE slug = $1', [TARGET_COLLECTION_SLUG]);
        let collectionId;

        if (existingColl.rows.length > 0) {
            collectionId = existingColl.rows[0].id;
            console.log(`Collection already exists (ID: ${collectionId}). Updating...`);
            await client.query(`
                UPDATE collections 
                SET title = $1, source = 'slingshot', image_url = $2, updated_at = NOW()
                WHERE id = $3
            `, [title, heroImage, collectionId]);
        } else {
            const insertCollRes = await client.query(`
                INSERT INTO collections (title, slug, handle, source, image_url, created_at, updated_at)
                VALUES ($1, $2, $3, 'slingshot', $4, NOW(), NOW())
                RETURNING id;
            `, [title, TARGET_COLLECTION_SLUG, TARGET_COLLECTION_SLUG, heroImage]);
            collectionId = insertCollRes.rows[0].id;
            console.log(`Created new Collection (ID: ${collectionId})`);
        }

        // 3. Find Products in Collection
        const productLinks = new Set();
        doc.querySelectorAll('a[href*="/products/"]').forEach(a => {
            let href = a.href;
            if (href.startsWith('/')) href = BASE_URL + href;
            // Clean url
            href = href.split('?')[0].split('#')[0];
            if (href.includes('/products/')) {
                productLinks.add(href);
            }
        });

        console.log(`Found ${productLinks.size} products to sync...`);

        // 4. Scrape & Sync Each Product
        for (const prodUrl of productLinks) {
            const slug = prodUrl.split('/products/')[1];
            console.log(`Processing product: ${slug}`);

            // Check if product exists
            const existingRes = await client.query('SELECT id FROM products WHERE slug = $1', [slug]);
            let productId;

            if (existingRes.rows.length > 0) {
                console.log(`-> Product exists. Linking to collection.`);
                productId = existingRes.rows[0].id;
            } else {
                console.log(`-> Product missing. Scraping details...`);
                // Minimal scrape for Title/Image to prompt user to fill rest or expand script if needed
                // For now, attempting to scrape Title and Main Image
                try {
                    const pHtml = await fetchHtml(prodUrl);
                    const pDoc = new JSDOM(pHtml).window.document;

                    const pTitle = pDoc.querySelector('h1')?.textContent?.trim() || slug;
                    const pImage = pDoc.querySelector('meta[property="og:image"]')?.content;
                    const pDesc = pDoc.querySelector('meta[name="description"]')?.content || '';

                    // Mock insert
                    const insertProdRes = await client.query(`
                        INSERT INTO products (name, slug, handle, description_html, is_active, created_at, updated_at)
                        VALUES ($1, $2, $3, $4, true, NOW(), NOW())
                        RETURNING id
                    `, [pTitle, slug, slug, pDesc]);

                    productId = insertProdRes.rows[0].id;

                    // Insert Image if found
                    if (pImage) {
                        await client.query(`
                            INSERT INTO product_images (product_id, url, position, sort_order)
                            VALUES ($1, $2, 0, 0)
                        `, [productId, pImage]);
                    }
                    console.log(`-> Created new product.`);

                } catch (e) {
                    console.error(`Error scraping product ${slug}:`, e.message);
                    continue;
                }
            }

            // Link to Collection
            await client.query(`
                INSERT INTO collection_products (collection_id, product_id, sort_order)
                VALUES ($1, $2, 0)
                ON CONFLICT (collection_id, product_id) DO NOTHING
            `, [collectionId, productId]);
        }

        console.log('Sync complete.');

    } catch (err) {
        console.error('Script error:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

run();
