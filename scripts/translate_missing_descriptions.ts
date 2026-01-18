
import { query } from '../lib/db';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

if (!process.env.OPENAI_API_KEY) {
    console.error("Missing OPENAI_API_KEY");
    process.exit(1);
}

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const FIELDS_TO_TRANSLATE = [
    'description_html',
    'description_html2',
    'specs_html',
    'package_includes'
];

async function translateText(text: string): Promise<string> {
    if (!text || !text.trim()) return '';

    try {
        const completion = await openai.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "You are a professional translator for a water sports e-commerce site (kiteboarding, surfing, wakeboarding). Translate the following HTML content from English to Bulgarian. Preserve all HTML tags, structure, and attributes exactly. Only translate the text content. Keep technical terms like 'kite', 'board', 'wakeboard', 'hydrofoil' or brand names (Slingshot, Ride Engine) in English if they are commonly used in that form in Bulgaria, or provide the common Bulgarian equivalent if it exists. Ensure the tone is professional and marketing-oriented."
                },
                {
                    role: "user",
                    content: text
                }
            ],
            model: "gpt-4o",
            temperature: 0.3,
        });

        return completion.choices[0].message.content || text;
    } catch (err) {
        console.error("Translation error:", err);
        return text; // Return original on error to be safe, or handle differently
    }
}

async function main() {
    console.log("Starting Bulgarian description translation script...");

    // 1. Get all products with their EN translations
    // We strictly need EN translation to exist to translate FROM it.
    const productsRes = await query(`
        SELECT p.id, p.slug, p.name 
        FROM products p 
        ORDER BY p.created_at DESC
    `);

    const products = productsRes.rows;
    console.log(`Checking ${products.length} products...`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const product of products) {
        // Fetch EN translation
        const enRes = await query(`
            SELECT * FROM product_translations 
            WHERE product_id = $1 AND language_code = 'en'
        `, [product.id]);

        const enTrans = enRes.rows[0];

        if (!enTrans) {
            console.log(`[${product.slug}] No EN translation found. Skipping.`);
            skippedCount++;
            continue;
        }

        // Fetch BG translation
        const bgRes = await query(`
            SELECT * FROM product_translations 
            WHERE product_id = $1 AND language_code = 'bg'
        `, [product.id]);

        let bgTrans = bgRes.rows[0];
        let needsUpdate = false;
        let newBgValues: any = {};

        // If no BG record, we treat all fields as empty/missing
        if (!bgTrans) {
            bgTrans = {};
            needsUpdate = true; // We will definitely need to insert
        }

        const updates: string[] = [];

        for (const field of FIELDS_TO_TRANSLATE) {
            const enVal = enTrans[field];
            const bgVal = bgTrans[field];

            // Logic:
            // 1. Source (EN) must exist.
            // 2. Target (BG) is either empty OR strictly equal to EN (untouched/copied).
            // 3. User said: "rule: english and bulgarian are 1:1 same. THEN > translate"

            const isIdentical = enVal && bgVal && enVal.trim() === bgVal.trim();
            const isMissing = !bgVal || !bgVal.trim();

            if (enVal && enVal.trim().length > 0 && (isIdentical || isMissing)) {
                console.log(`   Translating ${field} for ${product.slug}...`);

                const translated = await translateText(enVal);

                if (translated && translated !== enVal) {
                    newBgValues[field] = translated;
                    updates.push(field);
                    needsUpdate = true;
                    // Rate limit / polite delay
                    await new Promise(r => setTimeout(r, 1000));
                } else {
                    // If translation returned same or empty (error?), keep/use original?
                    // Safe to use original if translation failed, but if it returned same it might mean GPT didn't translate.
                    // We'll skip updating if it didn't change (to avoid loop next time, though strict equality check handles it)
                    newBgValues[field] = bgVal || '';
                }
            } else {
                // Keep existing BG value (already translated or different)
                newBgValues[field] = bgVal;
            }
        }

        if (needsUpdate && updates.length > 0) {
            console.log(`   Saving translations for ${product.slug}: ${updates.join(', ')}`);

            // Upsert logic
            // We need to merge with existing or default values for other columns if strictly inserting
            // But here we might just have the fields we care about. 
            // We should ensure we don't nullify other fields if we are updating.
            // If inserting, we default others to empty string?

            // Check if row exists again to distinguish insert vs update
            if (bgTrans.id) {
                // UPDATE
                // Construct dynamic update query
                // We only update the fields that changed + updated_at
                const setClauses: string[] = [];
                const values: any[] = [];
                let idx = 1;

                for (const field of updates) {
                    setClauses.push(`${field} = $${idx}`);
                    values.push(newBgValues[field]);
                    idx++;
                }

                values.push(product.id);
                // "bg" is implied by WHERE clause 

                await query(`
                    UPDATE product_translations 
                    SET ${setClauses.join(', ')}, updated_at = NOW()
                    WHERE product_id = $${idx} AND language_code = 'bg'
                `, values);

            } else {
                // INSERT
                // We need to insert ALL fields, usually better to insert what we have, defaults for others?
                // The table likely has constraints or defaults.
                // Safest to insert empty strings for nulls if not nullable.

                const cols = ['product_id', 'language_code', ...FIELDS_TO_TRANSLATE, 'title', 'created_at', 'updated_at'];
                // We didn't translate title, so we should separate it or fetch it?
                // User didn't ask for title. We'll use EN title as fallback if missing? 
                // Or leave empty if nullable.
                // Let's copy EN title if we are creating a new record, just to have a title.

                const titleToUse = enTrans.title || '';

                await query(`
                    INSERT INTO product_translations (
                        product_id, language_code, 
                        description_html, description_html2, specs_html, package_includes,
                        title
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
                `, [
                    product.id,
                    'bg',
                    newBgValues['description_html'] || '',
                    newBgValues['description_html2'] || '',
                    newBgValues['specs_html'] || '',
                    newBgValues['package_includes'] || '',
                    titleToUse
                ]);
            }

            updatedCount++;
            // Extra delay after save
            await new Promise(r => setTimeout(r, 1000));
        } else {
            console.log(`[${product.slug}] No text needs translation.`);
        }
    }

    console.log(`Done. Updated ${updatedCount} products. Skipped ${skippedCount}.`);
    process.exit(0);
}

main().catch(err => {
    console.error("Fatal error:", err);
    process.exit(1);
});
