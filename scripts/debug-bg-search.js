require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

async function debug() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined
    });

    const client = await pool.connect();

    try {
        console.log('--- Checking Bulgarian Product Translations ---');
        const products = await client.query(`
      SELECT p.id, p.name as en_name, pt.title as bg_title, pt.tags as bg_tags
      FROM products p
      LEFT JOIN product_translations pt ON p.id = pt.product_id AND pt.language_code = 'bg'
      LIMIT 10
    `);
        console.table(products.rows);

        console.log('\n--- Checking for products with "Уинг" or "Wing" in BG title ---');
        const wingBg = await client.query(`
      SELECT p.id, p.name as en_name, pt.title as bg_title
      FROM products p
      JOIN product_translations pt ON p.id = pt.product_id AND pt.language_code = 'bg'
      WHERE pt.title ILIKE '%Уинг%' OR pt.title ILIKE '%Wing%'
      LIMIT 10
    `);
        console.table(wingBg.rows);

        console.log('\n--- Checking for tags containing "Уинг" or "Wing" in BG ---');
        const tagsBg = await client.query(`
      SELECT DISTINCT t.tag
      FROM product_translations pt,
      LATERAL unnest(pt.tags) as t(tag)
      WHERE pt.language_code = 'bg' AND (t.tag ILIKE '%Уинг%' OR t.tag ILIKE '%Wing%')
      LIMIT 10
    `);
        console.table(tagsBg.rows);

    } catch (err) {
        console.error('Debug failed:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

debug();
