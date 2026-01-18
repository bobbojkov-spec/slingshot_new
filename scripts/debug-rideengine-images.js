const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
    const slug = 'ride-engine-universe-helmet-v2';
    const pidRes = await pool.query("SELECT id FROM products WHERE slug = $1", [slug]);
    if (!pidRes.rows.length) { console.log('Product not found'); return; }
    const pid = pidRes.rows[0].id;

    console.log(`Product: ${slug} (ID: ${pid})`);

    const res = await pool.query(`
      SELECT id, size, storage_path, bundle_id, display_order 
      FROM product_images_railway 
      WHERE product_id = $1 
      ORDER BY bundle_id, size
  `, [pid]);

    if (res.rowCount === 0) {
        console.log('No images found in product_images_railway.');
    } else {
        console.log(`Found ${res.rowCount} images.`);
        res.rows.forEach(r => {
            console.log(`Bundle:${r.bundle_id} Size:${r.size} Path:${r.storage_path}`);
        });
    }

    pool.end();
}
run();
