require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

function slugify(text) {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')     // Replace spaces with -
        .replace(/[^\w\-]+/g, '') // Remove all non-word chars
        .replace(/\-\-+/g, '-')   // Replace multiple - with single -
        .replace(/^-+/, '')       // Trim - from start of text
        .replace(/-+$/, '');      // Trim - from end of text
}

async function run() {
    const client = await pool.connect();
    try {
        console.log('Fetching products with missing slugs...');
        const res = await client.query("SELECT id, title, handle FROM products WHERE slug IS NULL OR slug = ''");

        console.log(`Found ${res.rows.length} products to update.`);

        for (const product of res.rows) {
            let baseSlug = slugify(product.title || product.handle || 'product');
            let uniqueSlug = baseSlug;
            let counter = 1;

            // Ensure uniqueness
            while (true) {
                const check = await client.query("SELECT id FROM products WHERE slug = $1 AND id != $2", [uniqueSlug, product.id]);
                if (check.rows.length === 0) break;
                uniqueSlug = `${baseSlug}-${counter}`;
                counter++;
            }

            await client.query("UPDATE products SET slug = $1 WHERE id = $2", [uniqueSlug, product.id]);
            console.log(`Updated: ${product.title} -> ${uniqueSlug}`);
        }

        console.log('Done!');
    } catch (e) {
        console.error(e);
    } finally {
        client.release();
        pool.end();
    }
}

run();
