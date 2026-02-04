/**
 * Sample Product Data Inspector
 * 
 * Quick script to check what's actually in the product descriptions
 * to understand the HTML junk issue the user reported.
 */

const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function main() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        await client.connect();
        console.log('✓ Connected to database\n');

        // Get the "Coalition" product mentioned by user
        const query = `
      SELECT 
        id,
        name,
        slug,
        description,
        description_bg,
        description_html,
        SUBSTRING(description_bg, 1, 500) as description_bg_preview
      FROM products 
      WHERE slug = 'coalition'
      LIMIT 1;
    `;

        const result = await client.query(query);

        if (result.rows.length === 0) {
            console.log('Product "coalition" not found\n');
            return;
        }

        const product = result.rows[0];

        console.log('=== PRODUCT DATA ===');
        console.log('ID:', product.id);
        console.log('Name:', product.name);
        console.log('Slug:', product.slug);
        console.log('\n--- description (plain) ---');
        console.log(product.description?.substring(0, 200));
        console.log('\n--- description_bg (Bulgarian) ---');
        console.log(product.description_bg?.substring(0, 500));
        console.log('\n--- description_html (HTML) ---');
        console.log(product.description_html?.substring(0, 500));

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    } finally {
        await client.end();
    }
}

main();
