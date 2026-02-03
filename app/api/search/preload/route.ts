
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // Fetch all active collections with both names
        const collections = await query(`
            SELECT DISTINCT
                c.slug, 
                c.title as title_en,
                ct.title as title_bg
            FROM collections c
            JOIN collection_products cp ON c.id = cp.collection_id
            JOIN products p ON cp.product_id = p.id
            LEFT JOIN collection_translations ct ON c.id = ct.collection_id AND ct.language_code = 'bg'
            WHERE c.visible = true AND p.status = 'active'
        `);

        // Fetch all unique tags from the tags table (with EN and BG names)
        const tags = await query(`
            SELECT DISTINCT 
                tg.name_en,
                tg.name_bg
            FROM tags tg
            WHERE tg.name_en IS NOT NULL AND tg.name_en != ''
            AND EXISTS (
                SELECT 1 FROM products p
                LEFT JOIN product_translations pt ON pt.product_id = p.id
                WHERE p.status = 'active' 
                AND (
                    p.tags && ARRAY[tg.name_en, COALESCE(tg.name_bg, tg.name_en)]::text[] OR
                    pt.tags && ARRAY[tg.name_en, COALESCE(tg.name_bg, tg.name_en)]::text[]
                )
            )
        `);

        return NextResponse.json({
            collections: collections.rows,
            tags: tags.rows.map(r => ({
                name_en: r.name_en,
                name_bg: r.name_bg || r.name_en
            }))
        });

    } catch (error) {
        console.error('Preload search data failed:', error);
        return NextResponse.json({ error: 'Failed to preload' }, { status: 500 });
    }
}
