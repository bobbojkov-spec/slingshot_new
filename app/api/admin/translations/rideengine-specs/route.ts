import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { GoogleGenerativeAI } from '@google/generative-ai';

const SLEEP_MS = 500; // Rate limiting

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function translateHtml(text: string, apiKey: string): Promise<string> {
    if (!text || text.trim() === '') return '';

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `Translate the following HTML content from English to Bulgarian.
Preserve all HTML tags, attributes, and structure. Only translate the text content.
Keep brand names (Ride Engine, Slingshot), model numbers, measurements, and technical terms unchanged.

English HTML:
${text}`;

    const result = await model.generateContent(prompt);
    return result.response.text().trim() || '';
}

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const brand = searchParams.get('brand'); // Optional: 'ride-engine', 'slingshot', or 'all'

        // Build brand filter based on parameter
        let brandFilter = '';
        const params: any[] = [];

        if (brand && brand !== 'all') {
            if (brand === 'ride-engine' || brand === 'rideengine') {
                brandFilter = `AND LOWER(p.brand) IN ('ride engine', 'rideengine')`;
            } else if (brand === 'slingshot') {
                brandFilter = `AND LOWER(p.brand) = 'slingshot'`;
            }
        }

        // Find products with English content but missing Bulgarian translations
        const { rows: products } = await query(`
            SELECT
                p.id,
                p.name,
                p.title,
                p.brand,
                p.specs_html,
                p.description_html,
                p.description_html2,
                p.package_includes,
                pt.specs_html as bg_specs_html,
                pt.description_html as bg_description_html,
                pt.description_html2 as bg_description_html2,
                pt.package_includes as bg_package_includes,
                pt.title as bg_title
            FROM products p
            LEFT JOIN product_translations pt ON pt.product_id = p.id AND pt.language_code = 'bg'
            WHERE p.status = 'active'
            ${brandFilter}
            AND (
                (p.specs_html IS NOT NULL AND p.specs_html != '' AND (pt.specs_html IS NULL OR pt.specs_html = ''))
                OR (p.description_html IS NOT NULL AND p.description_html != '' AND (pt.description_html IS NULL OR pt.description_html = ''))
                OR (p.description_html2 IS NOT NULL AND p.description_html2 != '' AND (pt.description_html2 IS NULL OR pt.description_html2 = ''))
                OR (p.package_includes IS NOT NULL AND p.package_includes != '' AND (pt.package_includes IS NULL OR pt.package_includes = ''))
            )
            ORDER BY p.brand, p.name
        `);

        return NextResponse.json({
            count: products.length,
            products: products.map(p => ({
                id: p.id,
                name: p.name || p.title,
                brand: p.brand,
                missing: {
                    specs_html: p.specs_html && !p.bg_specs_html,
                    description_html: p.description_html && !p.bg_description_html,
                    description_html2: p.description_html2 && !p.bg_description_html2,
                    package_includes: p.package_includes && !p.bg_package_includes,
                }
            }))
        });
    } catch (error: any) {
        console.error('Failed to fetch products needing translation:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { limit = 10, brand = 'all' } = await req.json().catch(() => ({}));
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });
        }

        // Build brand filter
        let brandFilter = '';
        if (brand && brand !== 'all') {
            if (brand === 'ride-engine' || brand === 'rideengine') {
                brandFilter = `AND LOWER(p.brand) IN ('ride engine', 'rideengine')`;
            } else if (brand === 'slingshot') {
                brandFilter = `AND LOWER(p.brand) = 'slingshot'`;
            }
        }

        // Find products needing translation
        const { rows: products } = await query(`
            SELECT
                p.id,
                p.name,
                p.title,
                p.brand,
                p.specs_html,
                p.description_html,
                p.description_html2,
                p.package_includes,
                pt.id as translation_id,
                pt.specs_html as bg_specs_html,
                pt.description_html as bg_description_html,
                pt.description_html2 as bg_description_html2,
                pt.package_includes as bg_package_includes,
                pt.title as bg_title
            FROM products p
            LEFT JOIN product_translations pt ON pt.product_id = p.id AND pt.language_code = 'bg'
            WHERE p.status = 'active'
            ${brandFilter}
            AND (
                (p.specs_html IS NOT NULL AND p.specs_html != '' AND (pt.specs_html IS NULL OR pt.specs_html = ''))
                OR (p.description_html IS NOT NULL AND p.description_html != '' AND (pt.description_html IS NULL OR pt.description_html = ''))
                OR (p.description_html2 IS NOT NULL AND p.description_html2 != '' AND (pt.description_html2 IS NULL OR pt.description_html2 = ''))
                OR (p.package_includes IS NOT NULL AND p.package_includes != '' AND (pt.package_includes IS NULL OR pt.package_includes = ''))
            )
            ORDER BY p.brand, p.name
            LIMIT $1
        `, [limit]);

        console.log(`Found ${products.length} products needing translation (brand filter: ${brand})`);

        const results: Array<{ id: string; name: string; translated: string[] }> = [];

        for (const product of products) {
            const translated: string[] = [];

            // Translate each missing field
            let bgSpecs = product.bg_specs_html;
            let bgDesc1 = product.bg_description_html;
            let bgDesc2 = product.bg_description_html2;
            let bgPackage = product.bg_package_includes;
            let bgTitle = product.bg_title;

            // Copy English title if missing Bulgarian title
            if (product.title && !bgTitle) {
                bgTitle = product.title;
                translated.push('title (copied)');
            }

            if (product.specs_html && !bgSpecs) {
                bgSpecs = await translateHtml(product.specs_html, apiKey);
                translated.push('specs_html');
                await sleep(SLEEP_MS);
            }

            if (product.description_html && !bgDesc1) {
                bgDesc1 = await translateHtml(product.description_html, apiKey);
                translated.push('description_html');
                await sleep(SLEEP_MS);
            }

            if (product.description_html2 && !bgDesc2) {
                bgDesc2 = await translateHtml(product.description_html2, apiKey);
                translated.push('description_html2');
                await sleep(SLEEP_MS);
            }

            if (product.package_includes && !bgPackage) {
                bgPackage = await translateHtml(product.package_includes, apiKey);
                translated.push('package_includes');
                await sleep(SLEEP_MS);
            }

            // Upsert translation
            if (translated.length > 0) {
                await query(`
                    INSERT INTO product_translations (
                        product_id,
                        language_code,
                        title,
                        specs_html,
                        description_html,
                        description_html2,
                        package_includes,
                        updated_at
                    ) VALUES ($1, 'bg', $2, $3, $4, $5, $6, NOW())
                    ON CONFLICT (product_id, language_code) DO UPDATE SET
                        title = COALESCE(NULLIF(EXCLUDED.title, ''), product_translations.title),
                        specs_html = COALESCE(NULLIF(EXCLUDED.specs_html, ''), product_translations.specs_html),
                        description_html = COALESCE(NULLIF(EXCLUDED.description_html, ''), product_translations.description_html),
                        description_html2 = COALESCE(NULLIF(EXCLUDED.description_html2, ''), product_translations.description_html2),
                        package_includes = COALESCE(NULLIF(EXCLUDED.package_includes, ''), product_translations.package_includes),
                        updated_at = NOW()
                `, [
                    product.id,
                    bgTitle || '',
                    bgSpecs || '',
                    bgDesc1 || '',
                    bgDesc2 || '',
                    bgPackage || ''
                ]);

                results.push({
                    id: product.id,
                    name: product.name || product.title,
                    translated
                });
            }
        }

        return NextResponse.json({
            success: true,
            processed: results.length,
            results
        });
    } catch (error: any) {
        console.error('Translation batch failed:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
