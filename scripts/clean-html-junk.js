/**
 * Phase 1: Clean HTML Junk from Product Descriptions
 * 
 * This script removes markdown code fences (```html and ```) from product description fields
 * while preserving all actual HTML content.
 * 
 * Run modes:
 * - preview: Shows what will be changed (safe, read-only)
 * - execute: Performs the cleanup (writes to DB)
 */

const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

const MODE = process.argv[2] || 'preview'; // 'preview' or 'execute'

async function main() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        await client.connect();
        console.log('✓ Connected to database\n');

        // Find all products with HTML code fences in description fields
        const previewQuery = `
      SELECT
        id,
        name,
        CASE
          WHEN description_bg LIKE '%\`\`\`html%' THEN 'description_bg'
          WHEN description_html LIKE '%\`\`\`html%' THEN 'description_html'
          WHEN description_html2 LIKE '%\`\`\`html%' THEN 'description_html2'
          WHEN specs_html LIKE '%\`\`\`html%' THEN 'specs_html'
        END as affected_field,
        CASE
          WHEN description_bg LIKE '%\`\`\`html%' THEN LENGTH(description_bg)
          WHEN description_html LIKE '%\`\`\`html%' THEN LENGTH(description_html)
          WHEN description_html2 LIKE '%\`\`\`html%' THEN LENGTH(description_html2)
          WHEN specs_html LIKE '%\`\`\`html%' THEN LENGTH(specs_html)
        END as field_length
      FROM products
      WHERE
        description_bg LIKE '%\`\`\`html%' OR
        description_html LIKE '%\`\`\`html%' OR
        description_html2 LIKE '%\`\`\`html%' OR
        specs_html LIKE '%\`\`\`html%'
      ORDER BY id;
    `;

        const previewResult = await client.query(previewQuery);

        if (previewResult.rows.length === 0) {
            console.log('✓ No HTML junk found! All descriptions are clean.\n');
            return;
        }

        console.log(`Found ${previewResult.rows.length} product(s) with HTML code fences:\n`);
        console.table(previewResult.rows);

        if (MODE === 'preview') {
            console.log('\n📋 PREVIEW MODE - No changes made.');
            console.log('Run with "execute" argument to clean these records:');
            console.log('  node scripts/clean-html-junk.js execute\n');
            return;
        }

        // Execute mode - actually clean the data
        console.log('\n🔧 EXECUTE MODE - Cleaning data...\n');

        let cleanedCount = 0;

        for (const field of ['description_bg', 'description_html', 'description_html2']) {
            const cleanQuery = `
        UPDATE products 
        SET ${field} = REPLACE(REPLACE(${field}, '\`\`\`html', ''), '\`\`\`', '')
        WHERE ${field} LIKE '%\`\`\`html%'
        RETURNING id, name, ${field};
      `;

            const cleanResult = await client.query(cleanQuery);

            if (cleanResult.rowCount > 0) {
                console.log(`✓ Cleaned ${cleanResult.rowCount} record(s) in ${field}`);
                cleanedCount += cleanResult.rowCount;
            }
        }

        console.log(`\n✅ Successfully cleaned ${cleanedCount} total record(s)!\n`);

        // Verify cleanup
        const verifyResult = await client.query(previewQuery);
        if (verifyResult.rows.length === 0) {
            console.log('✓ Verification passed: No HTML junk remaining.\n');
        } else {
            console.log('⚠️  Warning: Some records still have HTML junk:');
            console.table(verifyResult.rows);
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    } finally {
        await client.end();
    }
}

main();
