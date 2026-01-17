import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET /api/admin/tags/products?tag=...
// Returns all products that currently have this exact tag (in EN)
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const tag = searchParams.get('tag');

        if (!tag) {
            return NextResponse.json({ error: 'Missing tag parameter' }, { status: 400 });
        }

        const { rows } = await query(`
            SELECT 
                p.id,
                COALESCE(pt_en.title, p.title) as name,
                p.handle as slug,
                COALESCE(pt_en.tags, p.tags) as tags,
                (SELECT medium_path FROM product_images WHERE product_id = p.id AND is_hero = true LIMIT 1) as thumbnail_url
            FROM products p
            LEFT JOIN product_translations pt_en ON p.id = pt_en.product_id AND pt_en.language_code = 'en'
            WHERE $1 = ANY(COALESCE(pt_en.tags, p.tags))
        `, [tag]);

        return NextResponse.json({ products: rows });
    } catch (error: any) {
        console.error('Failed to fetch tag products', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PUT /api/admin/tags/products
// body: { tagEn: string, productIds: string[] }
// This will ENSURE that only these products have this tag. 
// It adds to new ones, removes from others that HAD it.
export async function PUT(req: Request) {
    try {
        const { tagEn, productIds } = await req.json();

        if (!tagEn) {
            return NextResponse.json({ error: 'Missing tagEn' }, { status: 400 });
        }

        // 1. Get all products that currently have this tag
        const { rows: currentProducts } = await query(`
            SELECT p.id 
            FROM products p
            LEFT JOIN product_translations pt_en ON p.id = pt_en.product_id AND pt_en.language_code = 'en'
            WHERE $1 = ANY(COALESCE(pt_en.tags, p.tags))
        `, [tagEn]);

        const currentIds = new Set(currentProducts.map(p => p.id));
        const targetIds = new Set(productIds || []);

        // Products to ADD tag to
        const toAdd = Array.from(targetIds).filter(id => !currentIds.has(id));
        // Products to REMOVE tag from
        const toRemove = Array.from(currentIds).filter(id => !targetIds.has(id));

        // Find a representative BG translation for this EN tag if it exists in any product
        let tagBg: string | null = null;
        const { rows: existingTags } = await query(`
            SELECT pt_bg.tags[array_position(pt_en.tags, $1)] as bg_tag
            FROM product_translations pt_en
            JOIN product_translations pt_bg ON pt_en.product_id = pt_bg.product_id 
                AND pt_en.language_code = 'en' AND pt_bg.language_code = 'bg'
            WHERE $1 = ANY(pt_en.tags)
            AND pt_bg.tags[array_position(pt_en.tags, $1)] IS NOT NULL
            LIMIT 1
        `, [tagEn]);
        if (existingTags.length > 0) {
            tagBg = existingTags[0].bg_tag;
        }

        // Let's handle Additions
        for (const id of toAdd) {
            // Fetch current tags for EN and BG
            const { rows: trans } = await query(`SELECT language_code, tags FROM product_translations WHERE product_id = $1`, [id]);
            const enTrans = trans.find(t => t.language_code === 'en');
            const bgTrans = trans.find(t => t.language_code === 'bg');

            // Add to EN
            const enTags = enTrans?.tags || [];
            if (!enTags.includes(tagEn)) {
                const newEnTags = [...enTags, tagEn];
                await query(`
                    INSERT INTO product_translations (product_id, language_code, tags, updated_at)
                    VALUES ($1, 'en', $2, NOW())
                    ON CONFLICT (product_id, language_code) DO UPDATE SET tags = $2, updated_at = NOW()
                `, [id, newEnTags]);
            }

            // Add to BG if we found a translation
            if (tagBg) {
                const bgTags = bgTrans?.tags || [];
                // We usually try to keep them index-aligned. 
                // If we appended to EN, we should append to BG.
                if (!bgTags.includes(tagBg)) {
                    // Make sure BG array is at least as long as new EN array if we want strict alignment, 
                    // but simple append is a good start.
                    const newBgTags = [...bgTags, tagBg];
                    await query(`
                        INSERT INTO product_translations (product_id, language_code, tags, updated_at)
                        VALUES ($1, 'bg', $2, NOW())
                        ON CONFLICT (product_id, language_code) DO UPDATE SET tags = $2, updated_at = NOW()
                    `, [id, newBgTags]);
                }
            }
        }

        // Let's handle Removals
        for (const id of toRemove) {
            const { rows: trans } = await query(`SELECT language_code, tags FROM product_translations WHERE product_id = $1`, [id]);
            for (const t of trans) {
                const newTags = (t.tags || []).filter((tag: string) => tag !== tagEn);
                await query(`
                    UPDATE product_translations SET tags = $1, updated_at = NOW()
                    WHERE product_id = $2 AND language_code = $3
                `, [newTags, id, t.language_code]);
            }
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Failed to update tag products', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE /api/admin/tags/products
// body: { tagEn: string }
// Removes the tag from ALL products
export async function DELETE(req: Request) {
    try {
        const { tagEn } = await req.json();

        if (!tagEn) {
            return NextResponse.json({ error: 'Missing tagEn' }, { status: 400 });
        }

        // Remove from all product_translations where it exists in tags
        await query(`
            UPDATE product_translations 
            SET tags = array_remove(tags, $1),
                updated_at = NOW()
            WHERE $1 = ANY(tags)
        `, [tagEn]);

        // Also from products table if it exists there
        await query(`
            UPDATE products 
            SET tags = array_remove(tags, $1),
                updated_at = NOW()
            WHERE $1 = ANY(tags)
        `, [tagEn]);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Failed to delete tag', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
