import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET: Fetch all tags - from master table + any tags found in products that aren't in the master table
export async function GET() {
    try {
        // 1. First, get all tags from the master tags table
        const { rows: masterTags } = await query(`
            SELECT name_en as en, name_bg as bg, slug
            FROM tags 
            ORDER BY name_en ASC
        `);

        // 2. Get all unique tags from products (both EN and BG translations)
        const { rows: productTags } = await query(`
            SELECT DISTINCT tag as name
            FROM (
                SELECT unnest(tags) as tag 
                FROM products 
                WHERE tags IS NOT NULL AND array_length(tags, 1) > 0
                UNION
                SELECT unnest(pt.tags) as tag 
                FROM product_translations pt
                WHERE pt.tags IS NOT NULL AND array_length(pt.tags, 1) > 0
            ) as all_tags
            WHERE tag IS NOT NULL AND tag != ''
            ORDER BY tag ASC
        `);

        // 3. Get Bulgarian translations for tags where available
        const { rows: bgTranslations } = await query(`
            SELECT 
                pt_en.tags as tags_en,
                pt_bg.tags as tags_bg
            FROM product_translations pt_en
            JOIN product_translations pt_bg ON pt_en.product_id = pt_bg.product_id
            WHERE pt_en.language_code = 'en' 
            AND pt_bg.language_code = 'bg'
            AND pt_en.tags IS NOT NULL 
            AND pt_bg.tags IS NOT NULL
        `);

        // Build a map of EN -> BG translations from product data
        const translationMap = new Map<string, string>();
        bgTranslations.forEach((row: any) => {
            const enTags: string[] = row.tags_en || [];
            const bgTags: string[] = row.tags_bg || [];
            enTags.forEach((enTag, index) => {
                if (enTag && bgTags[index] && !translationMap.has(enTag)) {
                    translationMap.set(enTag, bgTags[index]);
                }
            });
        });

        // 4. Merge master tags with product tags
        const tagMap = new Map<string, { en: string; bg: string | null; slug: string | null; source: string }>();

        // Add master tags first
        masterTags.forEach((row: any) => {
            tagMap.set(row.en, {
                en: row.en,
                bg: row.bg || translationMap.get(row.en) || null,
                slug: row.slug,
                source: 'master'
            });
        });

        // Add any tags from products that aren't in master table
        productTags.forEach((row: any) => {
            const tagName = row.name;
            if (!tagMap.has(tagName)) {
                const slug = tagName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
                tagMap.set(tagName, {
                    en: tagName,
                    bg: translationMap.get(tagName) || null,
                    slug,
                    source: 'product_only'
                });
            }
        });

        // 5. Get usage counts for all tags
        const { rows: usageCounts } = await query(`
            SELECT 
                tag as name,
                COUNT(DISTINCT product_id) as count
            FROM (
                SELECT unnest(tags) as tag, id as product_id
                FROM products
                WHERE status = 'active'
                UNION
                SELECT unnest(pt.tags) as tag, p.id as product_id
                FROM products p
                JOIN product_translations pt ON p.id = pt.product_id
                WHERE p.status = 'active'
            ) as tag_usage
            WHERE tag IS NOT NULL AND tag != ''
            GROUP BY tag
        `);

        const countMap = new Map<string, number>();
        usageCounts.forEach((row: any) => {
            countMap.set(row.name, parseInt(row.count, 10));
        });

        // 6. Build final response
        const allTags = Array.from(tagMap.values()).map(tag => ({
            en: tag.en,
            bg: tag.bg,
            slug: tag.slug,
            count: countMap.get(tag.en) || 0,
            inMasterTable: tag.source === 'master'
        }));

        // Sort by name
        allTags.sort((a, b) => a.en.localeCompare(b.en));

        return NextResponse.json({
            tags: allTags,
            totalCount: allTags.length,
            masterCount: masterTags.length,
            productOnlyCount: allTags.length - masterTags.length
        });
    } catch (error: any) {
        console.error('Failed to fetch tags', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST: Update a tag's translation OR create a new tag
export async function POST(req: Request) {
    try {
        const body = await req.json();

        if (body.action === 'sync') {
            // Sync all tags from products to master table
            return await syncTagsFromProducts();
        }

        if (body.action === 'create') {
            const { name_en, name_bg } = body;
            const slug = name_en.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

            await query(`
                INSERT INTO tags (name_en, name_bg, slug)
                VALUES ($1, $2, $3)
                ON CONFLICT (name_en) DO UPDATE SET
                    name_bg = COALESCE(EXCLUDED.name_bg, tags.name_bg),
                    updated_at = NOW()
            `, [name_en, name_bg || null, slug]);

            return NextResponse.json({ success: true });
        }

        if (body.action === 'delete') {
            const { name_en } = body;
            // Remove from tags table
            await query(`DELETE FROM tags WHERE name_en = $1`, [name_en]);

            // Remove from all products
            await query(`
                UPDATE products 
                SET tags = array_remove(tags, $1),
                    updated_at = NOW()
                WHERE $1 = ANY(tags)
            `, [name_en]);

            await query(`
                UPDATE product_translations 
                SET tags = array_remove(tags, $1),
                    updated_at = NOW()
                WHERE $1 = ANY(tags)
            `, [name_en]);

            return NextResponse.json({ success: true });
        }

        if (body.action === 'merge') {
            // Merge two tags into one
            const { sourceTag, targetTag } = body;

            // Replace source with target in all products
            await query(`
                UPDATE products 
                SET tags = array_replace(tags, $1, $2),
                    updated_at = NOW()
                WHERE $1 = ANY(tags)
            `, [sourceTag, targetTag]);

            await query(`
                UPDATE product_translations 
                SET tags = array_replace(tags, $1, $2),
                    updated_at = NOW()
                WHERE $1 = ANY(tags)
            `, [sourceTag, targetTag]);

            // Remove source from master table
            await query(`DELETE FROM tags WHERE name_en = $1`, [sourceTag]);

            return NextResponse.json({ success: true, message: `Merged "${sourceTag}" into "${targetTag}"` });
        }

        // Default: Update Translation or Rename EN
        const { oldTagEn, newTagBg, newTagEn } = body;

        if (!oldTagEn) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        const effectiveNewTagEn = newTagEn || oldTagEn;

        // 1. Update Master Table
        await query(`
            UPDATE tags 
            SET name_en = $1, name_bg = $2, slug = $3, updated_at = NOW()
            WHERE name_en = $4
        `, [
            effectiveNewTagEn,
            newTagBg,
            effectiveNewTagEn.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
            oldTagEn
        ]);

        // 2. Propagate Rename to products.tags and product_translations.tags
        if (newTagEn && newTagEn !== oldTagEn) {
            await query(`
                UPDATE products 
                SET tags = array_replace(tags, $1, $2),
                    updated_at = NOW()
                WHERE $1 = ANY(tags)
            `, [oldTagEn, newTagEn]);

            await query(`
                UPDATE product_translations 
                SET tags = array_replace(tags, $1, $2),
                    updated_at = NOW()
                WHERE language_code = 'en' AND $1 = ANY(tags)
            `, [oldTagEn, newTagEn]);

            await query(`
                UPDATE product_translations 
                SET tags = array_replace(tags, $1, $2),
                    updated_at = NOW()
                WHERE language_code = 'bg' AND $1 = ANY(tags)
            `, [oldTagEn, newTagEn]);
        }

        // 3. Update Bulgarian Translations in product_translations
        const { rows: products } = await query(`
            SELECT p.id, pt_en.tags as tags_en, pt_bg.tags as tags_bg
            FROM products p
            JOIN product_translations pt_en ON p.id = pt_en.product_id AND pt_en.language_code = 'en'
            LEFT JOIN product_translations pt_bg ON p.id = pt_bg.product_id AND pt_bg.language_code = 'bg'
            WHERE $1 = ANY(pt_en.tags)
        `, [effectiveNewTagEn]);

        let updatedCount = 0;
        for (const prod of products) {
            const indices = (prod.tags_en || []).map((t: string, i: number) => t === effectiveNewTagEn ? i : -1).filter((i: number) => i !== -1);
            if (!indices.length) continue;

            let tagsBg = [...(prod.tags_bg || [])];
            if (tagsBg.length < prod.tags_en.length) {
                tagsBg = [...tagsBg, ...new Array(prod.tags_en.length - tagsBg.length).fill('')];
            }

            let changed = false;
            indices.forEach((idx: number) => {
                if (tagsBg[idx] !== newTagBg) {
                    tagsBg[idx] = newTagBg;
                    changed = true;
                }
            });

            if (changed) {
                await query(`
                    INSERT INTO product_translations (product_id, language_code, tags, updated_at)
                    VALUES ($1, 'bg', $2, NOW())
                    ON CONFLICT (product_id, language_code) DO UPDATE SET tags = $2
                `, [prod.id, tagsBg]);
                updatedCount++;
            }
        }

        return NextResponse.json({ success: true, updatedCount });

    } catch (error: any) {
        console.error('Failed to update tag', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Helper function to sync tags from products to master table
async function syncTagsFromProducts() {
    try {
        // 1. Fetch all products with translations
        const { rows: products } = await query(`
            SELECT 
                p.id,
                pt_en.tags as tags_en,
                pt_bg.tags as tags_bg
            FROM products p
            LEFT JOIN product_translations pt_en ON p.id = pt_en.product_id AND pt_en.language_code = 'en'
            LEFT JOIN product_translations pt_bg ON p.id = pt_bg.product_id AND pt_bg.language_code = 'bg'
            WHERE pt_en.tags IS NOT NULL AND array_length(pt_en.tags, 1) > 0
        `);

        const tagMap = new Map<string, string>(); // EN -> BG
        const allEnTags = new Set<string>();

        products.forEach((prod: any) => {
            const enTags: string[] = prod.tags_en || [];
            const bgTags: string[] = prod.tags_bg || [];

            enTags.forEach((tagEn, index) => {
                if (!tagEn) return;
                const trimmedEn = tagEn.trim();
                allEnTags.add(trimmedEn);

                const tagBg = bgTags[index];
                if (tagBg && tagBg.trim() && !tagMap.has(trimmedEn)) {
                    tagMap.set(trimmedEn, tagBg.trim());
                }
            });
        });

        // 2. Ensure tags table exists
        await query(`
            CREATE TABLE IF NOT EXISTS tags (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name_en TEXT UNIQUE NOT NULL,
                name_bg TEXT,
                slug TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        `);

        // 3. Upsert all tags
        let syncedCount = 0;
        for (const tagEn of allEnTags) {
            const tagBg = tagMap.get(tagEn) || null;
            const slug = tagEn.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

            await query(`
                INSERT INTO tags (name_en, name_bg, slug)
                VALUES ($1, $2, $3)
                ON CONFLICT (name_en) 
                DO UPDATE SET 
                    name_bg = COALESCE(EXCLUDED.name_bg, tags.name_bg),
                    updated_at = NOW()
            `, [tagEn, tagBg, slug]);

            syncedCount++;
        }

        return NextResponse.json({
            success: true,
            message: `Synced ${syncedCount} tags to master table`,
            details: {
                uniqueEnTags: allEnTags.size,
                translationsFound: tagMap.size
            }
        });

    } catch (error: any) {
        console.error('Tag Sync Failed:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
