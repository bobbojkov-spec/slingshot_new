
require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function test() {
    try {
        console.log('Running debug query for products...');
        const { rows: productRows = [] } = await pool.query(`
      SELECT
        p.*,
        jsonb_build_object(
          'id', c.id,
          'name', c.name,
          'slug', c.slug,
          'handle', c.handle
        ) AS category_info,
        (
          SELECT jsonb_agg(jsonb_build_object('id', col.id, 'title', COALESCE(ct.title, col.title)))
          FROM collection_products cp
          JOIN collections col ON col.id = cp.collection_id
          LEFT JOIN collection_translations ct ON ct.collection_id = col.id AND ct.language_code = 'en'
          WHERE cp.product_id = p.id
        ) as collections
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      ORDER BY p.created_at DESC
      LIMIT 500
    `);

        console.log(`Found ${productRows.length} products.`);
        const productIds = productRows.map((row) => row.id).filter(Boolean);

        if (productIds.length > 0) {
            console.log('Fetching color rows...');
            const { rows: colorRows = [] } = await pool.query('SELECT id, product_id, name, image_path, display_order FROM product_colors WHERE product_id = ANY($1) ORDER BY display_order ASC', [productIds]);
            console.log(`Found ${colorRows.length} color rows.`);

            console.log('Fetching variant rows...');
            const { rows: variantRows = [] } = await pool.query('SELECT * FROM product_variants WHERE product_id = ANY($1)', [productIds]);
            console.log(`Found ${variantRows.length} variant rows.`);

            console.log('Fetching image rows...');
            const { rows: imageRows = [] } = await pool.query(
                'SELECT id, product_id, storage_path, size, display_order FROM product_images_railway WHERE product_id = ANY($1) AND size = \'thumb\' ORDER BY display_order ASC',
                [productIds]
            );
            console.log(`Found ${imageRows.length} image rows.`);
        }

        console.log('API DB Logic simulation successful!');
    } catch (err) {
        console.error('API Logic simulation FAILED:');
        console.error(err);
    }
}

test().then(() => pool.end());
