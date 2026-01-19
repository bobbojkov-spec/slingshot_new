require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

async function debug() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined
    });

    const client = await pool.connect();

    try {
        const tagName = 'Предпазни Колани за Wing Foil';
        console.log(`--- Checking products with tag: "${tagName}" ---`);

        // Check original tags
        const pTags = await client.query(`
      SELECT id, name, tags FROM products WHERE $1 = ANY(tags)
    `, [tagName]);
        console.log('Products with tag in original table:', pTags.rows.length);
        if (pTags.rows.length > 0) console.table(pTags.rows);

        // Check translated tags
        const ptTags = await client.query(`
      SELECT p.id, p.name as en_name, pt.title as bg_title, pt.tags as bg_tags
      FROM products p
      JOIN product_translations pt ON p.id = pt.product_id
      WHERE pt.language_code = 'bg' AND $1 = ANY(pt.tags)
    `, [tagName]);
        console.log('Products with tag in translations table:', ptTags.rows.length);
        if (ptTags.rows.length > 0) console.table(ptTags.rows);

    } catch (err) {
        console.error('Debug failed:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

debug();
