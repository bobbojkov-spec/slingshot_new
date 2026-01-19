
const { Pool } = require('pg');
const OpenAI = require('openai');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const IGNORED_BRANDS = [
    'Slingshot', 'Ride Engine', 'Phantasm', 'Moonwalker', 'Code', 'Hover Glide', 'Dwarf Craft', 'SlingWing', 'UFO', 'RPM', 'Machine', 'Ghost'
];

function buildSmartPrompt(payload, type) {
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

async function runPrompt(prompt) {
    const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
    });
    return JSON.parse(completion.choices[0].message.content || '{}');
}

async function translateProducts() {
    const client = await pool.connect();
    try {
        console.log('Finding untranslated products where BG description equals English...');

        // Find products where description_bg is identical to description (EN)
        // OR where title_bg is identical to title (EN) and long enough
        const { rows } = await client.query(`
            SELECT 
                p.id,
                pt_bg.title as bg_title,
                pt_bg.description_html as bg_desc,
                pt_en.title as en_title,
                pt_en.description_html as en_desc,
                pt_en.specs_html as en_specs,
                pt_en.package_includes as en_package
            FROM products p
            JOIN product_translations pt_bg ON p.id = pt_bg.product_id AND pt_bg.language_code = 'bg'
            JOIN product_translations pt_en ON p.id = pt_en.product_id AND pt_en.language_code = 'en'
            WHERE 
                (pt_bg.description_html = pt_en.description_html AND length(pt_en.description_html) > 10)
                OR 
                (pt_bg.title = pt_en.title AND length(pt_en.title) > 20)
        `);

        console.log(`Found ${rows.length} candidates for translation.`);

        if (rows.length === 0) {
            console.log('No duplicate descriptions found.');
            return;
        }

        for (const row of rows) {
            console.log(`Translating Product: ${row.en_title}...`);
            const payload = {
                title: row.en_title,
                description_html: row.en_desc,
                specs_html: row.en_specs,
                package_includes: row.en_package
            };

            try {
                const translated = await runPrompt(buildSmartPrompt(payload, 'product'));

                await client.query(`
                    UPDATE product_translations
                    SET 
                        title = COALESCE($1, title),
                        description_html = COALESCE($2, description_html),
                        specs_html = COALESCE($3, specs_html),
                        package_includes = COALESCE($4, package_includes),
                        updated_at = NOW()
                    WHERE product_id = $5 AND language_code = 'bg'
                `, [
                    translated.title,
                    translated.description_html,
                    translated.specs_html,
                    translated.package_includes,
                    row.id
                ]);
                console.log(`✅ Updated: ${translated.title}`);
            } catch (e) {
                console.error(`❌ Failed to translate product ${row.id}:`, e.message);
            }
        }

    } catch (e) {
        console.error('Fatal error during translation:', e);
    } finally {
        client.release();
    }
}

translateProducts().then(() => {
    console.log('Translation process complete.');
    pool.end();
});
