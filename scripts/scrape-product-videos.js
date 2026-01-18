const fs = require('fs');
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const SHOPIFY_DOMAIN = 'https://slingshotsports.com';

async function fetchProducts(page = 1) {
    const url = `${SHOPIFY_DOMAIN}/products.json?limit=250&page=${page}`;
    console.log(`Fetching ${url}...`);
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const data = await res.json();
        return data.products || [];
    } catch (e) {
        console.error('Fetch error:', e.message);
        return [];
    }
}

function extractYouTubeUrl(html) {
    if (!html) return null;
    // Look for src="...youtube..."
    const iframeMatch = html.match(/src=["'](https:\/\/(?:www\.)?youtube\.com\/embed\/[^"']+|https:\/\/youtu\.be\/[^"']+)["']/);
    if (iframeMatch) return iframeMatch[1];

    // Look for plain links?
    const linkMatch = html.match(/href=["'](https:\/\/(?:www\.)?youtube\.com\/watch\?v=[^"']+|https:\/\/youtu\.be\/[^"']+)["']/);
    if (linkMatch) return linkMatch[1];

    return null;
}

// Convert embed URL to watch URL for DB consistency if needed? 
// Current DB seems to use watch URLs or Embed URLs. 
// Helper to normalize to watch URL if needed?
function normalizeUrl(url) {
    if (!url) return null;
    if (url.includes('/embed/')) {
        const id = url.split('/embed/')[1].split('?')[0];
        return `https://www.youtube.com/watch?v=${id}`;
    }
    return url;
}

async function run() {
    let page = 1;
    let allProducts = [];

    while (true) {
        const products = await fetchProducts(page);
        if (products.length === 0) break;
        allProducts = allProducts.concat(products);
        page++;
        // Safety break
        if (page > 20) break;
    }

    console.log(`Fetched ${allProducts.length} products total.`);

    let updates = 0;

    for (const p of allProducts) {
        const videoUrl = normalizeUrl(extractYouTubeUrl(p.body_html));
        if (videoUrl) {
            // Update DB
            // We match by slug (handle)
            const res = await pool.query(
                "UPDATE products SET video_url = $1 WHERE slug = $2 AND (video_url IS NULL OR video_url = '') RETURNING id",
                [videoUrl, p.handle]
            );

            if (res.rowCount > 0) {
                console.log(`Updated ${p.handle} -> ${videoUrl}`);
                updates++;
            }
        }
    }

    console.log(`Done. Updated ${updates} products.`);
    pool.end();
}

run();
