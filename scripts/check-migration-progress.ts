
import 'dotenv/config';
import { query } from '../lib/db';

async function check() {
    const { rows } = await query(`
    SELECT storage_provider, count(*) 
    FROM product_images 
    GROUP BY storage_provider
  `);
    console.table(rows);
    process.exit(0);
}
check();
