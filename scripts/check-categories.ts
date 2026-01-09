import { query } from '../lib/db';
import * as dotenv from 'dotenv';
dotenv.config();

async function checkCategories() {
    try {
        const res = await query(`SELECT slug, name from categories`);
        console.table(res.rows);
    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}
checkCategories();
