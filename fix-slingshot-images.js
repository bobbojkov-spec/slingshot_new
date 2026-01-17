/**
 * Fix Slingshot Collection Images
 * 
 * The initial download got 404 HTML pages instead of images.
 * This script extracts the real image URLs from the HTML and re-downloads them.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const COLLECTIONS_DIR = path.join(__dirname, 'slingshot-collections');

/**
 * Extract real image URL from 404 HTML
 */
function extractImageUrlFromHtml(htmlContent) {
    // Look for the weglot-data JSON which contains the real URL
    const match = htmlContent.match(/<script type="application\/json" id="weglot-data">(.+?)<\/script>/);

    if (match) {
        try {
            const data = JSON.parse(match[1]);
            // Get the English URL
            if (data.allLanguageUrls && data.allLanguageUrls.en) {
                return data.allLanguageUrls.en;
            }
        } catch (e) {
            console.error('Failed to parse JSON:', e.message);
        }
    }

    // Fallback: look for href links
    const hrefMatch = htmlContent.match(/href="(https:\/\/slingshotsports\.com\/cdn\/shop\/files\/[^"]+)"/);
    if (hrefMatch) {
        return hrefMatch[1];
    }

    return null;
}

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

            if (response.statusCode !== 200) {
                reject(new Error(`HTTP ${response.statusCode}`));
                return;
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
 * Main fix function
 */
async function fixImages() {
    console.log('🔧 Fixing Slingshot Collection Images...\n');

    const folders = fs.readdirSync(COLLECTIONS_DIR).filter(f => {
        const fullPath = path.join(COLLECTIONS_DIR, f);
        return fs.statSync(fullPath).isDirectory();
    });

    let fixedCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    for (const folder of folders) {
        const folderPath = path.join(COLLECTIONS_DIR, folder);
        const heroFile = path.join(folderPath, `${folder}-hero.jpg`);

        if (!fs.existsSync(heroFile)) {
            console.log(`⚠️  Skipping ${folder} - no hero file found`);
            skippedCount++;
            continue;
        }

        try {
            // Read the current file
            const content = fs.readFileSync(heroFile, 'utf8');

            // Check if it's HTML (404 page)
            if (content.startsWith('<!DOCTYPE html>') || content.startsWith('<html')) {
                console.log(`🔍 Processing ${folder}...`);

                // Extract real image URL
                const realUrl = extractImageUrlFromHtml(content);

                if (realUrl) {
                    console.log(`   Found URL: ${realUrl.substring(0, 80)}...`);

                    // Download the real image
                    await downloadFile(realUrl, heroFile);

                    // Update metadata JSON
                    const metadataPath = path.join(folderPath, 'collection-data.json');
                    if (fs.existsSync(metadataPath)) {
                        const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
                        metadata.heroImageUrl = realUrl;
                        fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
                    }

                    console.log(`   ✅ Fixed!\n`);
                    fixedCount++;
                } else {
                    console.log(`   ❌ Could not extract URL\n`);
                    errorCount++;
                }
            } else {
                // File is already a valid image
                skippedCount++;
            }

            // Rate limiting
            await new Promise(resolve => setTimeout(resolve, 300));

        } catch (error) {
            console.error(`❌ Error processing ${folder}: ${error.message}\n`);
            errorCount++;
        }
    }

    console.log('\n✨ Fix Complete!\n');
    console.log(`📊 Summary:`);
    console.log(`   Fixed: ${fixedCount}`);
    console.log(`   Errors: ${errorCount}`);
    console.log(`   Skipped: ${skippedCount}`);
    console.log(`   Total: ${folders.length}\n`);
}

// Run the fix
fixImages().catch(console.error);
