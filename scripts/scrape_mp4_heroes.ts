
import puppeteer from 'puppeteer';
import { query } from '../lib/db';
import fs from 'fs';
import path from 'path';
import https from 'https';
import { promisify } from 'util';
import stream from 'stream';

const pipeline = promisify(stream.pipeline);

const OUTPUT_DIR = path.join(process.cwd(), 'scraped_data', 'hero_videos');
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Download helper
async function downloadFile(url: string, dest: string) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, (response) => {
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to download: ${response.statusCode}`));
                return;
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve(true);
            });
        }).on('error', (err) => {
            fs.unlink(dest, () => { });
            reject(err);
        });
    });
}

async function main() {
    // 1. Fetch Targets
    const productsRes = await query(`SELECT slug, id, handle FROM products ORDER BY created_at DESC`, []);
    const collectionsRes = await query(`SELECT slug, id, handle FROM collections ORDER BY id DESC`, []);

    const targets = [
        ...collectionsRes.rows.map(r => ({ type: 'collection', slug: r.slug || r.handle, id: r.id, url: `https://slingshotsports.com/en-eu/collections/${r.slug || r.handle}` })),
        ...productsRes.rows.map(r => ({ type: 'product', slug: r.slug || r.handle, id: r.id, url: `https://slingshotsports.com/en-eu/products/${r.slug || r.handle}` }))
    ];

    console.log(`Initial Targets: ${targets.length}`);
    const manifestPath = path.join(OUTPUT_DIR, 'manifest.json');
    let manifest = [];
    if (fs.existsSync(manifestPath)) {
        manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    }

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();
        // Block images/fonts/css to speed up
        await page.setRequestInterception(true);
        page.on('request', (req) => {
            if (['image', 'font', 'stylesheet'].includes(req.resourceType())) {
                req.abort();
            } else {
                req.continue();
            }
        });

        for (let i = 450; i < targets.length; i++) {
            const t = targets[i];

            // Skip if already in manifest
            if (manifest.find((m: any) => m.slug === t.slug && m.type === t.type)) {
                console.log(`[${i + 1}/${targets.length}] Skipping ${t.slug} (Already processed)`);
                continue;
            }

            console.log(`[${i + 1}/${targets.length}] Checking ${t.type}: ${t.slug} ...`);
            await new Promise(r => setTimeout(r, 1000)); // Throttle requests

            try {
                await page.goto(t.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
                // Small wait for JS to inject video
                await new Promise(r => setTimeout(r, 1500));

                const videoSrc = await page.evaluate(() => {
                    // Look for the specific structure user mentioned:
                    // <div class="hero__media-container"><video ... src="...">
                    // Also generic .video-div which seems common
                    const v = document.querySelector('.hero__media-container video') ||
                        document.querySelector('video.video-div') ||
                        document.querySelector('video[src*="shopify.com"]');

                    if (v && v instanceof HTMLVideoElement && v.src) {
                        return v.src;
                    }
                    // Sometimes it's a source tag inside video
                    const source = document.querySelector('.hero__media-container video source') ||
                        document.querySelector('video.video-div source');
                    if (source && source instanceof HTMLSourceElement && source.src) {
                        return source.src;
                    }

                    return null;
                });

                if (videoSrc && (videoSrc.includes('shopify.com') || videoSrc.includes('cdn.shopify'))) {
                    console.log(`   FOUND VIDEO: ${videoSrc}`);
                    const ext = path.extname(videoSrc.split('?')[0]) || '.mp4';
                    const filename = `${t.type}-${t.slug}${ext}`;
                    const localPath = path.join(OUTPUT_DIR, filename);

                    try {
                        console.log(`   Downloading to ${filename}...`);
                        await downloadFile(videoSrc, localPath);

                        manifest.push({
                            slug: t.slug,
                            type: t.type,
                            original_url: videoSrc,
                            local_file: filename,
                            timestamp: new Date().toISOString()
                        });
                        fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
                    } catch (err: any) {
                        console.error(`   Download Failed: ${err.message}`);
                    }
                } else {
                    // console.log(`   No Shopify video found.`);
                }

            } catch (err: any) {
                console.error(`   Error visiting ${t.slug}: ${err.message}`);
                // Proceed to next
            }
        }

    } catch (e) {
        console.error("Fatal:", e);
    } finally {
        await browser.close();
        console.log(`\nDONE. Manifest saved with ${manifest.length} entries.`);
    }
}

main();
