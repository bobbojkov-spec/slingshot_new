
const { Pool } = require('pg');
const OpenAI = require('openai');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function slugify(text) {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-');
}

async function runPrompt(prompt) {
    const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
    });
    return JSON.parse(completion.choices[0].message.content || '{}');
}

async function fixLeakedTags() {
    const client = await pool.connect();
    try {
        console.log('Identifying tags with Bulgarian text in name_en...');
        const { rows: tags } = await client.query(`
            SELECT id, name_en, name_bg 
            FROM tags 
            WHERE name_en ~ '[а-яА-Я]'
        `);

        if (tags.length === 0) {
            console.log('No leaked Bulgarian tags found.');
            return;
        }

        console.log(`Found ${tags.length} leaked tags.`);

        for (const tag of tags) {
            const leakedBg = tag.name_en;
            console.log(`Processing: "${leakedBg}"`);

            const prompt = `
            You are a professional translator for a kitesurfing/watersports site.
            The following text is in Bulgarian but was accidentally placed in an English tag column.
            Translate it to a proper English e-commerce tag name (concise, title case).
            
            Text: "${leakedBg}"
            
            Return valid JSON: { "en": "English Translation" }
            `;

            try {
                const { en: correctEn } = await runPrompt(prompt);
                const correctBg = leakedBg; // The Bulgarian text is what we have
                const newSlug = slugify(correctEn);

                console.log(` -> English: "${correctEn}", Bulgarian: "${correctBg}"`);

                // Check if this English tag already exists
                const { rows: existing } = await client.query(`
                    SELECT id, name_bg FROM tags WHERE name_en = $1
                `, [correctEn]);

                if (existing.length > 0) {
                    console.log(` -> Existing tag found (ID: ${existing[0].id}). Merging...`);
                    const existingId = existing[0].id;
                    const existingBg = existing[0].name_bg;

                    // If the existing tag doesn't have a Bulgarian translation, give it our leaked one
                    if (!existingBg) {
                        await client.query(`UPDATE tags SET name_bg = $1 WHERE id = $2`, [correctBg, existingId]);
                    }

                    // Replace references in all tables
                    await client.query(`UPDATE products SET tags = array_replace(tags, $1, $2) WHERE $1 = ANY(tags)`, [leakedBg, correctEn]);
                    await client.query(`UPDATE product_translations SET tags = array_replace(tags, $1, $2) WHERE language_code = 'en' AND $1 = ANY(tags)`, [leakedBg, correctEn]);
                    await client.query(`UPDATE product_translations SET tags = array_replace(tags, $1, $2) WHERE language_code = 'bg' AND $1 = ANY(tags)`, [leakedBg, correctBg]);

                    // Delete the redundant tag
                    await client.query(`DELETE FROM tags WHERE id = $1`, [tag.id]);
                    console.log(` ✅ Merged: ${leakedBg} into existing ${correctEn}`);
                } else {
                    // Update the tags table
                    await client.query(`
                        UPDATE tags 
                        SET name_en = $1, name_bg = $2, slug = $3, updated_at = NOW()
                        WHERE id = $4
                    `, [correctEn, correctBg, newSlug, tag.id]);

                    // Propagate to products and translations
                    await client.query(`UPDATE products SET tags = array_replace(tags, $1, $2) WHERE $1 = ANY(tags)`, [leakedBg, correctEn]);
                    await client.query(`UPDATE product_translations SET tags = array_replace(tags, $1, $2) WHERE language_code = 'en' AND $1 = ANY(tags)`, [leakedBg, correctEn]);
                    await client.query(`UPDATE product_translations SET tags = array_replace(tags, $1, $2) WHERE language_code = 'bg' AND $1 = ANY(tags)`, [leakedBg, correctBg]);

                    console.log(` ✅ Fixed: ${leakedBg} -> ${correctEn}`);
                }

            } catch (err) {
                console.error(` ❌ Failed to fix tag "${leakedBg}":`, err.message);
            }
        }

    } catch (e) {
        console.error('Fatal error:', e);
    } finally {
        client.release();
        pool.end();
    }
}

fixLeakedTags();
