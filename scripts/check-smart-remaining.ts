
import 'dotenv/config';
import { query } from '../lib/db';

async function check() {
    const { rows } = await query(`
    SELECT count(*) as count
    FROM products p
    JOIN product_translations pt_bg ON p.id = pt_bg.product_id AND pt_bg.language_code = 'bg'
    JOIN product_translations pt_en ON p.id = pt_en.product_id AND pt_en.language_code = 'en'
    WHERE 
      (pt_bg.description_html = pt_en.description_html AND length(pt_en.description_html) > 10)
      OR 
      (pt_bg.title = pt_en.title AND length(pt_en.title) > 20)
  `);
    console.log(`Remaining Candidates: ${rows[0].count}`);
    process.exit(0);
}
check();
