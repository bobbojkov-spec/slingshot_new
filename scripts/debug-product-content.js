const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
    const slug = 'ride-engine-universe-helmet-v2';
    console.log(`Checking content for: ${slug}`);

    const res = await pool.query(`
    SELECT 
      id, 
      name, 
      name_bg, 
      description, 
      description_bg, 
      features 
    FROM products 
    WHERE slug = $1
  `, [slug]);

    if (res.rows.length) {
        const p = res.rows[0];
        console.log('--- CONTENT CHECK ---');
        console.log('ID:', p.id);
        console.log('Name (EN):', p.name);
        console.log('Name (BG):', p.name_bg || 'MISSING');
        console.log('Desc (EN):', p.description ? (p.description.substring(0, 50) + '...') : 'MISSING/NULL');
        console.log('Desc (BG):', p.description_bg ? (p.description_bg.substring(0, 50) + '...') : 'MISSING/NULL');
        console.log('Features:', p.features);
    } else {
        console.log('Product not found in DB.');
    }
    pool.end();
}
run();
