import fs from 'fs';
import path from 'path';

const SCRAPED_DATA_PATH = '/Users/borislavbojkov/dev/rideengine-eu-scrape/scraped_data.json';
const EXISTING_STATE_PATH = '/Users/borislavbojkov/dev/slingshot_new/existing_state.json';

const scrapedData = JSON.parse(fs.readFileSync(SCRAPED_DATA_PATH, 'utf8'));
const existingState = JSON.parse(fs.readFileSync(EXISTING_STATE_PATH, 'utf8'));

// Map of scraped collection handles and titles to their hero media
const scrapedHeroMap = new Map();
scrapedData.collections.forEach((c: any) => {
    if (c.heroImage || c.heroVideo) {
        scrapedHeroMap.set(c.handle.toLowerCase(), { heroImage: c.heroImage, heroVideo: c.heroVideo });
        scrapedHeroMap.set(c.title.toLowerCase(), { heroImage: c.heroImage, heroVideo: c.heroVideo });
    }
});

let report = '# Collection Hero Media Audit\n\n';
report += 'Comparison of your existing collections against scraped Ride Engine EU hero media.\n\n';
report += '| Collection Title | Handle | Current Hero? | Scraped Hero Found? | Status |\n';
report += '| :--- | :--- | :--- | :--- | :--- |\n';

existingState.collections.forEach((col: any) => {
    const handle = col.handle.toLowerCase();
    const title = col.title.toLowerCase();

    // Check for Ride Engine collections
    const isRideEngine = handle.includes('ride-engine') || handle.includes('rideengine');
    if (!isRideEngine) return;

    const hasCurrentHero = !!col.image_url;
    const scrapedMedia = scrapedHeroMap.get(handle) || scrapedHeroMap.get(title);
    const hasScrapedHero = !!scrapedMedia;

    let status = '-';
    if (hasCurrentHero) status = '✅ OK';
    else if (hasScrapedHero) status = '🆕 Mapped during import';
    else status = '❌ Missing in Scrape';

    report += `| ${col.title} | ${col.handle} | ${hasCurrentHero ? 'Yes' : 'No'} | ${hasScrapedHero ? 'Yes' : 'No'} | ${status} |\n`;
});

fs.writeFileSync('collection_hero_audit.md', report);
console.log('Audit report generated in collection_hero_audit.md');
