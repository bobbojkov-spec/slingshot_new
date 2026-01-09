
import 'dotenv/config';
import { query } from '../lib/db';

async function verify() {
    const { rows } = await query(`
    SELECT 
      p.id,
      pt_en.tags as tags_en,
      pt_bg.tags as tags_bg
    FROM products p
    JOIN product_translations pt_en ON p.id = pt_en.product_id AND pt_en.language_code = 'en'
    JOIN product_translations pt_bg ON p.id = pt_bg.product_id AND pt_bg.language_code = 'bg'
    WHERE pt_bg.tags IS NOT NULL AND cardinality(pt_bg.tags) > 0
    LIMIT 5
  `);

    console.log('Verification Results (Top 5):');
    console.log(JSON.stringify(rows, null, 2));
    process.exit(0);
}

verify();
