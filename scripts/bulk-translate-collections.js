
require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const OpenAI = require('openai');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

async function translateContent(text, targetLang = "Bulgarian") {
    if (!text || text.trim() === '') return '';

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: `You are a professional translator specializing in action sports (Kitesurfing, Wakeboarding, Wing Foiling, Windsurfing). 
                    Translate the following product collection title or subtitle into ${targetLang}. 
                    Maintain the technical meaning and professional tone appropriate for an e-commerce site. 
                    If it's a technical term widely used in English, keep it in English if appropriate, but translate the surrounding context.
                    Return ONLY the translated text.`
                },
                {
                    role: "user",
                    content: text
                }
            ],
            temperature: 0.3,
        });

        return response.choices[0].message.content.trim();
    } catch (e) {
        console.error(`Translation failed for: ${text}`, e);
        return '';
    }
}

async function run() {
    try {
        console.log('Fetching all collections missing BG translations...');

        // Fetch all collections with their English translations
        // AND check if they are missing BG title OR BG subtitle
        const res = await pool.query(`
            SELECT c.id, c.source, ct_en.title as title_en, ct_en.subtitle as subtitle_en,
                   ct_bg.title as title_bg, ct_bg.subtitle as subtitle_bg
            FROM collections c 
            JOIN collection_translations ct_en ON c.id = ct_en.collection_id AND ct_en.language_code = 'en'
            LEFT JOIN collection_translations ct_bg ON c.id = ct_bg.collection_id AND ct_bg.language_code = 'bg'
            WHERE ct_bg.title IS NULL OR ct_bg.title = '' OR ct_bg.subtitle IS NULL OR ct_bg.subtitle = ''
        `);

        console.log(`Found ${res.rows.length} collections needing translation.`);

        for (const row of res.rows) {
            const { id, source, title_en, subtitle_en, title_bg, subtitle_bg } = row;

            console.log(`\nProcessing [${source}] : "${title_en}"`);

            let finalTitleBg = title_bg;
            let finalSubtitleBg = subtitle_bg;

            if (!finalTitleBg || finalTitleBg === '') {
                console.log(`- Translating Title...`);
                finalTitleBg = await translateContent(title_en);
            }

            if (!finalSubtitleBg || finalSubtitleBg === '') {
                console.log(`- Translating Subtitle...`);
                finalSubtitleBg = await translateContent(subtitle_en);
            }

            if (finalTitleBg) {
                const sql = `
                    INSERT INTO collection_translations (collection_id, language_code, title, subtitle, updated_at)
                    VALUES ($1, 'bg', $2, $3, NOW())
                    ON CONFLICT (collection_id, language_code) 
                    DO UPDATE SET 
                        title = EXCLUDED.title, 
                        subtitle = EXCLUDED.subtitle, 
                        updated_at = NOW()
                `;

                await pool.query(sql, [id, finalTitleBg, finalSubtitleBg]);
                console.log(`✅ Success: [BG] ${finalTitleBg} | ${finalSubtitleBg || '(no subtitle)'}`);
            } else {
                console.log(`❌ Skipped: Could not translate title.`);
            }

            // Subtle rate limiting for safety
            await new Promise(resolve => setTimeout(resolve, 200));
        }

        console.log('\n--- Translation Complete ---');

    } catch (e) {
        console.error('Fatal error:', e);
    } finally {
        await pool.end();
    }
}

run();
