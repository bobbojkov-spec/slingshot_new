const { Pool } = require('pg');
const { JSDOM } = require('jsdom');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function scrapeAndMap() {
    const client = await pool.connect();
    try {
        console.log('Fetching ALL collections...');
        const res = await client.query("SELECT * FROM collections");
        const collections = res.rows;

        console.log(`Found ${collections.length} collections.`);

        for (const col of collections) {
            let urlsToCheck = [];

            // Heuristic for Ride Engine
            if (col.slug.startsWith('ride-engine') || col.title.toLowerCase().includes('ride engine')) {
                // Try Ride Engine domain
                const shortSlug = col.slug.replace(/^ride-engine-/, '');
                urlsToCheck.push(`https://rideengine.com/collections/${col.slug}`);
                urlsToCheck.push(`https://rideengine.com/collections/${shortSlug}`);
                // Fallback to slingshot just in case
                urlsToCheck.push(`https://slingshotsports.com/en-eu/collections/${col.slug}`);
            } else {
                // Slingshot
                urlsToCheck.push(`https://slingshotsports.com/en-eu/collections/${col.slug}`);
            }

            let html = null;
            let successUrl = '';

            for (const url of urlsToCheck) {
                try {
                    console.log(`  Trying: ${url}`);
                    const response = await fetch(url);
                    if (response.ok) {
                        html = await response.text();
                        successUrl = url;
                        break;
                    }
                } catch (e) { }
            }

            if (!html) {
                console.error(`  Failed to find live page for ${col.slug}`);
                continue;
            }
            console.log(`  Scraping: ${col.title} (${successUrl})`);
            try {
                const dom = new JSDOM(html);
                const document = dom.window.document;

                // Extract Product Names
                // Common Shopify Selectors:
                // .card__heading
                // .full-unstyled-link
                // .product-card__title
                // h3 a

                const titles = new Set();
                // Use broader selector: any link containing /products/
                const elements = document.querySelectorAll('a[href*="/products/"]');

                elements.forEach(el => {
                    let text = el.textContent.trim();
                    if (!text) return;

                    // Often text includes price: "Board Name \n $500"
                    // We take the first non-empty line
                    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
                    if (lines.length > 0) {
                        // The first line is usually the name (or Vendor sometimes?)
                        // We accumulate candidate names
                        // Avoid "Slingshot" or "Ride Engine" if it's just the brand link (but href is /products/...)
                        // Links to /products/ usually ARE the product.

                        // Check if line looks like a price? (starts with € or $)
                        const nameCandidate = lines[0];
                        if (!nameCandidate.match(/^[€$0-9]/)) {
                            titles.add(nameCandidate);
                        }
                    }
                });

                console.log(`  Found ${titles.size} potential products.`);
                if (titles.size === 0) {
                    // Debug: dump a bit of HTML to see classes? No, too noisy.
                    console.log('  No titles found. Selector might be wrong.');
                }

                let linkedCount = 0;
                for (const title of titles) {
                    // Try to find in DB
                    // Clean title?
                    // "Dwarf Craft V2"

                    const prodRes = await client.query("SELECT id, name FROM products WHERE name ILIKE $1", [title]);

                    if (prodRes.rows.length > 0) {
                        const product = prodRes.rows[0];
                        // Link
                        try {
                            await client.query(
                                "INSERT INTO collection_products (collection_id, product_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
                                [col.id, product.id]
                            );
                            linkedCount++;
                        } catch (e) {
                            // ignore
                        }
                    } else {
                        // console.log(`  Start match failed: ${title}`);
                        // Try strict fuzzy? Or just ignore.
                        // User said "we have just the same name".
                    }
                }

                if (linkedCount > 0) {
                    console.log(`  Linked ${linkedCount} products.`);
                }

            } catch (e) {
                console.error(`Error processing ${col.slug}:`, e.message);
            }

            // Be nice to the server
            await new Promise(r => setTimeout(r, 500));
        }

    } catch (e) {
        console.error(e);
    } finally {
        client.release();
        pool.end();
    }
}

scrapeAndMap();
