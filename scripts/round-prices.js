require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function run() {
    console.log('Script started.');
    if (!process.env.DATABASE_URL) {
        console.error('DATABASE_URL is missing!');
        process.exit(1);
    }
    const client = await pool.connect();
    try {
        console.log('Connected to DB. Fetching variants...');
        const res = await client.query("SELECT id, price, compare_at_price FROM product_variants");

        console.log(`Found ${res.rows.length} variants.`);

        let updatedCount = 0;

        for (const v of res.rows) {
            let needsUpdate = false;
            const updates = [];
            const values = [];
            let paramIdx = 1;

            // Helper to round up to nearest 10
            const roundUp10 = (val) => {
                if (!val) return null;
                const num = parseFloat(val);
                if (isNaN(num)) return null;
                return Math.ceil(num / 10) * 10;
            };

            const newPrice = roundUp10(v.price);
            const newCompare = roundUp10(v.compare_at_price);

            // Check Price
            if (newPrice !== null && newPrice !== parseFloat(v.price)) {
                updates.push(`price = $${paramIdx++}`);
                values.push(newPrice);
                needsUpdate = true;
            }

            // Check Compare At Price
            if (newCompare !== null && newCompare !== parseFloat(v.compare_at_price)) {
                // Only update if it existed before or if we want to enforce it? 
                // User said "Round up all the prices". 
                // Usually compare_at_price might be null. roundUp10 returns null if null.
                // If it was not null but different value:
                if (newCompare !== parseFloat(v.compare_at_price)) {
                    updates.push(`compare_at_price = $${paramIdx++}`);
                    values.push(newCompare);
                    needsUpdate = true;
                }
            }

            if (needsUpdate) {
                values.push(v.id);
                await client.query(`UPDATE product_variants SET ${updates.join(', ')} WHERE id = $${paramIdx}`, values);
                console.log(`Updated ID ${v.id}: ${v.price} -> ${newPrice} | ${v.compare_at_price} -> ${newCompare}`);
                updatedCount++;
            }
        }

        console.log(`Done! Updated ${updatedCount} variants.`);
    } catch (e) {
        console.error(e);
    } finally {
        client.release();
        pool.end();
    }
}

run();
