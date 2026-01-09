import { query } from '../lib/db';
import * as dotenv from 'dotenv';
dotenv.config();

async function checkSchema() {
    console.log('🔍 Starting Schema Analysis...');

    try {
        // 1. Check Products Table Columns
        console.log('\n--- Products Table Columns ---');
        const productsCols = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'products'
      ORDER BY column_name;
    `);
        console.table(productsCols.rows);

        // 2. Check Product Translations Table Columns
        console.log('\n--- Product Translations Table Columns ---');
        const translationCols = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'product_translations'
      ORDER BY column_name;
    `);
        console.table(translationCols.rows);

        // 3. Fetch One Raw Product
        console.log('\n--- Sample Product Data (Raw) ---');
        const product = await query(`SELECT * FROM products LIMIT 1`);
        if (product.rows.length > 0) {
            console.log(product.rows[0]);
        } else {
            console.log('⚠️ No products found in DB!');
        }

        // 4. Fetch One Raw Translation
        console.log('\n--- Sample Translation Data (Raw) ---');
        const translation = await query(`SELECT * FROM product_translations LIMIT 1`);
        if (translation.rows.length > 0) {
            console.log(translation.rows[0]);
        } else {
            console.log('⚠️ No product translations found in DB!');
        }

        // 5. Check Product Images
        console.log('\n--- Product Images (Railway) ---');
        const imageCols = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'product_images_railway'
      ORDER BY column_name;
    `);
        console.table(imageCols.rows);

        const imageSample = await query(`SELECT * FROM product_images_railway LIMIT 1`);
        if (imageSample.rows.length > 0) {
            console.log('Sample Image:', imageSample.rows[0]);
        } else {
            console.log('⚠️ No railway product images found!');
        }

    } catch (err) {
        console.error('❌ Error analyzing schema:', err);
    } finally {
        process.exit(0);
    }
}

checkSchema();
