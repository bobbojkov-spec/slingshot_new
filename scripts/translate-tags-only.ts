
import 'dotenv/config';
import { query } from '../lib/db';
import OpenAI from 'openai';

const getOpenAI = () => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY is not set");
    return new OpenAI({ apiKey });
};

async function getUniqueTags() {
    // Fetch tags from English translations
    const { rows: enRows } = await query(`
    SELECT tags FROM product_translations WHERE language_code = 'en'
  `);

    // Fetch tags from raw products as fallback
    const { rows: prodRows } = await query(`
    SELECT tags FROM products
  `);

    const allTags = new Set<string>();

    const addTags = (rows: any[]) => {
        rows.forEach(row => {
            if (Array.isArray(row.tags)) {
                row.tags.forEach((t: string) => {
                    if (typeof t === 'string' && t.trim()) allTags.add(t.trim());
                });
            }
        });
    };

    addTags(enRows);
    addTags(prodRows);

    return Array.from(allTags);
}

async function translateTagsBulk(tags: string[]): Promise<Record<string, string>> {
    if (tags.length === 0) return {};

    console.log(`Translating ${tags.length} unique tags...`);

    // Split into chunks to avoid context limits
    const chunkSize = 50;
    const translations: Record<string, string> = {};

    for (let i = 0; i < tags.length; i += chunkSize) {
        const chunk = tags.slice(i, i + chunkSize);

        const prompt = `
      You are a professional translator. 
      Translate the following array of product tags from English to Bulgarian.
      Keep the meaning precise for an e-commerce context (surf/kiteboarding shop).
      Preserve brand names (like 'Slingshot', 'Ride Engine') and model names in English if they are typically used as such in Bulgaria, or transliterate them if appropriate, but usually brands stay in Latin.
      Common terms: "Kite" -> "Кайт", "Board" -> "Дъска", "Foil" -> "Фойл".
      
      Input JSON: ${JSON.stringify(chunk)}
      
      Return ONLY a JSON object mapping the English tag to the Bulgarian translation.
      Example: { "Kite": "Кайт", "Red": "Червен" }
    `;

        try {
            const completion = await getOpenAI().chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [{ role: 'user', content: prompt }],
                response_format: { type: 'json_object' },
            });

            const chunkResult = JSON.parse(completion.choices[0].message?.content || '{}');
            Object.assign(translations, chunkResult);
            console.log(`Translated batch ${i / chunkSize + 1}`);
        } catch (e) {
            console.error(`Error translating chunk ${i}:`, e);
        }
    }

    return translations;
}

async function updateProductTags(tagMap: Record<string, string>) {
    // Fetch all products with their EN tags
    const { rows: products } = await query(`
    SELECT 
      p.id,
      COALESCE(pt.tags, p.tags) as source_tags
    FROM products p
    LEFT JOIN product_translations pt ON p.id = pt.product_id AND pt.language_code = 'en'
  `);

    console.log(`Updating tags for ${products.length} products...`);

    for (const product of products) {
        const sourceTags = product.source_tags;
        if (!Array.isArray(sourceTags) || sourceTags.length === 0) continue;

        const bgTags = sourceTags
            .map((t: string) => tagMap[t.trim()] || t)
            .filter(t => t); // filter empty

        // Update BG translation
        // We assume other fields might be null if row doesn't exist, which is fine for now, 
        // or we should try to preserve if exists.

        // Check if row exists to avoid overwriting other fields with NULLs if we used a blind UPSERT with NULLs
        // Actually, safest is to UPSERT only modifying tags, but standard SQL insert...on conflict update is fine.
        // Ensure we don't erase existing title/description if we only update tags.

        await query(`
      INSERT INTO product_translations (product_id, language_code, tags, updated_at)
      VALUES ($1, 'bg', $2, NOW())
      ON CONFLICT (product_id, language_code) 
      DO UPDATE SET 
        tags = $2,
        updated_at = NOW()
    `, [product.id, bgTags]);
    }
}

async function run() {
    try {
        const uniqueTags = await getUniqueTags();
        console.log(`Found ${uniqueTags.length} unique tags.`);

        const tagMap = await translateTagsBulk(uniqueTags);
        console.log('Translations ready. Updating products...');

        await updateProductTags(tagMap);

        console.log('✅ Tag translation complete.');
        process.exit(0);
    } catch (err) {
        console.error('Script failed:', err);
        process.exit(1);
    }
}

run();
