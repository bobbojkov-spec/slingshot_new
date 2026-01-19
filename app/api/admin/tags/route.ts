
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET: Fetch all tags from the centralized 'tags' table
export async function GET() {
    try {
        const { rows } = await query(`
            SELECT name_en as en, name_bg as bg, 
            (SELECT COUNT(*) FROM products p, unnest(p.tags) as t WHERE t = tags.name_en AND p.status = 'active') as count
            FROM tags 
            ORDER BY name_en ASC
        `);

        // Note: Count query above is approximate (only checks generic tags column, not joined/translated logic thoroughly 
        // but sufficient for 'usage' indicator).
        // Actually, we should check generic `products.tags` (which is usually the EN tags).

        return NextResponse.json({ tags: rows });
    } catch (error: any) {
        console.error('Failed to fetch tags', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST: Update a tag's translation OR create a new tag
export async function POST(req: Request) {
    try {
        const body = await req.json();

        // Handling both "Update Translation" and "Create/Rename" scenarios
        // Current Admin UI mimics: { oldTagEn, newTagBg } for translation update
        // We really want: { id?, name_en, name_bg } but let's stick to user request "manageable".

        if (body.action === 'create') {
            const { name_en, name_bg } = body;
            await query(`
                INSERT INTO tags (name_en, name_bg, slug)
                VALUES ($1, $2, $3)
                ON CONFLICT (name_en) DO NOTHING
            `, [name_en, name_bg, name_en.toLowerCase().replace(/[^a-z0-9]+/g, '-')]);
            return NextResponse.json({ success: true });
        }

        if (body.action === 'delete') {
            const { name_en } = body;
            // Remove from tags table
            await query(`DELETE FROM tags WHERE name_en = $1`, [name_en]);
            // Optional: Remove from all products? The user said "remove products too much chaos".
            // Deleting a tag from master list doesn't necessarily mean scrubbing it from all historical data unless requested.
            // But usually "Delete" means "Kill it".
            // Let's remove from products arrays too?
            // "Remove it from ALL products" was in the previous UI confirmation.
            await query(`
                UPDATE products 
                SET tags = array_remove(tags, $1) 
                WHERE $1 = ANY(tags)
             `, [name_en]);
            await query(`
                UPDATE product_translations 
                SET tags = array_remove(tags, $1) 
                WHERE $1 = ANY(tags)
             `, [name_en]); // Remove from translations too (generic approach)

            return NextResponse.json({ success: true });
        }

        // Default: Update Translation (legacy prop names supported for minimal frontend change, or we adapt frontend)
        // Frontend sends: { oldTagEn, newTagBg }
        const { oldTagEn, newTagBg } = body;

        if (!oldTagEn || newTagBg === undefined) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        // 1. Update Master Table
        await query(`
            UPDATE tags 
            SET name_bg = $2, updated_at = NOW()
            WHERE name_en = $1
        `, [oldTagEn, newTagBg]);

        // 2. Propagate to Product Translations (BG)
        // Find all products with this EN tag, and update their BG tag array at corresponding index?
        // OR better: Just update the `tags` array in `product_translations` where language='bg'.
        // But `tags` is just text array. We need to match by index from EN array?
        // This is complex. 
        // SIMPLIFICATION: We rely on the Sync. 
        // If we update the master definition, the products still hold the OLD value?
        // Yes, `product_translations` stores the actual strings.
        // We should try to update them.

        // Fetch products with this tag
        const { rows: products } = await query(`
            SELECT p.id, pt_en.tags as tags_en, pt_bg.tags as tags_bg
            FROM products p
            JOIN product_translations pt_en ON p.id = pt_en.product_id AND pt_en.language_code = 'en'
            LEFT JOIN product_translations pt_bg ON p.id = pt_bg.product_id AND pt_bg.language_code = 'bg'
            WHERE $1 = ANY(pt_en.tags)
        `, [oldTagEn]);

        let updatedCount = 0;
        for (const prod of products) {
            const indices = (prod.tags_en || []).map((t: string, i: number) => t === oldTagEn ? i : -1).filter((i: number) => i !== -1);
            if (!indices.length) continue;

            let tagsBg = [...(prod.tags_bg || [])];
            // ensure length
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
