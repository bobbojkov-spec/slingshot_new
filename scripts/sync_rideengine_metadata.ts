import { Pool } from 'pg';
import dotenv from 'dotenv';
import { query } from '@/lib/db';

dotenv.config({ path: '.env.local' });

const RIDEENGINE_CATEGORY_ID = '2a5ced6e-e8dc-454d-959b-6c46f5016914';

async function main() {
    console.log('Mapping Ride Engine products to category and syncing translations (EN + BG)...');

    // 1. Map to Category
    const updateCategorySql = `
        UPDATE products 
        SET category_id = $1 
        WHERE product_type = 'Scraped'
    `;

    // 2. Fetch Base Product Info
    const fetchProductsSql = `
        SELECT id, title, handle, description_html, specs_html, package_includes, tags, seo_title, seo_description, meta_keywords, og_title, og_description
        FROM products
        WHERE product_type = 'Scraped'
    `;

    const upsertTransSql = (lang: string) => `
        INSERT INTO product_translations (
            product_id, language_code, title, description_html, description_html2, 
            specs_html, package_includes, tags, seo_title, seo_description, 
            meta_keywords, og_title, og_description, updated_at
        )
        VALUES ($1, '${lang}', $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
        ON CONFLICT (product_id, language_code) 
        DO UPDATE SET
            title = EXCLUDED.title,
            description_html = EXCLUDED.description_html,
            description_html2 = EXCLUDED.description_html2,
            specs_html = EXCLUDED.specs_html,
            package_includes = EXCLUDED.package_includes,
            tags = EXCLUDED.tags,
            seo_title = EXCLUDED.seo_title,
            seo_description = EXCLUDED.seo_description,
            meta_keywords = EXCLUDED.meta_keywords,
            og_title = EXCLUDED.og_title,
            og_description = EXCLUDED.og_description,
            updated_at = NOW()
    `;

    try {
        const catRes = await query(updateCategorySql, [RIDEENGINE_CATEGORY_ID]);
        console.log(`Updated category for ${catRes.rowCount} products.`);

        const prodRes = await query(fetchProductsSql);
        console.log(`Processing ${prodRes.rows.length} products...`);

        let enCount = 0;
        let bgCount = 0;

        for (const p of prodRes.rows) {
            // Upsert EN
            await query(upsertTransSql('en'), [
                p.id,
                p.title,
                p.description_html,
                null, // description_html2
                p.specs_html,
                p.package_includes,
                p.tags,
                p.seo_title,
                p.seo_description,
                p.meta_keywords,
                p.og_title,
                p.og_description
            ]);
            enCount++;

            // Upsert BG (Same as EN)
            await query(upsertTransSql('bg'), [
                p.id,
                p.title,
                p.description_html,
                null, // description_html2
                p.specs_html,
                p.package_includes,
                p.tags,
                p.seo_title,
                p.seo_description,
                p.meta_keywords,
                p.og_title,
                p.og_description
            ]);
            bgCount++;
        }

        console.log(`Successfully synced ${enCount} English and ${bgCount} Bulgarian translations.`);

    } catch (error) {
        console.error('Error during metadata sync:', error);
    }
}

main().catch(console.error);
