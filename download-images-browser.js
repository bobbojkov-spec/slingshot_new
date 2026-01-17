/**
 * Download Slingshot Collection Images - Browser Method
 * 
 * Uses curl to download images with proper headers to avoid 404s
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const COLLECTIONS_DIR = path.join(__dirname, 'slingshot-collections');

// Collection URLs to download (from browser scraping)
const COLLECTIONS = [
    { slug: 'kites', url: 'https://slingshotsports.com/en-eu/collections/kites' },
    { slug: 'twin-tips', url: 'https://slingshotsports.com/en-eu/collections/twin-tips' },
    { slug: 'bars', url: 'https://slingshotsports.com/en-eu/collections/bars' },
    { slug: 'surfboards', url: 'https://slingshotsports.com/en-eu/collections/surfboards' },
    { slug: 'kite-foil-boards', url: 'https://slingshotsports.com/en-eu/collections/kite-foil-boards' },
    { slug: 'kite-foils', url: 'https://slingshotsports.com/en-eu/collections/kite-foils' },
    { slug: 'kite-accessories', url: 'https://slingshotsports.com/en-eu/collections/kite-accessories' },
    { slug: 'foot-straps', url: 'https://slingshotsports.com/en-eu/collections/foot-straps' },
    { slug: 'trainer-kites', url: 'https://slingshotsports.com/en-eu/collections/trainer-kites' },
    { slug: 'pumps', url: 'https://slingshotsports.com/en-eu/collections/pumps' },
    { slug: 'kite-parts', url: 'https://slingshotsports.com/en-eu/collections/kite-parts' },
    { slug: 'apparel', url: 'https://slingshotsports.com/en-eu/collections/apparel' },
    { slug: 'big-air', url: 'https://slingshotsports.com/en-eu/collections/big-air' },
    { slug: 'wave-mastery', url: 'https://slingshotsports.com/en-eu/collections/wave-mastery' },
    { slug: 'wings', url: 'https://slingshotsports.com/en-eu/collections/wings' },
    { slug: 'wing-boards', url: 'https://slingshotsports.com/en-eu/collections/wing-boards' },
    { slug: 'wing-sup-boards', url: 'https://slingshotsports.com/en-eu/collections/wing-sup-boards' },
    { slug: 'wing-foils', url: 'https://slingshotsports.com/en-eu/collections/wing-foils' },
    { slug: 'wing-accessories', url: 'https://slingshotsports.com/en-eu/collections/wing-accessories' },
    { slug: 'board-mounting-systems', url: 'https://slingshotsports.com/en-eu/collections/board-mounting-systems' },
    { slug: 'wing-parts', url: 'https://slingshotsports.com/en-eu/collections/wing-parts' },
    { slug: 'wing-flow-state', url: 'https://slingshotsports.com/en-eu/collections/wing-flow-state' },
    { slug: 'wing-glide-zone', url: 'https://slingshotsports.com/en-eu/collections/wing-glide-zone' },
    { slug: 'quick-flite', url: 'https://slingshotsports.com/en-eu/collections/quick-flite' },
    { slug: 'wakeboards', url: 'https://slingshotsports.com/en-eu/collections/wakeboards' },
    { slug: 'wake-boots', url: 'https://slingshotsports.com/en-eu/collections/wake-boots' },
    { slug: 'wake-foil-boards', url: 'https://slingshotsports.com/en-eu/collections/wake-foil-boards' },
    { slug: 'wake-foils', url: 'https://slingshotsports.com/en-eu/collections/wake-foils' },
    { slug: 'wakesurf', url: 'https://slingshotsports.com/en-eu/collections/wakesurf' },
    { slug: 'wake-accessories', url: 'https://slingshotsports.com/en-eu/collections/wake-accessories' },
    { slug: 'gummy-straps', url: 'https://slingshotsports.com/en-eu/collections/gummy-straps' },
    { slug: 'wake-parts', url: 'https://slingshotsports.com/en-eu/collections/wake-parts' },
    { slug: 'jibbers', url: 'https://slingshotsports.com/en-eu/collections/jibbers' },
    { slug: 'senders', url: 'https://slingshotsports.com/en-eu/collections/senders' },
    { slug: 'cable-quick-start', url: 'https://slingshotsports.com/en-eu/collections/cable-quick-start' },
    { slug: 'wake-glide-zone', url: 'https://slingshotsports.com/en-eu/collections/wake-glide-zone' },
    { slug: 'dock-pump', url: 'https://slingshotsports.com/en-eu/collections/dock-pump' },
    { slug: 'wake-foil-quick-start', url: 'https://slingshotsports.com/en-eu/collections/wake-foil-quick-start' },
    { slug: 'foil-boards', url: 'https://slingshotsports.com/en-eu/collections/foil-boards' },
    { slug: 'foil-packages', url: 'https://slingshotsports.com/en-eu/collections/foil-packages' },
    { slug: 'foil-front-wings', url: 'https://slingshotsports.com/en-eu/collections/foil-front-wings' },
    { slug: 'web-specials-foils', url: 'https://slingshotsports.com/en-eu/collections/web-specials-foils' },
    { slug: 'web-specials-foil-front-wings', url: 'https://slingshotsports.com/en-eu/collections/web-specials-foil-front-wings' },
    { slug: 'web-specials-foil-masts', url: 'https://slingshotsports.com/en-eu/collections/web-specials-foil-masts' },
    { slug: 'web-specials-foil-stabilizers', url: 'https://slingshotsports.com/en-eu/collections/web-specials-foil-stabilizers' },
    { slug: 'web-specials-foil-packages', url: 'https://slingshotsports.com/en-eu/collections/web-specials-foil-packages' },
    { slug: 'web-specials-foil-windsurf', url: 'https://slingshotsports.com/en-eu/collections/web-specials-foil-windsurf' },
    { slug: 'web-specials-foil-parts', url: 'https://slingshotsports.com/en-eu/collections/web-specials-foil-parts' },
    { slug: 'web-specials-kite', url: 'https://slingshotsports.com/en-eu/collections/web-specials-kite' },
    { slug: 'web-specials-kites', url: 'https://slingshotsports.com/en-eu/collections/web-specials-kites' },
    { slug: 'web-specials-kite-bars', url: 'https://slingshotsports.com/en-eu/collections/web-specials-kite-bars' },
];

function downloadImage(slug, pageUrl) {
    const folderPath = path.join(COLLECTIONS_DIR, slug);
    const outputFile = path.join(folderPath, `${slug}-hero.jpg`);

    try {
        // Fetch the page HTML with curl
        console.log(`📥 Fetching ${slug}...`);
        const html = execSync(`curl -s -L "${pageUrl}"`, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });

        // Extract image URL from hero__image-wrapper
        const imgMatch = html.match(/<img[^>]+src="\/\/slingshotsports\.com\/cdn\/shop\/files\/([^"]+)"/);

        if (!imgMatch) {
            console.log(`  ⚠️  No hero image found in HTML`);
            return false;
        }

        const imageUrl = `https://slingshotsports.com/cdn/shop/files/${imgMatch[1]}`;
        console.log(`  📸 Found image: ${imageUrl.substring(0, 80)}...`);

        // Download the image with curl
        execSync(`curl -s -L "${imageUrl}" -o "${outputFile}"`, { stdio: 'inherit' });

        // Verify it's actually an image (check file size and first bytes)
        const stats = fs.statSync(outputFile);
        const firstBytes = fs.readFileSync(outputFile, { encoding: 'utf8' }).substring(0, 20);

        if (stats.size < 1000 || firstBytes.includes('<!DOCTYPE') || firstBytes.includes('<html')) {
            console.log(`  ❌ Downloaded file is not an image (${stats.size} bytes)`);
            return false;
        }

        console.log(`  ✅ Downloaded (${Math.round(stats.size / 1024)} KB)\n`);
        return true;

    } catch (error) {
        console.log(`  ❌ Error: ${error.message}\n`);
        return false;
    }
}

async function main() {
    console.log('🚀 Downloading Slingshot Collection Images via Browser Method...\n');

    let successCount = 0;
    let errorCount = 0;

    for (const collection of COLLECTIONS) {
        const success = downloadImage(collection.slug, collection.url);
        if (success) {
            successCount++;
        } else {
            errorCount++;
        }

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('\n✨ Download Complete!\n');
    console.log(`📊 Summary:`);
    console.log(`   Successful: ${successCount}`);
    console.log(`   Failed: ${errorCount}`);
    console.log(`   Total: ${COLLECTIONS.length}\n`);
}

main().catch(console.error);
