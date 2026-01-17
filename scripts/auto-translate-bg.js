const { Pool } = require('pg');
const OpenAI = require('openai');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function autoTranslate() {
    const client = await pool.connect();
    try {
        console.log('Identifying duplicates...');

        // Find products where BG description equals EN description (or is very similar/empty)
        // We compare pt_bg.description_html with products.description_html (source of truth for EN usually)
        // OR pt_bg vs pt_en

        const query = `
      SELECT pt.product_id, pt.title, pt.description_html as bg_desc, p.description_html as en_desc
      FROM product_translations pt
      JOIN products p ON p.id = pt.product_id
      WHERE pt.language_code = 'bg'
      AND (
          pt.description_html = p.description_html
          OR pt.description_html IS NULL
          OR length(pt.description_html) < 5
      )
      LIMIT 50
    `;

        // Limit to 50 for safety in one run (or loop?)
        // User wants to check "product text areas that have 1:1 the same text as English".

        const candidates = await client.query(query);
        console.log(`Found ${candidates.rows.length} candidates for translation.`);

        for (const row of candidates.rows) {
            if (!row.en_desc || row.en_desc.length < 5) {
                console.log(`Skipping ${row.title} (Empty EN description)`);
                continue;
            }

            console.log(`Translating: ${row.title || row.product_id}...`);

            // Prepare content partial (just description mostly, but user said "Descriptions")
            const contentToTranslate = {
                description_html: row.en_desc
            };

            const prompt = `You are a professional translator. Translate from English to Bulgarian.
        Keep HTML tags exactly as is. Keep brand names English.
        Content: ${JSON.stringify(contentToTranslate)}
        Return JSON object with translated keys.`;

            try {
                const completion = await openai.chat.completions.create({
                    model: 'gpt-4o-mini',
                    messages: [
                        { role: 'system', content: 'You are a translator. Return valid JSON.' },
                        { role: 'user', content: prompt }
                    ],
                    response_format: { type: 'json_object' },
                });

                const translated = JSON.parse(completion.choices[0].message.content);

                if (translated.description_html) {
                    await client.query(
                        `UPDATE product_translations SET description_html = $1, updated_at = NOW() WHERE product_id = $2 AND language_code = 'bg'`,
                        [translated.description_html, row.product_id]
                    );
                    console.log(`Updated ${row.product_id}`);
                }
            } catch (e) {
                console.error(`Failed to translate ${row.product_id}:`, e.message);
            }
        }

        console.log('Done.');

    } catch (err) {
        console.error(err);
    } finally {
        client.release();
        pool.end();
    }
}

autoTranslate();
