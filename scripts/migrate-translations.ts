import { query } from '../lib/db/index.js';

async function run() {
  try {
    // 1. Categories EN
    console.log('1. Migrating Categories to English...');
    const r1 = await query(`
      INSERT INTO category_translations (category_id, language_code, name, slug, description, created_at, updated_at)
      SELECT c.id, 'en', c.name, c.slug, c.description, NOW(), NOW()
      FROM categories c
      WHERE c.name IS NOT NULL
      ON CONFLICT (category_id, language_code) DO UPDATE SET
        name = EXCLUDED.name, slug = EXCLUDED.slug, description = EXCLUDED.description, updated_at = NOW()
      RETURNING category_id
    `);
    console.log(`  ✅ Inserted ${r1.rows.length} category EN translations`);

    // 2. Product Types EN
    console.log('2. Migrating Product Types to English...');
    const r2 = await query(`
      INSERT INTO product_type_translations (product_type_id, language_code, name, slug, created_at, updated_at)
      SELECT pt.id, 'en', pt.name, COALESCE(pt.slug, LOWER(REPLACE(pt.name, ' ', '-'))), NOW(), NOW()
      FROM product_types pt
      WHERE pt.name IS NOT NULL
      ON CONFLICT (product_type_id, language_code) DO UPDATE SET
        name = EXCLUDED.name, slug = EXCLUDED.slug, updated_at = NOW()
      RETURNING product_type_id
    `);
    console.log(`  ✅ Inserted ${r2.rows.length} product type EN translations`);

    // 3. Variants EN
    console.log('3. Migrating Variants to English...');
    const r3 = await query(`
      INSERT INTO product_variant_translations (variant_id, language_code, title, created_at, updated_at)
      SELECT pv.id, 'en', pv.title, NOW(), NOW()
      FROM product_variants pv
      WHERE pv.title IS NOT NULL
      ON CONFLICT (variant_id, language_code) DO UPDATE SET
        title = EXCLUDED.title, updated_at = NOW()
      RETURNING variant_id
    `);
    console.log(`  ✅ Inserted ${r3.rows.length} variant EN translations`);

    // 4. Copy EN to BG for Categories
    console.log('4. Copying Categories EN to BG...');
    const r4 = await query(`
      INSERT INTO category_translations (category_id, language_code, name, slug, description, created_at, updated_at)
      SELECT category_id, 'bg', name, slug, description, NOW(), NOW()
      FROM category_translations WHERE language_code = 'en'
      ON CONFLICT (category_id, language_code) DO UPDATE SET
        name = EXCLUDED.name, slug = EXCLUDED.slug, description = EXCLUDED.description, updated_at = NOW()
      RETURNING category_id
    `);
    console.log(`  ✅ Copied ${r4.rows.length} category BG translations`);

    // 5. Copy EN to BG for Product Types
    console.log('5. Copying Product Types EN to BG...');
    const r5 = await query(`
      INSERT INTO product_type_translations (product_type_id, language_code, name, slug, created_at, updated_at)
      SELECT product_type_id, 'bg', name, slug, NOW(), NOW()
      FROM product_type_translations WHERE language_code = 'en'
      ON CONFLICT (product_type_id, language_code) DO UPDATE SET
        name = EXCLUDED.name, slug = EXCLUDED.slug, updated_at = NOW()
      RETURNING product_type_id
    `);
    console.log(`  ✅ Copied ${r5.rows.length} product type BG translations`);

    // 6. Copy EN to BG for Variants
    console.log('6. Copying Variants EN to BG...');
    const r6 = await query(`
      INSERT INTO product_variant_translations (variant_id, language_code, title, created_at, updated_at)
      SELECT variant_id, 'bg', title, NOW(), NOW()
      FROM product_variant_translations WHERE language_code = 'en'
      ON CONFLICT (variant_id, language_code) DO UPDATE SET
        title = EXCLUDED.title, updated_at = NOW()
      RETURNING variant_id
    `);
    console.log(`  ✅ Copied ${r6.rows.length} variant BG translations`);

    console.log('\n✅ All translations migrated and copied!');
  } catch (err) {
    console.error('Error:', err.message);
  }
  process.exit(0);
}

run();

