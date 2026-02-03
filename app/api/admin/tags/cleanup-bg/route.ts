import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// Helper function to detect if text contains Cyrillic characters
function containsCyrillic(text: string): boolean {
    return /[\u0400-\u04FF]/.test(text);
}

// GET: Preview which Bulgarian tags would be removed
export async function GET() {
    try {
        // Find all products with tags containing Cyrillic characters
        const { rows: productsWithBgTags } = await query(`
            SELECT 
                p.id,
                p.name as product_name,
                p.tags as tags_en
            FROM products p
            WHERE p.tags IS NOT NULL 
            AND array_length(p.tags, 1) > 0
        `);

        // Find all English translations with Cyrillic tags
        const { rows: translationsWithBgTags } = await query(`
            SELECT 
                pt.product_id,
                p.name as product_name,
                pt.tags as tags_en
            FROM product_translations pt
            JOIN products p ON pt.product_id = p.id
            WHERE pt.language_code = 'en'
            AND pt.tags IS NOT NULL 
            AND array_length(pt.tags, 1) > 0
        `);

        // Find all Bulgarian translations with tags (for reference)
        const { rows: bgTranslations } = await query(`
            SELECT 
                pt.product_id,
                p.name as product_name,
                pt.tags as tags_bg
            FROM product_translations pt
            JOIN products p ON pt.product_id = p.id
            WHERE pt.language_code = 'bg'
            AND pt.tags IS NOT NULL 
            AND array_length(pt.tags, 1) > 0
        `);

        // Collect all unique Bulgarian tags found in EN columns
        const bgTagsInEnColumns = new Set<string>();
        const affectedProducts: { id: string; name: string; bgTags: string[] }[] = [];

        // Check products table
        productsWithBgTags.forEach((row: any) => {
            const tags: string[] = row.tags_en || [];
            const bgTags = tags.filter(tag => containsCyrillic(tag));
            if (bgTags.length > 0) {
                bgTags.forEach(tag => bgTagsInEnColumns.add(tag));
                affectedProducts.push({
                    id: row.id,
                    name: row.product_name,
                    bgTags
                });
            }
        });

        // Check EN translations
        translationsWithBgTags.forEach((row: any) => {
            const tags: string[] = row.tags_en || [];
            const bgTags = tags.filter(tag => containsCyrillic(tag));
            if (bgTags.length > 0) {
                bgTags.forEach(tag => bgTagsInEnColumns.add(tag));
                // Don't add duplicate products to list
                if (!affectedProducts.find(p => p.id === row.product_id)) {
                    affectedProducts.push({
                        id: row.product_id,
                        name: row.product_name,
                        bgTags
                    });
                }
            }
        });

        return NextResponse.json({
            preview: true,
            totalBgTagsFound: bgTagsInEnColumns.size,
            bgTags: Array.from(bgTagsInEnColumns).sort(),
            affectedProductsCount: affectedProducts.length,
            affectedProducts: affectedProducts.slice(0, 20), // Show first 20
            hasMore: affectedProducts.length > 20
        });

    } catch (error: any) {
        console.error('Failed to preview cleanup', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST: Actually delete Bulgarian tags from English columns
export async function POST() {
    try {
        console.log('Starting cleanup of Bulgarian tags from English columns...');

        // 1. Get all products with their current tags
        const { rows: allProducts } = await query(`
            SELECT 
                p.id,
                p.tags as tags_en
            FROM products p
            WHERE p.tags IS NOT NULL 
            AND array_length(p.tags, 1) > 0
        `);

        // 2. Get all EN translations with their tags
        const { rows: allEnTranslations } = await query(`
            SELECT 
                pt.product_id,
                pt.tags as tags_en
            FROM product_translations pt
            WHERE pt.language_code = 'en'
            AND pt.tags IS NOT NULL 
            AND array_length(pt.tags, 1) > 0
        `);

        let productsUpdated = 0;
        let translationsUpdated = 0;
        let totalBgTagsRemoved = 0;

        // 3. Clean products table
        for (const row of allProducts) {
            const tags: string[] = row.tags_en || [];
            const cleanTags = tags.filter(tag => !containsCyrillic(tag));

            if (cleanTags.length !== tags.length) {
                const removedCount = tags.length - cleanTags.length;
                totalBgTagsRemoved += removedCount;

                await query(`
                    UPDATE products 
                    SET tags = $1,
                        updated_at = NOW()
                    WHERE id = $2
                `, [cleanTags.length > 0 ? cleanTags : null, row.id]);

                productsUpdated++;
                console.log(`Cleaned ${removedCount} BG tags from product ${row.id}`);
            }
        }

        // 4. Clean EN translations
        for (const row of allEnTranslations) {
            const tags: string[] = row.tags_en || [];
            const cleanTags = tags.filter(tag => !containsCyrillic(tag));

            if (cleanTags.length !== tags.length) {
                const removedCount = tags.length - cleanTags.length;
                totalBgTagsRemoved += removedCount;

                await query(`
                    UPDATE product_translations 
                    SET tags = $1,
                        updated_at = NOW()
                    WHERE product_id = $2 AND language_code = 'en'
                `, [cleanTags.length > 0 ? cleanTags : null, row.product_id]);

                translationsUpdated++;
                console.log(`Cleaned ${removedCount} BG tags from EN translation of product ${row.product_id}`);
            }
        }

        // 5. Also clean the master tags table
        const { rows: masterTags } = await query(`
            SELECT name_en FROM tags WHERE name_en IS NOT NULL
        `);

        let masterTagsDeleted = 0;
        for (const row of masterTags) {
            if (containsCyrillic(row.name_en)) {
                await query(`DELETE FROM tags WHERE name_en = $1`, [row.name_en]);
                masterTagsDeleted++;
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Cleanup completed successfully',
            stats: {
                productsUpdated,
                translationsUpdated,
                masterTagsDeleted,
                totalBgTagsRemoved
            }
        });

    } catch (error: any) {
        console.error('Cleanup failed:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}