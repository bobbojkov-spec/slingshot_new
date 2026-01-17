
require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
    try {
        console.log("--- AUDIT: Menu Groups (BG vs EN) ---");
        const groups = await pool.query(`SELECT id, title, title_bg FROM menu_groups`);
        const untranslatedGroups = groups.rows.filter(g => !g.title_bg || g.title_bg === g.title);

        console.log(`Found ${untranslatedGroups.length} / ${groups.rows.length} untranslated Menu Groups.`);
        untranslatedGroups.forEach(g => console.log(`[Group] EN: "${g.title}" | BG: "${g.title_bg}"`));

        console.log("\n--- AUDIT: Collections (Subtitle BG vs EN) ---");
        // Check collections where BG subtitle is missing or same as EN
        const collections = await pool.query(`
            SELECT 
                c.id, 
                c.slug,
                c.title,
                c.subtitle as en_subtitle, 
                ct.subtitle as bg_subtitle 
            FROM collections c
            LEFT JOIN collection_translations ct ON c.id = ct.collection_id AND ct.language_code = 'bg'
        `);

        const untranslatedCollections = collections.rows.filter(c => {
            // If EN is empty, skip (nothing to translate)
            if (!c.en_subtitle) return false;
            // If BG is missing or same as EN (and EN is not short/universal like 'Foil')
            // Actually user said "is 1:1 . translate it".
            // We'll list identical ones.
            return !c.bg_subtitle || c.bg_subtitle.trim() === c.en_subtitle.trim();
        });

        console.log(`Found ${untranslatedCollections.length} / ${collections.rows.length} untranslated Collection Subtitles.`);
        untranslatedCollections.forEach(c => console.log(`[Collection] ${c.slug}: EN="${c.en_subtitle?.substring(0, 30)}..." | BG="${c.bg_subtitle?.substring(0, 30)}..."`));

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
run();
