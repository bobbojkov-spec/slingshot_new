import { Pool } from 'pg';
import dotenv from 'dotenv';
import { query } from '@/lib/db';

dotenv.config({ path: '.env.local' });

async function main() {
    console.log('Final Database Reconciliation: Fixing NULL brands and setting ALL inventory to 100...');

    try {
        // 1. Fix NULL brands (causes toLowerCase crash)
        const brandRes = await query(`
            UPDATE products 
            SET brand = 'Slingshot' 
            WHERE brand IS NULL
        `);
        console.log(`Updated ${brandRes.rowCount} products with NULL brands to 'Slingshot'.`);

        // 2. Set ALL inventory to 100
        const invRes = await query(`
            UPDATE product_variant_availability 
            SET stock_qty = 100, 
                is_active = true, 
                updated_at = NOW() 
            WHERE variant_id IN (SELECT id FROM product_variants)
        `);
        console.log(`Set stock_qty = 100 for ${invRes.rowCount} ALL variants in the store.`);

        // 3. Final verification
        const check = await pool.query(`
            SELECT 
                (SELECT COUNT(*) FROM products WHERE brand IS NULL) as null_brands,
                (SELECT MIN(stock_qty) FROM product_variant_availability) as min_stock
        `);
        console.log('Sanity Check:', check.rows[0]);

    } catch (error) {
        console.error('Error during final reconciliation:', error);
    }
}

main().catch(console.error);
