const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const SHOPIFY_BASE = 'https://slingshotsports.com/products';

function extractYouTubeUrl(html) {
    if (!html) return null;
    // Look for src="...youtube..." (iframe)
    const iframeMatch = html.match(/src=["'](https:\/\/(?:www\.)?youtube\.com\/embed\/[^"']+|https:\/\/youtu\.be\/[^"']+)["']/);
    if (iframeMatch) return iframeMatch[1];

    // Look for plain links href="..."
    const linkMatch = html.match(/href=["'](https:\/\/(?:www\.)?youtube\.com\/watch\?v=[^"']+|https:\/\/youtu\.be\/[^"']+)["']/);
    if (linkMatch) return linkMatch[1];

    // Look for data-video-src or similar used by themes
    const dataMatch = html.match(/data-video-url=["'](https:\/\/(?:www\.)?youtube\.com\/[^"']+)["']/);
    if (dataMatch) return dataMatch[1];

    return null;
}

function normalizeUrl(url) {
    if (!url) return null;
    if (url.includes('/embed/')) {
        const id = url.split('/embed/')[1].split('?')[0];
        return `https://www.youtube.com/watch?v=${id}`;
    }
    return url;
}

async function run() {
    console.log('Fetching products without video...');
    const res = await pool.query("SELECT slug, handle FROM products WHERE video_url IS NULL OR video_url = ''");
    console.log(`Found ${res.rowCount} products to check.`);

    let updates = 0;

    // Limit concurrency or do sequential to be polite
    for (const p of res.rows) {
        // Use handle if available (usually slug matches handle)
        const handle = p.slug;
        const url = `${SHOPIFY_BASE}/${handle}`;

        try {
            // console.log(`Checking ${url}...`);
            const pageRes = await fetch(url);
            if (pageRes.status === 404) {
                // console.log(`404: ${url}`);
                continue;
            }
            const html = await pageRes.text();
            const videoUrl = normalizeUrl(extractYouTubeUrl(html));

            if (videoUrl) {
                console.log(`FOUND: ${handle} -> ${videoUrl}`);
                await pool.query("UPDATE products SET video_url = $1 WHERE slug = $2", [videoUrl, p.slug]);
                updates++;
            }
        } catch (e) {
            console.error(`Error fetching ${url}:`, e.message);
        }

        // Small delay
        await new Promise(r => setTimeout(r, 200));
    }

    console.log(`Done. Updated ${updates} products.`);
    pool.end();
}

run();
