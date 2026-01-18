import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import OpenAI from 'openai';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.DATABASE_URL;
const supabaseKey = process.env.DATABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role for admin access

if (!supabaseUrl) {
    console.error('Missing DATABASE_URL');
    process.exit(1);
}

// Initialize Supabase client
// Note: Using direct PG connection might be better for bulk updates, but Supabase JS is easier for now if we have the key
// Since we might not have the service role key exposed in .env.local (it usually isn't), we might need to use the pg library directly as per other scripts.
// Checking .env.local content from previous steps, only DATABASE_URL is available.
// So we will use 'pg' library.

import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const SPECS_DIR = path.join(process.cwd(), 'scraped_data', 'specs');

async function translateToBg(text: string, context: string): Promise<string> {
    if (!text || !text.trim()) return '';

    try {
        const completion = await openai.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "You are a professional translator for a water sports equipment company (Kitesurfing, Wakeboarding). Translate the following HTML content from English to Bulgarian. Rules: 1. Keep brand names (Slingshot, Ride Engine, Phantasm, etc.) in English. 2. Keep specific technical terms (e.g., 'Tip-to-Tip', 'Duralite', 'Carbon Woven') in English if they are standard industry terms, otherwise translate them carefully. 3. Translate 'Key Features', 'Package Includes', 'Specifications' and other headers. 4. Preserve all HTML tags and structure exactly. 5. For specs tables, translate the keys (like 'Size', 'Weight') but keep values in English if they are numbers or units."
                },
                {
                    role: "user",
                    content: `Context: ${context}\n\nContent to translate:\n${text}`
                }
            ],
            model: "gpt-4o-mini",
        });

        return completion.choices[0].message.content || '';
    } catch (error) {
        console.error(`Error translating ${context}:`, error);
        return text; // Fallback to original
    }
}

async function main() {
    console.log('Starting Specs Import and Translation...');

    if (!fs.existsSync(SPECS_DIR)) {
        console.error(`Directory not found: ${SPECS_DIR}`);
        return;
    }

    const files = fs.readdirSync(SPECS_DIR).filter(f => f.endsWith('.json'));
    console.log(`Found ${files.length} spec files.`);

    const client = await pool.connect();

    try {
        for (const file of files) {
            const filePath = path.join(SPECS_DIR, file);
            const content = fs.readFileSync(filePath, 'utf-8');
            const data = JSON.parse(content);
            const slug = data.slug || file.replace('.json', '');

            console.log(`Processing ${slug}...`);

            // 1. Find Product ID
            const productRes = await client.query('SELECT id, name FROM products WHERE slug = $1', [slug]);
            if (productRes.rows.length === 0) {
                console.warn(`  Product not found for slug: ${slug}, skipping.`);
                continue;
            }
            const product = productRes.rows[0];

            // 2. Prepare English Content
            const specsHtmlEn = data.specs_html || '';
            const packageIncludesEn = data.package_includes || '';

            // 3. Translate Content
            let specsHtmlBg = '';
            let packageIncludesBg = '';

            if (specsHtmlEn) {
                process.stdout.write('  Translating Specs... ');
                specsHtmlBg = await translateToBg(specsHtmlEn, `Specs for ${product.name}`);
                console.log('Done.');
            }

            if (packageIncludesEn) {
                process.stdout.write('  Translating Package Includes... ');
                packageIncludesBg = await translateToBg(packageIncludesEn, `Package Includes for ${product.name}`);
                console.log('Done.');
            }

            // 4. Update Product Translations
            // Check if translation exists for 'bg'
            const transRes = await client.query(
                `SELECT id FROM product_translations WHERE product_id = $1 AND language_code = 'bg'`,
                [product.id]
            );

            if (transRes.rows.length > 0) {
                // Update existing
                await client.query(
                    `UPDATE product_translations 
                     SET specs_html = $1, package_includes = $2
                     WHERE product_id = $3 AND language_code = 'bg'`,
                    [specsHtmlBg, packageIncludesBg, product.id]
                );
                console.log(`  Updated BG translation.`);
            } else {
                // Insert new
                await client.query(
                    `INSERT INTO product_translations (product_id, language_code, specs_html, package_includes)
                     VALUES ($1, 'bg', $2, $3)`,
                    [product.id, specsHtmlBg, packageIncludesBg]
                );
                console.log(`  Inserted BG translation.`);
            }

            // 5. Update Product (English Default / Fallback columns if they exist on products table too?)
            // Based on previous file views, it seems `products` table has `specs_html` and `package_includes` columns directly too.
            // We should update those as the default EN content.
            await client.query(
                `UPDATE products 
                 SET specs_html = $1, package_includes = $2
                 WHERE id = $3`,
                [specsHtmlEn, packageIncludesEn, product.id]
            );
            console.log(`  Updated base product (EN).`);

            // Wait a bit to avoid hitting rate limits too hard if processing many
            await new Promise(resolve => setTimeout(resolve, 200));
        }

    } catch (err) {
        console.error("Script execution failed:", err);
    } finally {
        client.release();
        await pool.end();
        console.log('Finished.');
    }
}

main();
