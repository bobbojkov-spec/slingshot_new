import { query } from './db';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SLEEP_MS = 400;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function buildCategoryPrompt(name: string, description: string) {
  return `
You are a professional translator for an e-commerce admin dashboard.
Translate the following category metadata from English to Bulgarian, preserving product names, measurements, and technical terms.
Return JSON with keys "name" and "description".

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
Return JSON like {"name": "..."}.

English value:
"${name}"
`;
}

function buildVariantPrompt(title: string) {
  return `
Translate the following product variant title into Bulgarian. Preserve brand names or measurements.
Return JSON with {"name": "..."}.

English variant:
"${title}"
`;
}

function buildProductPrompt(payload: Record<string, any>) {
  return `
You are a professional translator for an e-commerce platform.
Translate the following product content from English to Bulgarian while preserving brand names, model numbers, measurements, and HTML markup.
Return a JSON object that mirrors the input structure.

English payload:
${JSON.stringify(payload, null, 2)}
`;
}

async function runPrompt(basePrompt: string) {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: basePrompt }],
    response_format: { type: 'json_object' },
  });
  return JSON.parse(completion.choices[0].message?.content || '{}');
}

async function translateCategories() {
  const { rows: categories } = await query(`
    SELECT
      c.id,
      c.slug,
      ct.name AS name_en,
      ct.description AS description_en
    FROM categories c
    LEFT JOIN category_translations ct ON c.id = ct.category_id AND ct.language_code = 'en'
    WHERE NOT EXISTS (
      SELECT 1 FROM category_translations ct_bg 
      WHERE ct_bg.category_id = c.id AND ct_bg.language_code = 'bg'
    )
  `);

  for (const category of categories) {
    const prompt = buildCategoryPrompt(category.name_en || '', category.description_en || '');
    const translated = await runPrompt(prompt);
    const finalName = translated.name || category.name_en || '';
    const finalDescription = translated.description || category.description_en || '';
    const finalSlug =
      category.slug ||
      finalName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    await query(
      `
        INSERT INTO category_translations (
          category_id,
          language_code,
          name,
          slug,
          description,
          updated_at
        ) VALUES ($1, 'bg', $2, $3, $4, NOW())
        ON CONFLICT (category_id, language_code) DO UPDATE SET
          name = EXCLUDED.name,
          slug = EXCLUDED.slug,
          description = EXCLUDED.description,
          updated_at = NOW()
      `,
      [category.id, finalName, finalSlug, finalDescription]
    );
    await sleep(SLEEP_MS);
  }
}

async function translateProductTypes() {
  const { rows: productTypes } = await query(`
    SELECT
      pt.id,
      pt.slug,
      ptt.name AS name_en
    FROM product_types pt
    LEFT JOIN product_type_translations ptt ON pt.id = ptt.product_type_id AND ptt.language_code = 'en'
    WHERE NOT EXISTS (
      SELECT 1 FROM product_type_translations ptt_bg
      WHERE ptt_bg.product_type_id = pt.id AND ptt_bg.language_code = 'bg'
    )
  `);

  for (const type of productTypes) {
    const prompt = buildProductTypePrompt(type.name_en || '');
    const translated = await runPrompt(prompt);
    const finalName = translated.name || type.name_en || '';
    const finalSlug =
      type.slug ||
      finalName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    await query(
      `
        INSERT INTO product_type_translations (
          product_type_id,
          language_code,
          name,
          slug,
          updated_at
        ) VALUES ($1, 'bg', $2, $3, NOW())
        ON CONFLICT (product_type_id, language_code) DO UPDATE SET
          name = EXCLUDED.name,
          slug = EXCLUDED.slug,
          updated_at = NOW()
      `,
      [type.id, finalName, finalSlug]
    );
    await sleep(SLEEP_MS);
  }
}

async function translateVariants() {
  const { rows: variants } = await query(`
    SELECT
      pv.id,
      pvt.title AS title_en
    FROM product_variants pv
    LEFT JOIN product_variant_translations pvt ON pv.id = pvt.variant_id AND pvt.language_code = 'en'
    WHERE NOT EXISTS (
      SELECT 1 FROM product_variant_translations pvt_bg
      WHERE pvt_bg.variant_id = pv.id AND pvt_bg.language_code = 'bg'
    )
  `);

  for (const variant of variants) {
    const english = variant.title_en || '';
    if (!english) continue;
    const prompt = buildVariantPrompt(english);
    const translated = await runPrompt(prompt);
    const finalName = translated.name || english;
    await query(
      `
        INSERT INTO product_variant_translations (
          variant_id,
          language_code,
          title,
          updated_at
        ) VALUES ($1, 'bg', $2, NOW())
        ON CONFLICT (variant_id, language_code) DO UPDATE SET
          title = EXCLUDED.title,
          updated_at = NOW()
      `,
      [variant.id, finalName]
    );
    await sleep(200);
  }
}

async function translateProducts() {
  const { rows: products } = await query(`
    SELECT
      p.id,
      json_build_object(
        'title', pt.title,
        'description_html', pt.description_html,
        'description_html2', pt.description_html2,
        'specs_html', pt.specs_html,
        'package_includes', pt.package_includes,
        'tags', pt.tags,
        'seo_title', pt.seo_title,
        'seo_description', pt.seo_description
      ) AS translation_en
    FROM products p
    LEFT JOIN product_translations pt ON p.id = pt.product_id AND pt.language_code = 'en'
    WHERE NOT EXISTS (
      SELECT 1 FROM product_translations pt_bg
      WHERE pt_bg.product_id = p.id AND pt_bg.language_code = 'bg'
    )
  `);

  for (const product of products) {
    const translation = product.translation_en || {};
    const prompt = buildProductPrompt(translation);
    const translated = await runPrompt(prompt);
    await query(
      `
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
          updated_at
        ) VALUES ($1, 'bg', $2, $3, $4, $5, $6, $7, $8, $9, NOW())
        ON CONFLICT (product_id, language_code) DO UPDATE SET
          title = EXCLUDED.title,
          description_html = EXCLUDED.description_html,
          description_html2 = EXCLUDED.description_html2,
          specs_html = EXCLUDED.specs_html,
          package_includes = EXCLUDED.package_includes,
          tags = EXCLUDED.tags,
          seo_title = EXCLUDED.seo_title,
          seo_description = EXCLUDED.seo_description,
          updated_at = NOW()
      `,
      [
        product.id,
        translated.title ?? translation.title ?? null,
        translated.description_html ?? translation.description_html ?? null,
        translated.description_html2 ?? translation.description_html2 ?? null,
        translated.specs_html ?? translation.specs_html ?? null,
        translated.package_includes ?? translation.package_includes ?? null,
        translated.tags ?? translation.tags ?? null,
        translated.seo_title ?? translation.seo_title ?? null,
        translated.seo_description ?? translation.seo_description ?? null,
      ]
    );
    await sleep(SLEEP_MS);
  }
}

export async function runAllTranslations() {
  await translateCategories();
  await translateProductTypes();
  await translateVariants();
  await translateProducts();
}

