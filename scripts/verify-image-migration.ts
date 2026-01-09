
import 'dotenv/config';
import { query } from '../lib/db';

async function verify() {
    const { rows: piRows } = await query(`
    SELECT count(*) as count FROM product_images WHERE url LIKE '%supabase%'
  `);
    const { rows: pRows } = await query(`
    SELECT count(*) as count FROM products WHERE og_image_url LIKE '%supabase%'
  `);

    const piCount = parseInt(piRows[0].count);
    const pCount = parseInt(pRows[0].count);

    console.log(`Remaining Supabase Product Images: ${piCount}`);
    console.log(`Remaining Supabase OG Images: ${pCount}`);

    if (piCount === 0 && pCount === 0) {
        console.log('✅ All images migrated successfully to Railway.');
        process.exit(0);
    } else {
        console.log('⚠️ Some images still point to Supabase.');
        process.exit(1);
    }
}

verify();
