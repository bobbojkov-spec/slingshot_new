
require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
    try {
        console.log("Checking for incomplete BG subtitles...");

        // Find collections that have missing or empty or 'undefined' BG subtitle
        // but have a valid English subtitle
        const res = await pool.query(`
            SELECT 
                c.slug, 
                c.source,
                c.subtitle as en_subtitle, 
                ct.subtitle as bg_subtitle 
            FROM collections c
            LEFT JOIN collection_translations ct ON c.id = ct.collection_id AND ct.language_code = 'bg'
            WHERE 
                (ct.subtitle IS NULL OR ct.subtitle = '' OR ct.subtitle ILIKE '%undefined%')
        `);

        console.log(`Found ${res.rowCount} collections with problematic BG subtitles.`);
        res.rows.forEach(r => {
            console.log(`- ${r.slug}: EN="${r.en_subtitle?.substring(0, 20)}...", BG="${r.bg_subtitle}"`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
run();
