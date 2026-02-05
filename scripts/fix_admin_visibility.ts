import { Pool } from 'pg';
import dotenv from 'dotenv';
import { query } from '@/lib/db';

dotenv.config({ path: '.env.local' });

async function main() {
    console.log('Fixing Admin visibility and setting inventory for Ride Engine products...');

    // 1. Sync name and slug fields
    const fixVisibilitySql = `
        UPDATE products 
        SET name = title, 
            slug = handle 
        WHERE product_type = 'Scraped' 
        AND (name IS NULL OR slug IS NULL)
    `;

    // 2. Set stock to 100 for all variants of scraped products
    const fixInventorySql = `
        UPDATE product_variant_availability
        SET stock_qty = 100,
            is_active = true,
            updated_at = NOW()
        WHERE variant_id IN (
            SELECT id FROM product_variants 
            WHERE product_id IN (SELECT id FROM products WHERE product_type = 'Scraped')
        )
    `;

    try {
        const visRes = await query(fixVisibilitySql);
        console.log(`Updated name/slug for ${visRes.rowCount} products.`);

        const invRes = await query(fixInventorySql);
        console.log(`Updated inventory to 100 for ${invRes.rowCount} variants.`);

        // Final check: list one product to confirm
        const check = await query("SELECT name, slug, id FROM products WHERE product_type = 'Scraped' LIMIT 1");
        console.log('Verification check (1 product):', check.rows[0]);

    } catch (error) {
        console.error('Error during visibility/inventory fix:', error);
    }
}

main().catch(console.error);
