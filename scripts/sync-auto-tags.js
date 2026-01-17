
require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function run() {
    try {
        // Fetch all products with their current details
        const productsRes = await pool.query('SELECT id, product_type, title FROM products');
        const products = productsRes.rows;

        console.log(`Found ${products.length} products. Starting tag sync...`);

        for (const product of products) {
            // 1. Get Product Type
            const typeTag = product.product_type;

            // 2. Get Collections for this product
            const collectionsRes = await pool.query(`
        SELECT c.title 
        FROM collections c
        JOIN collection_products cp ON c.id = cp.collection_id
        WHERE cp.product_id = $1
      `, [product.id]);

            const collectionTags = collectionsRes.rows.map(r => r.title);

            // 3. Combine Tags (Unique)
            // Filter out null/undefined/empty strings
            const newTags = [...new Set([typeTag, ...collectionTags])]
                .filter(t => t && t.trim().length > 0);

            if (newTags.length === 0) continue;

            // 4. Update Product Tags
            // We overwrite existing tags or append? 
            // User said: "Every product should have the tag name... So basically if I put... I put the tag accessories..."
            // Implies this system manages the tags. Let's overwrite to keep it consistent with the "System" definition.
            // If user manually added other tags, they might be lost if we don't fetch them first.
            // But "System to make a script adding tags" usually implies authority.
            // Let's fetch current tags to be safe, but prioritize the generated ones.
            // Actually, for "Auto-Tagging System", usually we want it to be deterministic.
            // Let's just set it to these derived tags for now as requested.

            // PostgreSQL array format: {tag1,tag2}
            // Or we can just pass array to node-postgres and it handles it? 
            // Yes, node-postgres handles array if column is array type.

            await pool.query(`
        UPDATE products 
        SET tags = $1,
            updated_at = NOW()
        WHERE id = $2
      `, [newTags, product.id]);

            console.log(`Updated Product: "${product.title}" with Tags: [${newTags.join(', ')}]`);
        }

        console.log('Auto-tagging complete.');

    } catch (e) {
        console.error('Error running auto-tagging:', e);
    } finally {
        pool.end();
    }
}

run();
