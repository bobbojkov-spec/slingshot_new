const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function fixBrands() {
    try {
        // 1. Fix Ride Engine
        const reRes = await pool.query(`
        UPDATE products p
        SET brand = 'Ride Engine'
        WHERE (brand IS NULL OR brand = '')
        AND EXISTS (
            SELECT 1 FROM collection_products cp 
            JOIN collections c ON cp.collection_id = c.id 
            WHERE cp.product_id = p.id AND c.source = 'rideengine'
        )
    `);
        console.log(`Updated ${reRes.rowCount} Ride Engine products.`);

        // 2. Fix Slingshot
        const ssRes = await pool.query(`
        UPDATE products p
        SET brand = 'Slingshot'
        WHERE (brand IS NULL OR brand = '')
        AND EXISTS (
            SELECT 1 FROM collection_products cp 
            JOIN collections c ON cp.collection_id = c.id 
            WHERE cp.product_id = p.id AND c.source = 'slingshot'
        )
    `);
        console.log(`Updated ${ssRes.rowCount} Slingshot products.`);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        pool.end();
    }
}

fixBrands();
