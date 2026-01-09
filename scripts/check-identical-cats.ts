
import 'dotenv/config';
import { query } from '../lib/db';

async function check() {
    const { rows: cats } = await query(`
    SELECT c.id, c.slug, ct_bg.name as bg_name, ct_en.name as en_name
    FROM categories c
    JOIN category_translations ct_bg ON c.id = ct_bg.category_id AND ct_bg.language_code = 'bg'
    JOIN category_translations ct_en ON c.id = ct_en.category_id AND ct_en.language_code = 'en'
    WHERE ct_bg.name = ct_en.name AND ct_bg.name != ''
  `);
    console.log(`Identical Categories: ${cats.length}`);
    if (cats.length > 0) console.log(cats[0]);

    const { rows: types } = await query(`
    SELECT pt.id, pt.slug, ptt_bg.name as bg_name, ptt_en.name as en_name
    FROM product_types pt
    JOIN product_type_translations ptt_bg ON pt.id = ptt_bg.product_type_id AND ptt_bg.language_code = 'bg'
    JOIN product_type_translations ptt_en ON pt.id = ptt_en.product_type_id AND ptt_en.language_code = 'en'
    WHERE ptt_bg.name = ptt_en.name AND ptt_bg.name != ''
  `);
    console.log(`Identical Product Types: ${types.length}`);
    if (types.length > 0) console.log(types[0]);
    process.exit(0);
}
check();
