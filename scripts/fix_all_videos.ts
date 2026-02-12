
import { query } from '../lib/db';

async function main() {
    // 1. Fetch all targets
    const productsRes = await query(`SELECT slug, id, handle FROM products ORDER BY created_at DESC`, []);
    const collectionsRes = await query(`SELECT slug, id, handle FROM collections ORDER BY id DESC`, []);

    // Sort so we scan collections first (fewer), then products
    // Actually, user wants "all".
    const targets = [
        ...collectionsRes.rows.map(r => ({ type: 'collection', slug: r.slug || r.handle, id: r.id, url: `https://slingshotsports.com/en-eu/collections/${r.slug || r.handle}` })),
        ...productsRes.rows.map(r => ({ type: 'product', slug: r.slug || r.handle, id: r.id, url: `https://slingshotsports.com/en-eu/products/${r.slug || r.handle}` }))
    ];

    console.log(`Found ${targets.length} targets to scan.`);

    const puppeteer = await import('puppeteer').then(m => m.default);
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-font-subpixel-positioning'] // optimization
    });

    try {
        const page = await browser.newPage();
        // Block heavy resources
        await page.setRequestInterception(true);
        page.on('request', (req) => {
            if (['image', 'stylesheet', 'font', 'media'].includes(req.resourceType())) {
                req.abort();
            } else {
                req.continue();
            }
        });

        for (let i = 0; i < targets.length; i++) {
            const t = targets[i];
            console.log(`[${i + 1}/${targets.length}] scanning ${t.type}: ${t.slug}`);

            try {
                // Short timeout 
                await page.goto(t.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
                // Short wait for scripts
                await new Promise(r => setTimeout(r, 1500));

                const videoId = await page.evaluate(function () {
                    // Helper defined inside browser context
                    function isValidId(id: string) {
                        if (!id) return false;
                        return /^[a-zA-Z0-9_-]{11}$/.test(id);
                    }

                    // 1. data-video-id (Highest priority, used in theme)
                    const dataDiv = document.querySelector('div[data-video-id]');
                    if (dataDiv) {
                        const id = dataDiv.getAttribute('data-video-id');
                        if (id && isValidId(id)) return id;
                    }

                    // 2. Youtube Iframes
                    const iframes = Array.from(document.querySelectorAll('iframe'));
                    for (const iframe of iframes) {
                        const src = iframe.src || '';
                        if (src.includes('youtube.com/embed/')) {
                            const match = src.match(/embed\/([a-zA-Z0-9_-]{11})/);
                            if (match && isValidId(match[1])) return match[1];
                        }
                    }

                    // 3. YouTube Links (excluding generic channel)
                    const links = Array.from(document.querySelectorAll('a[href*="youtube.com"], a[href*="youtu.be"]'));
                    for (const link of links) {
                        const href = (link as HTMLAnchorElement).href;
                        // Skip generic channels immediately
                        if (href.includes('user/slingshotsports') || href.includes('/channel/')) continue;

                        let match = href.match(/(?:v=|v\/|embed\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
                        if (match && isValidId(match[1])) return match[1];
                    }

                    return null;
                });

                if (videoId) {
                    const fullUrl = `https://www.youtube.com/watch?v=${videoId}`;
                    console.log(`   FOUND: ${fullUrl}`);

                    // Update DB
                    if (t.type === 'product') {
                        await query(`UPDATE products SET video_url = $1 WHERE id = $2`, [fullUrl, t.id]);
                        // Log update for verification
                        console.log(`   UPDATED DB for ${t.slug}`);
                    } else {
                        await query(`UPDATE collections SET video_url = $1 WHERE id = $2`, [fullUrl, t.id]);
                        console.log(`   UPDATED DB for ${t.slug}`);
                    }
                } else {
                    console.log(`   NO VIDEO found. Clearing...`);
                    // Clear DB to remove generic links
                    if (t.type === 'product') {
                        await query(`UPDATE products SET video_url = NULL WHERE id = $2`, [null, t.id]);
                    } else {
                        await query(`UPDATE collections SET video_url = NULL WHERE id = $2`, [null, t.id]);
                    }
                }
            } catch (err: any) {
                console.error(`   ERROR scanning ${t.slug}: ${err.message}`);
                // Try to recover page if it crashed
                if (err.message && (err.message.includes('target closed') || err.message.includes('Session closed'))) {
                    await page.reload();
                }
            }
        }

    } catch (e) {
        console.error("Fatal Error:", e);
    } finally {
        await browser.close();
    }
}

main();
