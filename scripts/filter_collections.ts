import fs from 'fs';
import path from 'path';

const SCRAPED_DATA_PATH = '/Users/borislavbojkov/dev/rideengine-eu-scrape/scraped_data.json';
const EXISTING_STATE_PATH = '/Users/borislavbojkov/dev/slingshot_new/existing_state.json';

const scrapedData = JSON.parse(fs.readFileSync(SCRAPED_DATA_PATH, 'utf8'));
const existingState = JSON.parse(fs.readFileSync(EXISTING_STATE_PATH, 'utf8'));

const existingHandles = new Set(existingState.collections.map((c: any) => c.handle.toLowerCase()));
const existingTitles = new Set(existingState.collections.map((c: any) => c.title.toLowerCase()));
const existingProductTitles = new Set(existingState.products.map((p: any) => p.title.toLowerCase()));
const existingProductHandles = new Set(existingState.products.map((p: any) => p.handle.toLowerCase()));

// Filtering logic
const candidates = scrapedData.collections.filter((col: any) => {
    const handle = col.handle.toLowerCase();
    const title = col.title.toLowerCase();

    // 1. Must not exist as a collection (exact match)
    if (existingHandles.has(handle) || existingTitles.has(title)) return false;

    // 2. Fuzzy match against existing collections (e.g. "Harnesses" vs "Ride Engine Harnesses")
    for (const existingTitle of existingTitles as any) {
        if (title.includes(existingTitle) || existingTitle.includes(title)) return false;
    }

    // 3. Must not match or be a substring of an existing product (prevents products as collections)
    for (const prodTitle of existingProductTitles as any) {
        const pt = prodTitle.toLowerCase();
        // If collection title is inside product title or vice versa (fuzzy)
        if (title.length > 5 && (pt.includes(title) || title.includes(pt))) return false;
    }
    for (const ph of existingProductHandles as any) {
        if (handle.length > 5 && (ph.includes(handle) || handle.includes(ph))) return false;
    }

    // 4. Exclude obvious system/meta/test collections
    const excludeKeywords = [
        'test', 'all products', 'all', 'sale', 'black friday', 'gift guide',
        'search', 'inventory', 'shapers', 'angely', 'bouillot', 'mq'
    ];
    if (excludeKeywords.some(k => title.toLowerCase().includes(k))) return false;

    // 5. Exclude if title looks like a specific product name (often has version numbers or v1/v2)
    if (/\bv\d+\b/i.test(title)) return false;

    // 6. Exclude very specific combinations that look like variants or filtered views
    if (title.includes('&') && title.length > 20) return false;

    return true;
});

console.log('--- HIGHLY FILTERED NEW COLLECTIONS CANDIDATES ---');
candidates.forEach((c: any) => {
    console.log(`- ${c.title} (${c.handle})`);
});
