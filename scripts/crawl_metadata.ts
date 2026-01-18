import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';

// URLs to sitemaps
const SITEMAP_ROOT = 'https://slingshotsports.com/sitemap.xml';

interface ProductMetadata {
    url: string;
    source: string; // 'slingshot'
    name: string | null;
    sku: string | null;
    subtitle: string | null;
    error?: string;
}

const OUTPUT_FILE = path.join(process.cwd(), 'scraped_data', 'product_metadata.json');

async function fetchSitemapUrls(url: string): Promise<string[]> {
    console.log(`Fetching sitemap: ${url}`);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch sitemap: ${res.statusText}`);
    const text = await res.text();

    const urls: string[] = [];

    // Check for nested sitemaps <sitemap><loc>...</loc></sitemap>
    const sitemapMatches = text.match(/<sitemap>\s*<loc>(.*?)<\/loc>/g);
    if (sitemapMatches) {
        console.log(`  Found ${sitemapMatches.length} child sitemaps.`);
        for (const sm of sitemapMatches) {
            const childUrl = sm.replace(/<\/?sitemap>|<\/?loc>|\s/g, '');
            // Filter to only 'products' sitemaps if possible to save time
            if (childUrl.includes('products')) {
                urls.push(...await fetchSitemapUrls(childUrl));
            }
        }
    }

    // Check for product URLs <url><loc>...</loc></url>
    const urlMatches = text.match(/<url>\s*<loc>(.*?)<\/loc>/g);
    if (urlMatches) {
        const found = urlMatches
            .map(m => m.replace(/<\/?url>|<\/?loc>|\s/g, ''))
            .filter(u => u.includes('/products/'));
        urls.push(...found);
    }

    return urls;
}

async function main() {
    console.log('Starting Metadata Crawler...');

    // Ensure output dir exists
    const dir = path.dirname(OUTPUT_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    // 1. Collect all URLs
    let allUrls: { url: string; source: string }[] = [];

    try {
        const urls = await fetchSitemapUrls(SITEMAP_ROOT);
        console.log(`  Found ${urls.length} product URLs for slingshot`);
        allUrls.push(...urls.map(url => ({ url, source: 'slingshot' })));
    } catch (e) {
        console.error(`  Error processing sitemap root:`, e);
    }

    console.log(`Total URLs to crawl: ${allUrls.length}`);
    const results: ProductMetadata[] = [];

    // 2. Crawl with Puppeteer
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    // Block images/fonts/css for speed
    await page.setRequestInterception(true);
    page.on('request', (req) => {
        if (['image', 'stylesheet', 'font'].includes(req.resourceType())) {
            req.abort();
        } else {
            req.continue();
        }
    });

    for (const [index, { url, source }] of allUrls.entries()) {
        console.log(`[${index + 1}/${allUrls.length}] Visiting ${url}`);

        try {
            const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

            if (!response || !response.ok()) {
                console.warn(`  Failed to load: ${response?.status()}`);
                results.push({ url, source, name: null, sku: null, subtitle: null, error: `Status ${response?.status()}` });
                continue;
            }

            const data = await page.evaluate(() => {
                // Name
                const h1 = document.querySelector('h1');
                const name = h1 ? h1.innerText.trim() : null;

                // SKU
                const skuEl = document.querySelector('.product-single__sku');
                const sku = skuEl ? (skuEl as HTMLElement).innerText.trim() : null;

                // Subtitle
                // Look for .product-block text that is mostly uppercase
                const blocks = Array.from(document.querySelectorAll('.product-block'));
                let subtitle = null;

                for (const block of blocks) {
                    const text = (block as HTMLElement).innerText.trim();
                    if (text &&
                        text.length > 5 &&
                        text.length < 100 &&
                        text === text.toUpperCase() &&
                        (text.includes('/') || text.includes('|'))) { // RideEngine might use | or just check uppercase
                        subtitle = text;
                        break;
                    }
                }

                return { name, sku, subtitle };
            });

            if (data.name) {
                console.log(`  Extracted: ${data.name.substring(0, 30)}... | SKU: ${data.sku} | Sub: ${data.subtitle}`);
                results.push({
                    url,
                    source,
                    name: data.name,
                    sku: data.sku,
                    subtitle: data.subtitle
                });
            } else {
                console.warn(`  Could not find product Name on page.`);
                results.push({ url, source, name: null, sku: null, subtitle: null, error: 'Name not found' });
            }

        } catch (e: any) {
            console.error(`  Error visiting ${url}: ${e.message}`);
            results.push({ url, source, name: null, sku: null, subtitle: null, error: e.message });
        }

        // Save intermediate results every 10 items
        if (index % 10 === 0) {
            fs.writeFileSync(OUTPUT_FILE, JSON.stringify(results, null, 2));
        }
    }

    // Final save
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(results, null, 2));
    console.log(`Done. Saved ${results.length} records to ${OUTPUT_FILE}`);

    await browser.close();
}

main();
