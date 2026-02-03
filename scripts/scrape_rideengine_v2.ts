import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const SITEMAP_URL = 'https://rideengine.com/sitemap_products_1.xml?from=5142474293382&to=7464152170630';
const SCRAPED_DATA_PATH = path.join(process.cwd(), 'scraped_data', 'rideengine_sync_data.json');

async function main() {
    console.log('Starting Ride Engine Scraper V2...');

    if (!fs.existsSync(path.dirname(SCRAPED_DATA_PATH))) {
        fs.mkdirSync(path.dirname(SCRAPED_DATA_PATH), { recursive: true });
    }

    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    console.log('Fetching sitemap...');
    await page.goto(SITEMAP_URL);
    const sitemapContent = await page.content();
    const urls = sitemapContent.match(/https:\/\/rideengine\.com\/products\/[^<]+/g) || [];
    const uniqueUrls = Array.from(new Set(urls));

    console.log(`Found ${uniqueUrls.length} products to scrape.`);

    const results: any[] = [];
    for (let i = 0; i < uniqueUrls.length; i++) {
        const url = uniqueUrls[i];
        const handle = url.split('/').pop()?.split('?')[0] || '';
        console.log(`[${i + 1}/${uniqueUrls.length}] Scraping ${handle}...`);

        try {
            // Fetch JSON for product details
            const jsonUrl = `${url}.js`;
            const jsonResponse = await page.goto(jsonUrl);
            if (!jsonResponse || !jsonResponse.ok()) {
                console.error(`  Failed to fetch JSON for ${handle}`);
                continue;
            }
            const jsonData = await jsonResponse.json();

            // Fetch HTML for features
            await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
            const features = await page.evaluate(() => {
                const disclosures = Array.from(document.querySelectorAll('details.disclosure, details.collapsible-tab, .collapsible-tab'));

                // 1. Look for a dedicated Features/Specs disclosure
                const featuresDetail = disclosures.find(d => {
                    const title = d.querySelector('summary, .disclosure__title, .collapsible-tab__title')?.textContent?.trim() || '';
                    return /features|specs|specifications/i.test(title);
                });

                if (featuresDetail) {
                    const content = featuresDetail.querySelector('.disclosure__content, .collapsible-tab__content, .collapsible-tab__panel') || featuresDetail;
                    const clone = content.cloneNode(true) as HTMLElement;
                    const summary = clone.querySelector('summary, .collapsible-tab__title');
                    if (summary) summary.remove();
                    return clone.innerHTML.trim();
                }

                // 2. Look for "Features" marker inside a Description disclosure
                const descriptionDetail = disclosures.find(d => {
                    const title = d.querySelector('summary, .disclosure__title, .collapsible-tab__title')?.textContent?.trim() || '';
                    return /description/i.test(title);
                });
                if (descriptionDetail) {
                    const content = descriptionDetail.querySelector('.disclosure__content, .collapsible-tab__content, .collapsible-tab__panel')?.innerHTML || descriptionDetail.innerHTML;
                    if (/features|specs/i.test(content)) {
                        const match = content.match(/<p><strong>features<\/strong><\/p>([\s\S]+)/i) ||
                            content.match(/features:?([\s\S]+)/i);
                        if (match) return match[1].trim();
                        return content.trim();
                    }
                }

                // 3. Try scrolling image list (new Ride Engine structure)
                const scrollingList = document.querySelector('.scrolling-image-list');
                if (scrollingList) {
                    return scrollingList.innerHTML.trim();
                }

                // 4. Try any section with Features heading
                const featureHeading = Array.from(document.querySelectorAll('h2, h3, .subheading')).find(h =>
                    /features|product features/i.test(h.textContent?.trim() || '')
                );
                if (featureHeading) {
                    const section = featureHeading.closest('section') || featureHeading.parentElement;
                    return section?.innerHTML.trim() || null;
                }

                return null;
            });

            if (features) {
                console.log(`  [Features] Found features for ${handle}`);
            }

            results.push({
                id: jsonData.id,
                handle,
                title: jsonData.title,
                sku: jsonData.variants[0]?.sku || null,
                price: jsonData.price / 100,
                compare_at_price: jsonData.compare_at_price ? jsonData.compare_at_price / 100 : null,
                features_html: features,
                variants: jsonData.variants.map((v: any) => ({
                    id: v.id,
                    title: v.title,
                    sku: v.sku,
                    price: v.price / 100,
                    compare_at_price: v.compare_at_price ? v.compare_at_price / 100 : null
                }))
            });

            // Periodic save
            if (results.length % 10 === 0) {
                fs.writeFileSync(SCRAPED_DATA_PATH, JSON.stringify(results, null, 2));
                console.log(`  [Progress] Saved ${results.length} products to ${SCRAPED_DATA_PATH}`);
            }

        } catch (error) {
            console.error(`  Error scraping ${handle}:`, error);
        }
    }

    fs.writeFileSync(SCRAPED_DATA_PATH, JSON.stringify(results, null, 2));
    console.log(`Saved ${results.length} products to ${SCRAPED_DATA_PATH}`);
    await browser.close();
}

main().catch(console.error);
