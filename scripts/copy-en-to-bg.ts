import { query } from '../lib/db/index';

async function copyEnglishToBulgarian() {
  console.log('🔄 Starting to copy English translations to Bulgarian...\n');

  try {
    // Step 1: Update existing Bulgarian translations with English content
    console.log('Step 1: Updating existing Bulgarian translations...');
    const updateResult = await query(`
      UPDATE product_translations pt_bg
      SET 
        title = pt_en.title,
        description_html = pt_en.description_html,
        description_html2 = pt_en.description_html2,
        specs_html = pt_en.specs_html,
        package_includes = pt_en.package_includes,
        tags = pt_en.tags,
        seo_title = pt_en.seo_title,
        seo_description = pt_en.seo_description,
        updated_at = NOW()
      FROM product_translations pt_en
      WHERE pt_bg.product_id = pt_en.product_id
        AND pt_bg.language_code = 'bg'
        AND pt_en.language_code = 'en'
        AND (
          pt_bg.title IS NULL OR pt_bg.title = '' OR
          pt_bg.description_html IS NULL OR pt_bg.description_html = ''
        )
    `);
    console.log(`✅ Updated ${updateResult.rowCount} existing Bulgarian translations\n`);

    // Step 2: Insert Bulgarian translations for products that don't have them
    console.log('Step 2: Inserting new Bulgarian translations...');
    const insertResult = await query(`
      INSERT INTO product_translations (
        product_id, 
        language_code, 
        title, 
        description_html, 
        description_html2,
        specs_html, 
        package_includes, 
        tags, 
        seo_title, 
        seo_description,
        created_at,
        updated_at
      )
      SELECT 
        pt_en.product_id,
        'bg' as language_code,
        pt_en.title,
        pt_en.description_html,
        pt_en.description_html2,
        pt_en.specs_html,
        pt_en.package_includes,
        pt_en.tags,
        pt_en.seo_title,
        pt_en.seo_description,
        NOW() as created_at,
        NOW() as updated_at
      FROM product_translations pt_en
      WHERE pt_en.language_code = 'en'
        AND NOT EXISTS (
          SELECT 1 
          FROM product_translations pt_bg 
          WHERE pt_bg.product_id = pt_en.product_id 
            AND pt_bg.language_code = 'bg'
        )
    `);
    console.log(`✅ Inserted ${insertResult.rowCount} new Bulgarian translations\n`);

    // Step 3: Show results
    console.log('Step 3: Checking results...');
    const statsResult = await query(`
      SELECT 
        COUNT(*) as total_translations,
        COUNT(CASE WHEN language_code = 'en' THEN 1 END) as english_count,
        COUNT(CASE WHEN language_code = 'bg' THEN 1 END) as bulgarian_count
      FROM product_translations
    `);
    console.table(statsResult.rows);

    // Step 4: Show sample
    console.log('\nStep 4: Sample of copied data:');
    const sampleResult = await query(`
      SELECT 
        p.title as product_name,
        pt_en.title as english_title,
        pt_bg.title as bulgarian_title,
        CASE 
          WHEN LENGTH(pt_en.description_html) > 50 
          THEN CONCAT(LEFT(pt_en.description_html, 50), '...')
          ELSE pt_en.description_html 
        END as en_desc_sample
      FROM products p
      LEFT JOIN product_translations pt_en ON p.id = pt_en.product_id AND pt_en.language_code = 'en'
      LEFT JOIN product_translations pt_bg ON p.id = pt_bg.product_id AND pt_bg.language_code = 'bg'
      LIMIT 5
    `);
    console.table(sampleResult.rows);

    console.log('\n✅ All done! English content copied to Bulgarian as placeholders.');
    console.log('👉 Next step: Use the "AI Translate to Bulgarian" button on product edit page.\n');
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the script
copyEnglishToBulgarian()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
