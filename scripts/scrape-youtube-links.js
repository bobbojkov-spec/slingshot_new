const fs = require('fs');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const BASE_URL = 'https://slingshotsports.com';
const START_URL = 'https://slingshotsports.com/en-eu';
const OUTPUT_FILE = 'youtube_links.txt';

// Set to avoid visiting same page twice
const visited = new Set();
const linksToVisit = [START_URL];
const results = [];

async function scrapePage(url) {
    if (visited.has(url)) return;
    visited.add(url);

    // Simple filter to keep within context
    if (!url.includes('slingshotsports.com')) return;

    try {
        console.log(`Scanning: ${url}`);
        const response = await fetch(url);
        if (!response.ok) {
            console.error(`Failed to fetch ${url}: ${response.status}`);
            return;
        }
        const html = await response.text();
        const dom = new JSDOM(html);
        const doc = dom.window.document;

        // 1. Find YouTube Links/Iframes
        const videos = new Set();

        // Check iframes
        const iframes = doc.querySelectorAll('iframe');
        iframes.forEach(iframe => {
            const src = iframe.src;
            if (src && (src.includes('youtube.com') || src.includes('youtu.be'))) {
                videos.add(src);
            }
        });

        // Check links
        const anchors = doc.querySelectorAll('a');
        anchors.forEach(a => {
            const href = a.href;
            if (href && (href.includes('youtube.com') || href.includes('youtu.be'))) {
                videos.add(href);
            }

            // Collect internal links to visit next (Breadth-First Search essentially)
            // We only want to go deeper if we are on a list page or home.
            // Heuristic: If we are on home, we queue products/collections.
            // If we are on a collection, we queue products.
            if (href.startsWith('/') || href.startsWith(BASE_URL)) {
                let fullUrl = href.startsWith('/') ? BASE_URL + href : href;
                // Remove fragment/query for uniqueness
                fullUrl = fullUrl.split('#')[0].split('?')[0];

                // Only queue specific relevant sections to avoid infinite crawl of blog/cart/account
                if (
                    !visited.has(fullUrl) &&
                    (fullUrl.includes('/products/') || fullUrl.includes('/collections/'))
                ) {
                    linksToVisit.push(fullUrl);
                }
            }
        });

        if (videos.size > 0) {
            videos.forEach(videoUrl => {
                const entry = `URL= ${url} > video > ${videoUrl}`;
                console.log('Found:', entry);
                results.push(entry);
            });
        }

    } catch (error) {
        console.error(`Error scraping ${url}:`, error.message);
    }
}

async function run() {
    console.log('Starting scrape...');

    // Initial fetch to populate queue from homepage
    await scrapePage(START_URL);

    // Process queue (limit to avoid taking forever - e.g., first 500 pages)
    let processed = 0;
    while (linksToVisit.length > 0 && processed < 200) {
        const nextUrl = linksToVisit.shift();
        await scrapePage(nextUrl);
        processed++;
        // Polite delay
        await new Promise(r => setTimeout(r, 100));
    }

    // Sort and Save
    const output = results.join('\n');
    fs.writeFileSync(OUTPUT_FILE, output);
    console.log(`\nDone! Found ${results.length} video references.`);
    console.log(`Saved to ${OUTPUT_FILE}`);
}

run();
