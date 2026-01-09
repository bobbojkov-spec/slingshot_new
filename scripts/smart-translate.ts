
import 'dotenv/config';
import OpenAI from 'openai';
import { query } from '../lib/db';

const getOpenAI = () => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY is not set");
    return new OpenAI({ apiKey });
};

const IGNORED_BRANDS = [
    'Slingshot', 'Ride Engine', 'Phantasm', 'Moonwalker', 'Code', 'Hover Glide', 'Dwarf Craft', 'SlingWing', 'UFO', 'RPM', 'Machine', 'Ghost'
];

function buildSmartPrompt(payload: any, type: string) {
    return `
You are a professional translator for a kitesurfing/watersports e-commerce site.
Translate the following ${type} content from English to Bulgarian.

CRITICAL RULES:
1. PRESERVE BRAND NAMES EXACTLY in English: ${IGNORED_BRANDS.join(', ')}.
2. PRESERVE technical model names (e.g. "V1", "V2", "LXS", "GLIDE").
3. TRANSLATE descriptive text ("Kite", "Board", "Foil", "Wing" -> "Кайт", "Дъска", "Фойл", "Крило").
4. KEEP HTML tags exact.
5. IF the text is just a Brand Name (e.g. "Slingshot"), RETURN IT AS IS (English).
6. Smart Translation: If a sentence is already in Bulgarian, keep it. If it's mixed, fix it.

Content to translate:
${JSON.stringify(payload, null, 2)}

Return strictly valid JSON with the translated fields.
`;
}

async function runPrompt(prompt: string) {
    const completion = await getOpenAI().chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
    });
    return JSON.parse(completion.choices[0].message?.content || '{}');
}

async function translateProducts() {
    console.log('Finding untranslated products...');
    // Find products where descriptions are identical (indicating copy-paste)
    // Or where title is identical AND length > 15 (short titles might be brands)
    const { rows } = await query(`
    SELECT 
      p.id,
      pt_bg.title as bg_title,
      pt_bg.description_html as bg_desc,
      pt_en.title as en_title,
      pt_en.description_html as en_desc,
      json_build_object(
        'title', pt_bg.title,
        'description_html', pt_bg.description_html,
        'specs_html', pt_bg.specs_html,
        'package_includes', pt_bg.package_includes,
        'seo_title', pt_bg.seo_title,
        'seo_description', pt_bg.seo_description
      ) as payload
    FROM products p
    JOIN product_translations pt_bg ON p.id = pt_bg.product_id AND pt_bg.language_code = 'bg'
    JOIN product_translations pt_en ON p.id = pt_en.product_id AND pt_en.language_code = 'en'
    WHERE 
      (pt_bg.description_html = pt_en.description_html AND length(pt_en.description_html) > 10)
      OR 
      (pt_bg.title = pt_en.title AND length(pt_en.title) > 20) -- Skip short titles (likely brands)
  `);

    console.log(`Found ${rows.length} candidates.`);

    const BATCH_SIZE = 5;
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        const batch = rows.slice(i, i + BATCH_SIZE);
        console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(rows.length / BATCH_SIZE)}...`);

        await Promise.all(batch.map(async (row) => {
            console.log(`Translating Product: ${row.en_title.substring(0, 30)}...`);
            try {
                const translated = await runPrompt(buildSmartPrompt(row.payload, 'product'));

                await query(`
                 UPDATE product_translations
                 SET 
                   title = COALESCE($1, title),
                   description_html = COALESCE($2, description_html),
                   specs_html = COALESCE($3, specs_html),
                   package_includes = COALESCE($4, package_includes),
                   seo_title = COALESCE($5, seo_title),
                   seo_description = COALESCE($6, seo_description),
                   updated_at = NOW()
                 WHERE product_id = $7 AND language_code = 'bg'
            `, [
                    translated.title,
                    translated.description_html,
                    translated.specs_html,
                    translated.package_includes,
                    translated.seo_title,
                    translated.seo_description,
                    row.id
                ]);
            } catch (e) {
                console.error(`Failed to translate product ${row.id}`, e);
            }
        }));
    }
}

async function main() {
    await translateProducts();
    console.log('Done.');
    process.exit(0);
}

main();
