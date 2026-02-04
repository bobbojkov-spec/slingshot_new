#!/usr/bin/env node
/**
 * Script to clean up markdown code blocks from specs_html fields
 * Removes ```html and ``` markers that were incorrectly imported
 */

const { query } = require('../lib/db');

async function cleanupSpecsHtml() {
    console.log('Starting specs_html cleanup...\n');

    try {
        // Find all products with specs_html containing markdown code blocks
        const { rows: products } = await query(`
      SELECT id, name, specs_html, description_html, description_html2
      FROM products
      WHERE specs_html LIKE '%\`\`\`html%'
         OR specs_html LIKE '%\`\`\`%'
         OR description_html LIKE '%\`\`\`html%'
         OR description_html LIKE '%\`\`\`%'
         OR description_html2 LIKE '%\`\`\`html%'
         OR description_html2 LIKE '%\`\`\`%'
    `);

        console.log(`Found ${products.length} products with markdown code blocks\n`);

        let updatedCount = 0;

        for (const product of products) {
            const updates = [];
            const values = [];
            let paramIdx = 1;

            // Clean specs_html
            if (product.specs_html && (product.specs_html.includes('```html') || product.specs_html.includes('```'))) {
                const cleaned = product.specs_html
                    .replace(/```html\s*/gi, '')
                    .replace(/```\s*$/gm, '')
                    .replace(/```\s*\n/g, '')
                    .trim();

                if (cleaned !== product.specs_html) {
                    updates.push(`specs_html = $${paramIdx++}`);
                    values.push(cleaned);
                    console.log(`  [${product.name}] Cleaned specs_html`);
                }
            }

            // Clean description_html
            if (product.description_html && (product.description_html.includes('```html') || product.description_html.includes('```'))) {
                const cleaned = product.description_html
                    .replace(/```html\s*/gi, '')
                    .replace(/```\s*$/gm, '')
                    .replace(/```\s*\n/g, '')
                    .trim();

                if (cleaned !== product.description_html) {
                    updates.push(`description_html = $${paramIdx++}`);
                    values.push(cleaned);
                    console.log(`  [${product.name}] Cleaned description_html`);
                }
            }

            // Clean description_html2
            if (product.description_html2 && (product.description_html2.includes('```html') || product.description_html2.includes('```'))) {
                const cleaned = product.description_html2
                    .replace(/```html\s*/gi, '')
                    .replace(/```\s*$/gm, '')
                    .replace(/```\s*\n/g, '')
                    .trim();

                if (cleaned !== product.description_html2) {
                    updates.push(`description_html2 = $${paramIdx++}`);
                    values.push(cleaned);
                    console.log(`  [${product.name}] Cleaned description_html2`);
                }
            }

            // Update if there are changes
            if (updates.length > 0) {
                values.push(product.id);
                await query(`
          UPDATE products
          SET ${updates.join(', ')}, updated_at = NOW()
          WHERE id = $${paramIdx}
        `, values);
                updatedCount++;
            }
        }

        console.log(`\n✓ Cleanup complete. Updated ${updatedCount} products.`);

    } catch (error) {
        console.error('Cleanup failed:', error);
        process.exit(1);
    }

    process.exit(0);
}

cleanupSpecsHtml();
