
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
    if (!text || text.trim() === '') return null;

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
        return null;
    }
}

async function run() {
    try {
        console.log('Fetching Slingshot collections...');

        // Fetch all Slingshot collections with their English translations
        const res = await pool.query(`
            SELECT c.id, ct.title, ct.subtitle 
            FROM collections c 
            JOIN collection_translations ct ON c.id = ct.collection_id 
            WHERE c.source = 'slingshot' AND ct.language_code = 'en'
        `);

        console.log(`Found ${res.rows.length} collections to translate.`);

        for (const row of res.rows) {
            const { id, title, subtitle } = row;

            console.log(`\nTranslating: "${title}"`);

            const bgTitle = await translateContent(title);
            const bgSubtitle = subtitle ? await translateContent(subtitle) : null;

            if (bgTitle) {
                const sql = `
                    INSERT INTO collection_translations (collection_id, language_code, title, subtitle, updated_at)
                    VALUES ($1, 'bg', $2, $3, NOW())
                    ON CONFLICT (collection_id, language_code) 
                    DO UPDATE SET 
                        title = EXCLUDED.title, 
                        subtitle = EXCLUDED.subtitle, 
                        updated_at = NOW()
                `;

                await pool.query(sql, [id, bgTitle, bgSubtitle]);
                console.log(`✅ Success: [BG] ${bgTitle} ${bgSubtitle ? `(${bgSubtitle})` : ''}`);
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
