/**
 * Download Slingshot Collections Media
 * 
 * Downloads all hero images from the scraped collection data
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const { SLINGSHOT_COLLECTIONS } = require('./slingshot-collections-data.js');

const OUTPUT_DIR = path.join(__dirname, 'slingshot-collections');

/**
 * Download file from URL
 */
function downloadFile(url, filepath) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filepath);

        https.get(url, (response) => {
            // Handle redirects
            if (response.statusCode === 301 || response.statusCode === 302) {
                return downloadFile(response.headers.location, filepath).then(resolve).catch(reject);
            }

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
 * Sanitize filename
 */
function sanitizeFilename(filename) {
    return filename.replace(/[^a-z0-9-_]/gi, '-').toLowerCase();
}

/**
 * Main download function
 */
async function downloadCollections() {
    console.log('🚀 Starting Slingshot Collections Media Download...\n');
    console.log(`📦 Total Collections: ${SLINGSHOT_COLLECTIONS.length}\n`);

    // Create output directory
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    let successCount = 0;
    let errorCount = 0;

    for (const collection of SLINGSHOT_COLLECTIONS) {
        try {
            console.log(`📥 Processing: ${collection.title} (${collection.slug})`);

            // Create folder for this collection
            const folderName = sanitizeFilename(collection.slug);
            const collectionDir = path.join(OUTPUT_DIR, folderName);

            if (!fs.existsSync(collectionDir)) {
                fs.mkdirSync(collectionDir, { recursive: true });
            }

            // Download hero image
            if (collection.heroImageUrl) {
                const ext = collection.heroImageUrl.includes('.jpg') ? 'jpg' :
                    collection.heroImageUrl.includes('.png') ? 'png' : 'jpg';
                const imagePath = path.join(collectionDir, `${folderName}-hero.${ext}`);

                try {
                    await downloadFile(collection.heroImageUrl, imagePath);
                    collection.heroImageFile = `${folderName}-hero.${ext}`;
                    console.log(`  ✅ Downloaded hero image`);
                } catch (err) {
                    console.log(`  ⚠️  Failed to download hero image: ${err.message}`);
                }
            }

            // Download hero video if exists
            if (collection.heroVideoUrl) {
                const videoPath = path.join(collectionDir, `${folderName}-hero.mp4`);

                try {
                    await downloadFile(collection.heroVideoUrl, videoPath);
                    collection.heroVideoFile = `${folderName}-hero.mp4`;
                    console.log(`  ✅ Downloaded hero video`);
                } catch (err) {
                    console.log(`  ⚠️  Failed to download hero video: ${err.message}`);
                }
            }

            // Save metadata JSON
            const metadataPath = path.join(collectionDir, 'collection-data.json');
            fs.writeFileSync(metadataPath, JSON.stringify(collection, null, 2));

            successCount++;
            console.log(`  ✅ Completed\n`);

            // Rate limiting - wait 300ms between requests
            await new Promise(resolve => setTimeout(resolve, 300));

        } catch (error) {
            console.error(`  ❌ Error processing ${collection.slug}: ${error.message}\n`);
            errorCount++;
        }
    }

    // Save master JSON file
    const masterPath = path.join(OUTPUT_DIR, 'all-collections.json');
    fs.writeFileSync(masterPath, JSON.stringify(SLINGSHOT_COLLECTIONS, null, 2));

    // Generate summary report
    const summary = {
        totalCollections: SLINGSHOT_COLLECTIONS.length,
        successfulDownloads: successCount,
        failedDownloads: errorCount,
        downloadedAt: new Date().toISOString(),
        categories: {
            Kite: SLINGSHOT_COLLECTIONS.filter(c => c.category === 'Kite').length,
            Wing: SLINGSHOT_COLLECTIONS.filter(c => c.category === 'Wing').length,
            Wake: SLINGSHOT_COLLECTIONS.filter(c => c.category === 'Wake').length,
            Foil: SLINGSHOT_COLLECTIONS.filter(c => c.category === 'Foil').length,
            'Web Specials': SLINGSHOT_COLLECTIONS.filter(c => c.category === 'Web Specials').length,
        }
    };

    const summaryPath = path.join(OUTPUT_DIR, 'download-summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

    console.log('\n✨ Download Complete!\n');
    console.log(`📊 Summary:`);
    console.log(`   Total Collections: ${summary.totalCollections}`);
    console.log(`   Successful: ${summary.successfulDownloads}`);
    console.log(`   Failed: ${summary.failedDownloads}`);
    console.log(`\n📁 Output Directory: ${OUTPUT_DIR}`);
    console.log(`📄 Master JSON: ${masterPath}`);
    console.log(`📄 Summary: ${summaryPath}\n`);
}

// Run the downloader
downloadCollections().catch(console.error);
