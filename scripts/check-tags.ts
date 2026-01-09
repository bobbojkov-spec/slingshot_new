import { query } from '../lib/db';
import * as dotenv from 'dotenv';
dotenv.config();

async function checkTags() {
    try {
        const res = await query(`
      SELECT DISTINCT unnest(tags) as tag 
      FROM products 
      ORDER BY tag
    `);
        console.log('--- ALL TAGS IN DB ---');
        console.table(res.rows);
    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}
checkTags();
