import { query } from './db';
import { GoogleGenerativeAI } from '@google/generative-ai';


const SLEEP_MS = 400;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function buildCategoryPrompt(name: string, description: string) {
  return `
You are a professional translator for an e-commerce admin dashboard.
Translate the following category metadata from English to Bulgarian, preserving product names, measurements, and technical terms.
Return ONLY valid JSON with keys "name" and "description". Do not include markdown formatting.

English payload:
{
  "name": "${name}",
  "description": "${description}"
}
`;
}

function buildProductTypePrompt(name: string) {
  return `
You are a translation assistant.
Translate the following product type name from English to Bulgarian.
Leave brand names, model numbers, and units untouched.
Return ONLY valid JSON like {"name": "..."}. Do not include markdown formatting.

English value:
"${name}"
`;
}

function buildVariantPrompt(title: string) {
  return `
Translate the following product variant title into Bulgarian. Preserve brand names or measurements.
Return ONLY valid JSON with {"name": "..."}. Do not include markdown formatting.

English variant:
"${title}"
`;
}

function buildProductPrompt(payload: Record<string, any>) {
  return `
You are a professional translator for an e-commerce platform.
Translate the following product content from English to Bulgarian while preserving brand names, model numbers, measurements, and HTML markup.
Return ONLY a valid JSON object that mirrors the input structure. Do not include markdown formatting.

English payload:
${JSON.stringify(payload, null, 2)}
`;
}

async function runPrompt(basePrompt: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('GEMINI_API_KEY not found, skipping translation prompt.');
    return {};
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: { responseMimeType: 'application/json' }
  });

  const result = await model.generateContent(basePrompt);
  const text = result.response.text();

  try {
    return JSON.parse(text);
  } catch (e) {
    console.error('Failed to parse Gemini JSON output:', text);
    return {};
  }
}

async function translateProductMeta() {
  const { rows: products } = await query(`
    SELECT
      p.id,
      p.title,
      p.seo_title,
      p.seo_description,
      p.meta_keywords,
      p.subtitle
    FROM products p
    WHERE NOT EXISTS (
      SELECT 1 FROM product_translations pt_bg
      WHERE pt_bg.product_id = p.id AND pt_bg.language_code = 'bg'
      AND pt_bg.seo_title IS NOT NULL
    )
    LIMIT 50
  `);

  console.log(`Found ${products.length} products needing Meta translation.`);

  for (const product of products) {
    const payload = {
      title: product.title || '',
      seo_title: product.seo_title || '',
      seo_description: product.seo_description || '',
      meta_keywords: product.meta_keywords || '',
      subtitle: product.subtitle || ''
    };

    if (!payload.title && !payload.seo_title) continue;

    const prompt = `
      You are a professional translator. 
      Translate the following product SEO metadata from English to Bulgarian.
      Preserve brand names and technical terms.
      Return ONLY valid JSON with the same keys.

      English payload:
      ${JSON.stringify(payload, null, 2)}
    `;

    const translated = await runPrompt(prompt);

    await query(
      `
        INSERT INTO product_translations (
          product_id,
          language_code,
          title,
          seo_title,
          seo_description,
          meta_keywords,
          subtitle,
          updated_at
        ) VALUES ($1, 'bg', $2, $3, $4, $5, $6, NOW())
        ON CONFLICT (product_id, language_code) DO UPDATE SET
          title = COALESCE(product_translations.title, EXCLUDED.title),
          seo_title = COALESCE(product_translations.seo_title, EXCLUDED.seo_title),
          seo_description = COALESCE(product_translations.seo_description, EXCLUDED.seo_description),
          meta_keywords = COALESCE(product_translations.meta_keywords, EXCLUDED.meta_keywords),
          subtitle = COALESCE(product_translations.subtitle, EXCLUDED.subtitle),
          updated_at = NOW()
      `,
      [
        product.id,
        translated.title || payload.title,
        translated.seo_title || payload.seo_title,
        translated.seo_description || payload.seo_description,
        translated.meta_keywords || payload.meta_keywords,
        translated.subtitle || payload.subtitle
      ]
    );
    await sleep(SLEEP_MS);
  }
}

export async function runAllTranslations() {
  await translateProductMeta();
}

