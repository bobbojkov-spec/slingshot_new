import { query } from '../lib/db/index';
import { GoogleGenerativeAI } from '@google/generative-ai';

const SLEEP_MS = 500;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function translateHtmlToBulgarian(htmlContent: string, productTitle: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not found in environment');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const prompt = `
You are a professional translator for a water sports equipment e-commerce website (kitesurfing, wakeboarding, wingfoiling).
Translate the following HTML content from English to Bulgarian.

Rules:
1. Preserve all HTML tags, attributes, and structure exactly - only translate the text content
2. Keep brand names (Slingshot, Ride Engine, Phantasm, etc.) in English
3. Keep technical terms and measurements (e.g., cm, kg, m², lbs) in their standard format
4. Keep product model names in English
5. Translate "Key Features" to "Основни Характеристики"
6. Translate "Package Includes" to "Пакетът Включва"
7. Translate "Specifications" to "Спецификации"
8. Return ONLY the translated HTML string, no markdown code blocks, no extra text

Product: ${productTitle}

English HTML:
${htmlContent}
`;

  const result = await model.generateContent(prompt);
  let translatedHtml = result.response.text().trim();

  // Clean up markdown code blocks if present
  if (translatedHtml.startsWith('\\`\\`\\`')) {
    translatedHtml = translatedHtml.replace(/^\\`\\`\\`(?:html)?\\s*/i, '');
  }
  if (translatedHtml.endsWith('\\`\\`\\`')) {
    translatedHtml = translatedHtml.replace(/\\s*\\`\\`\\`$/, '');
  }

  return translatedHtml.trim();
}

async function findProductsWithEmptyBgSpecs() {
  console.log('\\n🔍 Finding products with empty Bulgarian specs...\\n');

  const { rows: products } = await query(`
    SELECT 
      p.id,
      p.title,
      p.canonical_slug,
      p.specs_html as product_specs,
      pt_en.specs_html as en_specs,
      pt_bg.specs_html as bg_specs
    FROM products p
    LEFT JOIN product_translations pt_en ON p.id = pt_en.product_id AND pt_en.language_code = 'en'
    LEFT JOIN product_translations pt_bg ON p.id = pt_bg.product_id AND pt_bg.language_code = 'bg'
    WHERE 
      -- English specs exist and are not empty
      (
        (pt_en.specs_html IS NOT NULL AND LENGTH(TRIM(pt_en.specs_html)) > 5)
        OR 
        (p.specs_html IS NOT NULL AND LENGTH(TRIM(p.specs_html)) > 5)
      )
      -- Bulgarian specs are empty or too short
      AND (
        pt_bg.specs_html IS NULL 
        OR LENGTH(TRIM(pt_bg.specs_html)) < 5
        OR pt_bg.specs_html = ''
      )
    ORDER BY p.title
  `);

  console.log(`Found ${products.length} products with English specs but missing/empty Bulgarian specs\\n`);
  return products;
}

async function fixEmptyBgSpecs() {
  try {
    const products = await findProductsWithEmptyBgSpecs();

    if (products.length === 0) {
      console.log('✅ No products need fixing!');
      return;
    }

    console.log('\\n📝 Products to fix:');
    products.forEach((p, i) => {
      const source = p.en_specs ? 'product_translations (EN)' : 'products table';
      console.log(`  ${i + 1}. ${p.title} (ID: ${p.id}) - Source: ${source}`);
    });

    console.log('\\n🚀 Starting translation process...\\n');

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      const sourceSpecs = product.en_specs || product.product_specs;

      if (!sourceSpecs || sourceSpecs.length < 5) {
        console.log(`⚠️ [${i + 1}/${products.length}] Skipping ${product.title} - no valid source specs`);
        continue;
      }

      console.log(`\\n🔄 [${i + 1}/${products.length}] Processing: ${product.title}`);
      console.log(`   Source specs length: ${sourceSpecs.length} chars`);

      try {
        // Translate the specs
        const translatedSpecs = await translateHtmlToBulgarian(sourceSpecs, product.title);
        console.log(`   Translated specs length: ${translatedSpecs.length} chars`);

        // Save to product_translations table
        await query(`
          INSERT INTO product_translations (
            product_id,
            language_code,
            specs_html,
            updated_at
          ) VALUES ($1, 'bg', $2, NOW())
          ON CONFLICT (product_id, language_code) DO UPDATE SET
            specs_html = EXCLUDED.specs_html,
            updated_at = NOW()
        `, [product.id, translatedSpecs]);

        console.log(`   ✅ Saved Bulgarian translation for ${product.title}`);
        successCount++;

        // Sleep to avoid rate limiting
        await sleep(SLEEP_MS);

      } catch (error) {
        console.error(`   ❌ Error processing ${product.title}:`, error);
        errorCount++;
      }
    }

    console.log('\\n========================================');
    console.log('📊 SUMMARY');
    console.log('========================================');
    console.log(`Total products processed: ${products.length}`);
    console.log(`Successful translations: ${successCount}`);
    console.log(`Errors: ${errorCount}`);
    console.log('========================================\\n');

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
fixEmptyBgSpecs();
