
const fs = require('fs');

const data = JSON.parse(fs.readFileSync('scripts/scrape-rideengine/rideengine_data/raw/all_collections.json', 'utf8'));

console.log('Total collections:', data.collections.length);

console.log('\n--- Checking for UUID-like handles ---');
const badHandles = data.collections.filter(c => c.handle.match(/[0-9a-f]{8}-[0-9a-f]{4}/));
if (badHandles.length > 0) {
    console.log(`Found ${badHandles.length} potential UUID handles:`);
    badHandles.forEach(c => console.log(`- ${c.title} (${c.handle}) [Products: ${c.products ? c.products.length : 0}]`));
} else {
    console.log('No UUID-like handles found in source JSON.');
}

console.log('\n--- Checking for "changing-robes-ponchos" ---');
const robes = data.collections.find(c => c.handle === 'changing-robes-ponchos' || c.url.includes('changing-robes-ponchos'));
if (robes) {
    console.log('Found "changing-robes-ponchos":');
    console.log(`- Handle: ${robes.handle}`);
    console.log(`- Products: ${robes.products ? robes.products.length : 0}`);
} else {
    console.log('NOT FOUND: "changing-robes-ponchos"');
}

console.log('\n--- Checking for Empty Collections in JSON ---');
const empty = data.collections.filter(c => !c.products || c.products.length === 0);
if (empty.length > 0) {
    console.log(`Found ${empty.length} empty collections in source JSON:`);
    empty.forEach(c => console.log(`- ${c.title} (${c.handle})`));
}
