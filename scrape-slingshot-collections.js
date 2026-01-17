/**
 * Slingshot Sports Collection Scraper
 * 
 * Scrapes ALL collections from Slingshot Sports website including:
 * - Collection title, subtitle, slug
 * - Hero images and videos
 * - Category mapping
 * 
 * Downloads media and creates JSON metadata for database import
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

// All collection URLs discovered from the website
const COLLECTION_URLS = [
    // Kite Collections
    { url: 'https://slingshotsports.com/en-eu/collections/kite-main', category: 'Kite' },
    { url: 'https://slingshotsports.com/en-eu/collections/kites', category: 'Kite' },
    { url: 'https://slingshotsports.com/en-eu/collections/twin-tips', category: 'Kite' },
    { url: 'https://slingshotsports.com/en-eu/collections/bars', category: 'Kite' },
    { url: 'https://slingshotsports.com/en-eu/collections/surfboards', category: 'Kite' },
    { url: 'https://slingshotsports.com/en-eu/collections/kite-foil-boards', category: 'Kite' },
    { url: 'https://slingshotsports.com/en-eu/collections/kite-foils', category: 'Kite' },
    { url: 'https://slingshotsports.com/en-eu/collections/kite-accessories', category: 'Kite' },
    { url: 'https://slingshotsports.com/en-eu/collections/foot-straps', category: 'Kite' },
    { url: 'https://slingshotsports.com/en-eu/collections/trainer-kites', category: 'Kite' },
    { url: 'https://slingshotsports.com/en-eu/collections/pumps', category: 'Kite' },
    { url: 'https://slingshotsports.com/en-eu/collections/kite-parts', category: 'Kite' },
    { url: 'https://slingshotsports.com/en-eu/collections/apparel', category: 'Kite' },
    { url: 'https://slingshotsports.com/en-eu/collections/big-air', category: 'Kite' },
    { url: 'https://slingshotsports.com/en-eu/collections/wave-mastery', category: 'Kite' },
    { url: 'https://slingshotsports.com/en-eu/collections/championship-freestyle', category: 'Kite' },
    { url: 'https://slingshotsports.com/en-eu/collections/freeride', category: 'Kite' },
    { url: 'https://slingshotsports.com/en-eu/collections/more-from-less', category: 'Kite' },
    { url: 'https://slingshotsports.com/en-eu/collections/ride-to-fly', category: 'Kite' },

    // Wing Collections
    { url: 'https://slingshotsports.com/en-eu/collections/wing-main', category: 'Wing' },
    { url: 'https://slingshotsports.com/en-eu/collections/wings', category: 'Wing' },
    { url: 'https://slingshotsports.com/en-eu/collections/wing-boards', category: 'Wing' },
    { url: 'https://slingshotsports.com/en-eu/collections/wing-sup-boards', category: 'Wing' },
    { url: 'https://slingshotsports.com/en-eu/collections/wing-foils', category: 'Wing' },
    { url: 'https://slingshotsports.com/en-eu/collections/wing-accessories', category: 'Wing' },
    { url: 'https://slingshotsports.com/en-eu/collections/board-mounting-systems', category: 'Wing' },
    { url: 'https://slingshotsports.com/en-eu/collections/wing-parts', category: 'Wing' },
    { url: 'https://slingshotsports.com/en-eu/collections/wing-flow-state', category: 'Wing' },
    { url: 'https://slingshotsports.com/en-eu/collections/wing-glide-zone', category: 'Wing' },
    { url: 'https://slingshotsports.com/en-eu/collections/quick-flite', category: 'Wing' },

    // Wake Collections
    { url: 'https://slingshotsports.com/en-eu/collections/wake-main', category: 'Wake' },
    { url: 'https://slingshotsports.com/en-eu/collections/wakeboards', category: 'Wake' },
    { url: 'https://slingshotsports.com/en-eu/collections/wake-boots', category: 'Wake' },
    { url: 'https://slingshotsports.com/en-eu/collections/wake-foil-boards', category: 'Wake' },
    { url: 'https://slingshotsports.com/en-eu/collections/wake-foils', category: 'Wake' },
    { url: 'https://slingshotsports.com/en-eu/collections/wakesurf', category: 'Wake' },
    { url: 'https://slingshotsports.com/en-eu/collections/wake-accessories', category: 'Wake' },
    { url: 'https://slingshotsports.com/en-eu/collections/gummy-straps', category: 'Wake' },
    { url: 'https://slingshotsports.com/en-eu/collections/wake-parts', category: 'Wake' },
    { url: 'https://slingshotsports.com/en-eu/collections/jibbers', category: 'Wake' },
    { url: 'https://slingshotsports.com/en-eu/collections/senders', category: 'Wake' },
    { url: 'https://slingshotsports.com/en-eu/collections/cable-quick-start', category: 'Wake' },
    { url: 'https://slingshotsports.com/en-eu/collections/wake-glide-zone', category: 'Wake' },
    { url: 'https://slingshotsports.com/en-eu/collections/dock-pump', category: 'Wake' },
    { url: 'https://slingshotsports.com/en-eu/collections/wake-foil-quick-start', category: 'Wake' },

    // Foil Collections
    { url: 'https://slingshotsports.com/en-eu/collections/foil-main', category: 'Foil' },
    { url: 'https://slingshotsports.com/en-eu/collections/foil-boards', category: 'Foil' },
    { url: 'https://slingshotsports.com/en-eu/collections/foil-packages', category: 'Foil' },
    { url: 'https://slingshotsports.com/en-eu/collections/foil-front-wings', category: 'Foil' },
    { url: 'https://slingshotsports.com/en-eu/collections/foil-masts', category: 'Foil' },
    { url: 'https://slingshotsports.com/en-eu/collections/foil-stabilizers', category: 'Foil' },
    { url: 'https://slingshotsports.com/en-eu/collections/foil-board-mounting', category: 'Foil' },
    { url: 'https://slingshotsports.com/en-eu/collections/foil-parts', category: 'Foil' },

    // Web Specials
    { url: 'https://slingshotsports.com/en-eu/collections/web-specials-foils', category: 'Web Specials' },
    { url: 'https://slingshotsports.com/en-eu/collections/web-specials-foil-front-wings', category: 'Web Specials' },
    { url: 'https://slingshotsports.com/en-eu/collections/web-specials-foil-masts', category: 'Web Specials' },
    { url: 'https://slingshotsports.com/en-eu/collections/web-specials-foil-stabilizers', category: 'Web Specials' },
    { url: 'https://slingshotsports.com/en-eu/collections/web-specials-foil-packages', category: 'Web Specials' },
    { url: 'https://slingshotsports.com/en-eu/collections/web-specials-foil-windsurf', category: 'Web Specials' },
    { url: 'https://slingshotsports.com/en-eu/collections/web-specials-foil-parts', category: 'Web Specials' },
    { url: 'https://slingshotsports.com/en-eu/collections/web-specials-kite', category: 'Web Specials' },
    { url: 'https://slingshotsports.com/en-eu/collections/web-specials-kites', category: 'Web Specials' },
    { url: 'https://slingshotsports.com/en-eu/collections/web-specials-kite-bars', category: 'Web Specials' },
    { url: 'https://slingshotsports.com/en-eu/collections/web-specials-kite-boards', category: 'Web Specials' },
    { url: 'https://slingshotsports.com/en-eu/collections/web-specials-kite-packages', category: 'Web Specials' },
    { url: 'https://slingshotsports.com/en-eu/collections/web-specials-kite-parts', category: 'Web Specials' },
    { url: 'https://slingshotsports.com/en-eu/collections/web-specials-wing', category: 'Web Specials' },
    { url: 'https://slingshotsports.com/en-eu/collections/web-specials-wing-wings', category: 'Web Specials' },
    { url: 'https://slingshotsports.com/en-eu/collections/web-specials-wing-boards', category: 'Web Specials' },
    { url: 'https://slingshotsports.com/en-eu/collections/web-specials-wing-foils', category: 'Web Specials' },
    { url: 'https://slingshotsports.com/en-eu/collections/web-specials-wake', category: 'Web Specials' },
    { url: 'https://slingshotsports.com/en-eu/collections/web-specials-wake-boards', category: 'Web Specials' },
    { url: 'https://slingshotsports.com/en-eu/collections/web-specials-wake-boots', category: 'Web Specials' },
];

const OUTPUT_DIR = path.join(__dirname, 'slingshot-collections');

/**
 * Fetch HTML content from URL
 */
function fetchHTML(url) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;
        protocol.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}

/**
 * Download file from URL
 */
function downloadFile(url, filepath) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filepath);
        const protocol = url.startsWith('https') ? https : http;

        protocol.get(url, (response) => {
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(filepath, () => { });
            reject(err);
        });
    });
}

/**
 * Extract collection data from HTML
 */
function extractCollectionData(html, url, category) {
    const dom = new JSDOM(html);
    const doc = dom.window.document;

    // Extract title
    const titleEl = doc.querySelector('.hero__title, .section-header__title, h1');
    const title = titleEl ? titleEl.textContent.trim() : '';

    // Extract subtitle
    const subtitleEl = doc.querySelector('.hero__subtitle, .section-header__description, .rte');
    const subtitle = subtitleEl ? subtitleEl.textContent.trim() : '';

    // Extract hero image
    let heroImageUrl = '';
    const heroSection = doc.querySelector('.collection-hero, .hero, .header-section, [class*="hero"]');

    if (heroSection) {
        // Check for data-bgset attribute
        const bgset = heroSection.getAttribute('data-bgset');
        if (bgset) {
            const parts = bgset.split(',');
            heroImageUrl = parts[parts.length - 1].trim().split(' ')[0];
        } else {
            // Check for background-image in style
            const style = heroSection.getAttribute('style');
            if (style && style.includes('background-image')) {
                const match = style.match(/url\(['"]?(.*?)['"]?\)/);
                if (match) heroImageUrl = match[1];
            }

            // Check for img tag
            if (!heroImageUrl) {
                const img = heroSection.querySelector('img');
                if (img) {
                    heroImageUrl = img.getAttribute('data-src') || img.getAttribute('src') || '';
                }
            }
        }
    }

    // Fallback to og:image meta tag
    if (!heroImageUrl) {
        const ogImage = doc.querySelector('meta[property="og:image"]');
        if (ogImage) heroImageUrl = ogImage.getAttribute('content') || '';
    }

    // Fix protocol-relative URLs
    if (heroImageUrl.startsWith('//')) {
        heroImageUrl = 'https:' + heroImageUrl;
    }

    // Extract hero video if exists
    let heroVideoUrl = '';
    const video = doc.querySelector('video source, video[src]');
    if (video) {
        heroVideoUrl = video.getAttribute('src') || '';
        if (heroVideoUrl.startsWith('//')) {
            heroVideoUrl = 'https:' + heroVideoUrl;
        }
    }

    // Extract slug from URL
    const slug = url.split('/').pop();

    return {
        title,
        subtitle,
        heroImageUrl,
        heroVideoUrl,
        slug,
        category,
        collectionUrl: url
    };
}

/**
 * Sanitize filename
 */
function sanitizeFilename(filename) {
    return filename.replace(/[^a-z0-9-_]/gi, '-').toLowerCase();
}

/**
 * Main scraping function
 */
async function scrapeCollections() {
    console.log('🚀 Starting Slingshot Collections Scraper...\n');

    // Create output directory
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    const allCollections = [];
    let successCount = 0;
    let errorCount = 0;

    for (const { url, category } of COLLECTION_URLS) {
        try {
            console.log(`📥 Scraping: ${url}`);

            // Fetch HTML
            const html = await fetchHTML(url);

            // Extract data
            const collectionData = extractCollectionData(html, url, category);

            // Create folder for this collection
            const folderName = sanitizeFilename(collectionData.slug);
            const collectionDir = path.join(OUTPUT_DIR, folderName);

            if (!fs.existsSync(collectionDir)) {
                fs.mkdirSync(collectionDir, { recursive: true });
            }

            // Download hero image
            if (collectionData.heroImageUrl) {
                const ext = collectionData.heroImageUrl.includes('.jpg') ? 'jpg' :
                    collectionData.heroImageUrl.includes('.png') ? 'png' : 'jpg';
                const imagePath = path.join(collectionDir, `${folderName}-hero.${ext}`);

                try {
                    await downloadFile(collectionData.heroImageUrl, imagePath);
                    collectionData.heroImageFile = `${folderName}-hero.${ext}`;
                    console.log(`  ✅ Downloaded hero image`);
                } catch (err) {
                    console.log(`  ⚠️  Failed to download hero image: ${err.message}`);
                }
            }

            // Download hero video if exists
            if (collectionData.heroVideoUrl) {
                const videoPath = path.join(collectionDir, `${folderName}-hero.mp4`);

                try {
                    await downloadFile(collectionData.heroVideoUrl, videoPath);
                    collectionData.heroVideoFile = `${folderName}-hero.mp4`;
                    console.log(`  ✅ Downloaded hero video`);
                } catch (err) {
                    console.log(`  ⚠️  Failed to download hero video: ${err.message}`);
                }
            }

            // Save metadata JSON
            const metadataPath = path.join(collectionDir, 'collection-data.json');
            fs.writeFileSync(metadataPath, JSON.stringify(collectionData, null, 2));

            allCollections.push(collectionData);
            successCount++;

            console.log(`  ✅ Completed: ${collectionData.title}\n`);

            // Rate limiting - wait 500ms between requests
            await new Promise(resolve => setTimeout(resolve, 500));

        } catch (error) {
            console.error(`  ❌ Error scraping ${url}: ${error.message}\n`);
            errorCount++;
        }
    }

    // Save master JSON file
    const masterPath = path.join(OUTPUT_DIR, 'all-collections.json');
    fs.writeFileSync(masterPath, JSON.stringify(allCollections, null, 2));

    // Generate summary report
    const summary = {
        totalCollections: COLLECTION_URLS.length,
        successfulScrapes: successCount,
        failedScrapes: errorCount,
        scrapedAt: new Date().toISOString(),
        categories: {
            Kite: allCollections.filter(c => c.category === 'Kite').length,
            Wing: allCollections.filter(c => c.category === 'Wing').length,
            Wake: allCollections.filter(c => c.category === 'Wake').length,
            Foil: allCollections.filter(c => c.category === 'Foil').length,
            'Web Specials': allCollections.filter(c => c.category === 'Web Specials').length,
        }
    };

    const summaryPath = path.join(OUTPUT_DIR, 'scrape-summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

    console.log('\n✨ Scraping Complete!\n');
    console.log(`📊 Summary:`);
    console.log(`   Total Collections: ${summary.totalCollections}`);
    console.log(`   Successful: ${summary.successfulScrapes}`);
    console.log(`   Failed: ${summary.failedScrapes}`);
    console.log(`\n📁 Output Directory: ${OUTPUT_DIR}`);
    console.log(`📄 Master JSON: ${masterPath}`);
    console.log(`📄 Summary: ${summaryPath}\n`);
}

// Run the scraper
scrapeCollections().catch(console.error);
