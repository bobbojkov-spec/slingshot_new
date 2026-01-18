
import puppeteer from 'puppeteer';

const TARGET_URLS = [
    'https://slingshotsports.com/en-eu/collections/wake-foil-quick-start',
    'https://slingshotsports.com/en-eu/products/crisis-v8', // Positive control
    'https://slingshotsports.com/en-eu/collections/foil-main'
];

async function main() {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        for (const url of TARGET_URLS) {
            console.log(`\nAnalyzing ${url}...`);
            const page = await browser.newPage();

            // Capture all network requests to find video resources
            page.on('request', req => {
                if (req.url().includes('youtube') || req.url().includes('vimeo')) {
                    // console.log(`[NETWORK] Found video request: ${req.url()}`);
                }
            });

            await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

            // Deep scan of the DOM
            const findings = await page.evaluate(() => {
                const results: any[] = [];

                // 1. Check all Iframes
                document.querySelectorAll('iframe').forEach(el => {
                    results.push({ type: 'iframe', src: el.src, html: el.outerHTML });
                });

                // 2. Check all Videos
                document.querySelectorAll('video').forEach(el => {
                    results.push({ type: 'video_tag', src: el.currentSrc, html: el.outerHTML });
                });

                // 3. Check data attributes (common in Shopify themes)
                const all = document.querySelectorAll('*');
                all.forEach(el => {
                    for (let i = 0; i < el.attributes.length; i++) {
                        const attr = el.attributes[i];
                        if (attr.name.includes('video') || attr.value.includes('youtube') || attr.value.includes('youtu.be')) {
                            results.push({
                                type: 'attribute_match',
                                tag: el.tagName,
                                attr: attr.name,
                                val: attr.value,
                                html: el.outerHTML.substring(0, 200)
                            });
                        }
                    }
                });

                // 4. Check Script tags for JSON data
                document.querySelectorAll('script').forEach(el => {
                    if (el.textContent && (el.textContent.includes('youtube.com') || el.textContent.includes('youtu.be'))) {
                        // Extract potential IDs
                        const matches = el.textContent.match(/(?:v=|v\/|embed\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/g);
                        if (matches) {
                            results.push({ type: 'script_match', matches: matches, snippet: el.textContent.substring(0, 100) + '...' });
                        }
                    }
                });

                // 5. Check explicitly for "generic" links to exclude them if possible, or flag them
                document.querySelectorAll('a').forEach(el => {
                    if (el.href.includes('youtube.com') || el.href.includes('youtu.be')) {
                        results.push({ type: 'link', href: el.href, text: el.textContent });
                    }
                });

                return results;
            });

            console.log('--- FINDINGS ---');
            const specificFindings = findings.filter((f: any) => {
                const str = JSON.stringify(f).toLowerCase();
                // Filter out generic channel strings
                if (str.includes('user/slingshotsports') || str.includes('channel/')) return false;
                // MUST contain video ID indicators OR be a direct video mechanism
                // Relaxed filter: if it's an iframe with youtube, keep it (unless it's the user channel?)
                return str.includes('v=') || str.includes('embed') || str.includes('youtu.be') || str.includes('data-video-id');
            });

            if (specificFindings.length === 0) {
                console.log('No SPECIFIC video elements found (filtered out generics).');
            } else {
                specificFindings.forEach((f: any) => console.log(JSON.stringify(f, null, 2)));
            }

            await page.close();
        }

    } catch (e) {
        console.error("Error:", e);
    } finally {
        await browser.close();
    }
}

main();
