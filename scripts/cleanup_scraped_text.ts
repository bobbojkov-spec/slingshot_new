import { Pool } from 'pg';
import dotenv from 'dotenv';
import { query } from '@/lib/db';

dotenv.config({ path: '.env.local' });

async function main() {
    console.log('Cleaning up "Tax included" text from imported products...');

    const countSql = `
        SELECT COUNT(*) as count 
        FROM products 
        WHERE product_type = 'Scraped' 
        AND specs_html LIKE '%Tax included.%'
    `;

    const targetText = 'Tax included.\n<a href="/policies/shipping-policy">Shipping</a> calculated at checkout.\n';

    // Update main products table
    const updateProductsSql = `
        UPDATE products 
        SET specs_html = REPLACE(specs_html, $1, '')
        WHERE product_type = 'Scraped' 
        AND specs_html LIKE $2
    `;

    // Update translations table
    const updateTranslationsSql = `
        UPDATE product_translations 
        SET specs_html = REPLACE(specs_html, $1, '')
        WHERE product_id IN (SELECT id FROM products WHERE product_type = 'Scraped')
        AND specs_html LIKE $2
    `;

    try {
        const { rows: initial } = await query(countSql);
        console.log(`Found ${initial[0].count} products with tax text in products table.`);

        const res1 = await query(updateProductsSql, [targetText, `%${targetText}%`]);
        console.log(`Updated ${res1.rowCount} rows in products table.`);

        const res2 = await query(updateTranslationsSql, [targetText, `%${targetText}%`]);
        console.log(`Updated ${res2.rowCount} rows in product_translations table.`);

        // Also check for trimmed versions or slightly different formatting
        const targetTextTrimmed = 'Tax included.\n<a href="/policies/shipping-policy">Shipping</a> calculated at checkout.';
        await query(updateProductsSql, [targetTextTrimmed, `%${targetTextTrimmed}%`]);
        await query(updateTranslationsSql, [targetTextTrimmed, `%${targetTextTrimmed}%`]);

    } catch (error) {
        console.error('Error during cleanup:', error);
    }
}

main().catch(console.error);
