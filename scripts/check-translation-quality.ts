
import 'dotenv/config';
import { query } from '../lib/db';

async function check() {
    const { rows } = await query(`
    SELECT title, description_html 
    FROM product_translations 
    WHERE language_code = 'bg' AND updated_at > NOW() - INTERVAL '5 minutes'
    LIMIT 5
  `);
    console.log('--- Sample Translations ---');
    rows.forEach(r => {
        console.log(`Title: ${r.title}`);
        console.log(`Desc Snippet: ${r.description_html?.substring(0, 100)}...`);
        console.log('---');
    });
    process.exit(0);
}
check();
