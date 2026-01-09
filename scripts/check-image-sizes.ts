import { query } from '../lib/db';
import * as dotenv from 'dotenv';
dotenv.config();

async function checkSizes() {
    try {
        const res = await query(`SELECT DISTINCT size FROM product_images_railway`);
        console.table(res.rows);
    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}
checkSizes();
