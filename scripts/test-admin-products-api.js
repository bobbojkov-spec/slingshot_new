const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('railway') || process.env.DATABASE_URL?.includes('rlwy.net')
        ? { rejectUnauthorized: false }
        : undefined,
});

async function test() {
    const client = await pool.connect();
    try {
        console.log('1. Testing products query...');
        const productResult = await client.query(`
      SELECT
        p.*,
        jsonb_build_object(
          'id', c.id,
          'name', c.name,
          'slug', c.slug,
          'handle', c.handle
        ) AS category_info
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      ORDER BY p.created_at DESC
      LIMIT 10
    `);
        console.log(`✅ Products query successful. Count: ${productResult.rows.length}`);

        const productIds = productResult.rows.map(row => row.id).filter(Boolean);
        if (productIds.length === 0) {
            console.log('No products found, skipping sub-queries.');
            return;
        }

        console.log('2. Testing product_images_railway query...');
        const imageResult = await client.query(
            `
        SELECT id, product_id, storage_path, size, display_order
        FROM product_images_railway
        WHERE product_id = ANY($1) AND size = 'thumb'
        ORDER BY display_order ASC
      `,
            [productIds]
        );
        console.log(`✅ Image query successful. Count: ${imageResult.rows.length}`);

        console.log('3. Testing product_variants query...');
        const variantResult = await client.query('SELECT * FROM product_variants WHERE product_id = ANY($1)', [productIds]);
        console.log(`✅ Variant query successful. Count: ${variantResult.rows.length}`);

        console.log('4. Testing product_colors query...');
        const colorResult = await client.query('SELECT id, product_id, name_en AS name, hex_color, position FROM product_colors WHERE product_id = ANY($1) ORDER BY position ASC', [productIds]);
        console.log(`✅ Color query successful. Count: ${colorResult.rows.length}`);

        console.log('\nAll queries passed!');
    } catch (err) {
        console.error('\n❌ Query failed:', err.message);
        if (err.stack) console.error(err.stack);
    } finally {
        client.release();
        await pool.end();
    }
}

test();
