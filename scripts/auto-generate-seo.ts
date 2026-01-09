import { query } from '../lib/db/index';

type SeoPayload = {
  seo_title: string;
  seo_description: string;
  meta_keywords: string;
  og_title: string;
  og_description: string;
};

const FALLBACK_DESCRIPTION = 'Discover premium gear and accessories available now.';

function stripHtml(text?: string): string {
  if (!text) return '';
  return text
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function generateKeywords(title: string, description: string): string {
  const text = `${title} ${description}`.toLowerCase();
  const words = text.match(/\b[a-z]{4,}\b/g) || [];
  const frequency: Record<string, number> = {};
  words.forEach((word) => {
    frequency[word] = (frequency[word] || 0) + 1;
  });

  return Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word)
    .join(', ');
}

function buildSeoPayload(rawTitle?: string, rawDescription?: string): SeoPayload {
  const title = (rawTitle || '').trim();
  const plainDescription = stripHtml(rawDescription);
  const descriptionSource = plainDescription || FALLBACK_DESCRIPTION;
  const seoTitle = title ? `${title} - Buy Online` : 'Buy premium gear online';
  return {
    seo_title: seoTitle,
    seo_description: descriptionSource.slice(0, 160),
    meta_keywords: generateKeywords(title, descriptionSource),
    og_title: title || 'Premium gear from Slingshot',
    og_description: descriptionSource.slice(0, 200),
  };
}

async function fillProductSeo() {
  console.log('🔍 Looking for products missing SEO metadata...');
  const { rows } = await query(`
    SELECT id, title, description_html, description_html2, seo_title, seo_description
    FROM products
    WHERE (seo_title IS NULL OR seo_title = '')
      OR (seo_description IS NULL OR seo_description = '')
  `);

  if (rows.length === 0) {
    console.log('✅ All products already have SEO metadata.');
    return;
  }

  console.log(`✏️  Generating SEO for ${rows.length} products...`);
  for (const product of rows) {
    const descriptionSource =
      product.description_html || product.description_html2 || '';
    const seo = buildSeoPayload(product.title, descriptionSource);
    await query(
      `
        UPDATE products
        SET
          seo_title = $1,
          seo_description = $2,
          updated_at = NOW()
        WHERE id = $3
      `,
      [seo.seo_title, seo.seo_description, product.id]
    );
  }
}

async function fillTranslationSeo() {
  console.log('🔍 Looking for English translations missing SEO metadata...');
  const { rows } = await query(`
    SELECT
      pt.id,
      pt.product_id,
      pt.language_code,
      COALESCE(pt.title, p.title) AS title,
      COALESCE(pt.description_html, pt.description_html2, p.description_html, '') AS description
    FROM product_translations pt
    JOIN products p ON p.id = pt.product_id
    WHERE pt.language_code = 'en'
      AND (
        pt.seo_title IS NULL OR pt.seo_title = '' OR
        pt.seo_description IS NULL OR pt.seo_description = '' OR
        pt.meta_keywords IS NULL OR pt.meta_keywords = '' OR
        pt.og_title IS NULL OR pt.og_title = '' OR
        pt.og_description IS NULL OR pt.og_description = ''
      )
  `);

  if (rows.length === 0) {
    console.log('✅ All English product translations already have SEO metadata.');
    return;
  }

  console.log(`✏️  Generating SEO for ${rows.length} English translations...`);
  for (const translation of rows) {
    const seo = buildSeoPayload(translation.title, translation.description);
    await query(
      `
        UPDATE product_translations
        SET
          seo_title = $1,
          seo_description = $2,
          meta_keywords = $3,
          og_title = $4,
          og_description = $5,
          updated_at = NOW()
        WHERE id = $6
      `,
      [
        seo.seo_title,
        seo.seo_description,
        seo.meta_keywords,
        seo.og_title,
        seo.og_description,
        translation.id,
      ]
    );
  }
}

async function main() {
  try {
    console.log('🚀 Starting automatic SEO generation...');
    await fillProductSeo();
    await fillTranslationSeo();
    console.log('🎉 SEO generation complete.');
    process.exit(0);
  } catch (error) {
    console.error('❌ SEO generation failed', error);
    process.exit(1);
  }
}

main();

