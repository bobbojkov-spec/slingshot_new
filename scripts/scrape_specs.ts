
import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';
import { query } from '../lib/db';

const SCRAPED_DIR = path.join(process.cwd(), 'scraped_data', 'specs');
if (!fs.existsSync(SCRAPED_DIR)) {
    fs.mkdirSync(SCRAPED_DIR, { recursive: true });
}

const CONCURRENCY = 1;

// Define browser script as a CONSTANT STRING to strictly avoid TSX interference
const BROWSER_SCRIPT = `
    const result = {
        specs_html: '',
        package_includes: '',
        description_html: '',
        description_html2: ''
    };

    function isBadContent(el) {
        if (!el) return true;
        if (el.closest('footer') || el.closest('.site-footer') || el.closest('.footer__collapsible')) return true;
        return false;
    }

    // 1. SPECS
    const ksTableWrapper = document.querySelector('.ks-table-wrapper');
    if (ksTableWrapper && !isBadContent(ksTableWrapper)) {
        const table = ksTableWrapper.querySelector('table');
        if (table) {
            result.specs_html = table.outerHTML;
        }
    }
    
    if (!result.specs_html) {
        const triggers = Array.from(document.querySelectorAll('.collapsible-trigger'));
        let specsTrigger = null;
        for (let i = 0; i < triggers.length; i++) {
            const t = triggers[i];
            if (t.tagName === 'A') continue;
            if (isBadContent(t)) continue;
            
            const txt = t.textContent ? t.textContent.trim().toLowerCase() : '';
            if (txt.includes('specs') || txt.includes('specifications')) {
                specsTrigger = t;
                break;
            }
        }

        if (specsTrigger) {
            const contentId = specsTrigger.getAttribute('aria-controls');
            const contentDiv = contentId ? document.getElementById(contentId) : null;
            if (contentDiv) {
                const specsInner = contentDiv.querySelector('.collapsible-content__inner') || contentDiv;
                const table = specsInner.querySelector('table');
                if (table) {
                    result.specs_html = table.outerHTML;
                }
            }
        }
    }

    // 2. PACKAGE INCLUDES
    const triggers = Array.from(document.querySelectorAll('.collapsible-trigger'));
    let pkgTrigger = null;
    for (let i = 0; i < triggers.length; i++) {
        const t = triggers[i];
        if (t.tagName === 'A') continue;
        if (isBadContent(t)) continue;

        const txt = t.textContent ? t.textContent.trim().toLowerCase() : '';
        if (txt.includes('package includes') || txt.includes("what's in the box")) {
            pkgTrigger = t;
            break;
        }
    }
    
    if (pkgTrigger) {
        const contentId = pkgTrigger.getAttribute('aria-controls');
        const contentDiv = contentId ? document.getElementById(contentId) : null;
        if (contentDiv) {
            const pkgInner = contentDiv.querySelector('.collapsible-content__inner');
            if (pkgInner) result.package_includes = pkgInner.innerHTML.trim();
        }
    }

    // 3. DESCRIPTION
    const descEl = document.querySelector('.product-single__description');
    if (descEl) {
        result.description_html = descEl.innerHTML.trim();
    }

    // 4. DESCRIPTION 2
    let aboutTrigger = null;
    for (let i = 0; i < triggers.length; i++) {
        const t = triggers[i];
        if (t.tagName === 'A') continue;
        if (isBadContent(t)) continue;

        const txt = t.textContent ? t.textContent.trim().toLowerCase() : '';
        if (txt === 'about' || txt === 'features' || txt.includes('features')) {
            aboutTrigger = t;
            break;
        }
    }

    if (aboutTrigger) {
        const contentId = aboutTrigger.getAttribute('aria-controls');
        const contentDiv = contentId ? document.getElementById(contentId) : null;
        const descInner = contentDiv ? contentDiv.querySelector('.collapsible-content__inner') : null;
        if (descInner) result.description_html2 = descInner.innerHTML.trim();
    }

    return result; // return is special context here
`;

async function scrapeProduct(browser: any, slug: string, url: string) {
    let page;
    try {
        page = await browser.newPage();
        await page.setRequestInterception(true);
        page.on('request', (req: any) => {
            if (['image', 'media', 'font'].includes(req.resourceType())) {
                req.abort();
            } else {
                req.continue();
            }
        });

        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });

        try {
            await page.waitForSelector('.collapsible-trigger', { timeout: 10000 });
        } catch (e) { }

        await new Promise(r => setTimeout(r, 6000)); // KiwiSizing Wait

        // EXECUTE STRING
        const data = await page.evaluate(new Function(BROWSER_SCRIPT));

        data.slug = slug;
        data.url = url;

        return data;
    } catch (error) {
        throw error;
    } finally {
        if (page) await page.close();
    }
}

async function main() {
    let browser: any;

    const launch = async () => {
        if (browser) await browser.close();
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
    };

    try {
        const args = process.argv.slice(2);
        const slugArg = args.find(a => a.startsWith('--slug='));
        const targetSlug = slugArg ? slugArg.split('=')[1] : null;

        let products = [];

        if (targetSlug) {
            products = [{ slug: targetSlug }];
            console.log(`Debug Mode: Scraping single product ${targetSlug}`);
        } else {
            const res = await query(`
                SELECT slug FROM products 
                WHERE brand ILIKE '%slingshot%' OR brand = 'Slingshot'
                ORDER BY created_at DESC
            `, []);
            products = res.rows;
        }

        console.log(`Queue size: ${products.length}. Serial Mode.`);

        await launch();

        for (const product of products) {
            const filePath = path.join(SCRAPED_DIR, `${product.slug}.json`);

            if (!targetSlug && fs.existsSync(filePath)) {
                try {
                    const existing = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
                    console.log(`Skipping ${product.slug} (already scraped)`);
                    continue;
                } catch (e) {
                    console.log(`Rescraping ${product.slug} (invalid JSON)`);
                }
            }

            console.log(`Processing ${product.slug}...`);
            const targetUrl = `https://slingshotsports.com/en-eu/products/${product.slug}`;

            let attempts = 0;
            while (attempts < 3) {
                try {
                    const data = await scrapeProduct(browser, product.slug, targetUrl);
                    if (data) {
                        if (targetSlug) {
                            console.log("--- SCAN RESULT ---");
                            console.log("Specs Length:", data.specs_html.length, data.specs_html.includes('<table') ? "(HAS TABLE)" : "(NO TABLE)");
                        }
                        if (!data.specs_html) console.log(`[WARN] No specs table found for ${product.slug}`);

                        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
                    }
                    break;
                } catch (err: any) {
                    attempts++;
                    console.error(`Error scraping ${product.slug} (Attempt ${attempts}):`, err.message);

                    if (err.message.includes('Connection closed') || err.message.includes('Session closed')) {
                        console.log("Restarting browser...");
                        await launch();
                    }

                    if (attempts >= 3) {
                        console.error(`Giving up on ${product.slug}`);
                    } else {
                        await new Promise(r => setTimeout(r, 2000));
                    }
                }
            }
        }
    } catch (err) {
        console.error('Fatal error:', err);
    } finally {
        if (browser) await browser.close();
    }
}

main();
