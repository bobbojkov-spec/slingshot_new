import { query } from '../lib/db/index.js';

async function run() {
  try {
    await query(`
      INSERT INTO product_type_translations (
        product_type_id,
        language_code,
        name,
        slug,
        description,
        created_at,
        updated_at
      )
      SELECT
        pt.id,
        'bg',
        pt.name,
        COALESCE(pt.slug, LOWER(REPLACE(pt.name, ' ', '-'))),
        pt.description,
        NOW(),
        NOW()
      FROM product_types pt
      ON CONFLICT (product_type_id, language_code) DO UPDATE SET
        name = EXCLUDED.name,
        slug = EXCLUDED.slug,
        description = EXCLUDED.description,
        updated_at = NOW()
    `);

    const stats = await query(`
      SELECT
        COUNT(*) AS total,
        COUNT(CASE WHEN language_code = 'bg' THEN 1 END) AS bg_count
      FROM product_type_translations;
    `);

    console.table(stats.rows);
  } catch (error) {
    console.error('Migration failed', error);
  } finally {
    process.exit(0);
  }
}
run();
