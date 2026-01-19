
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

        // Fetch all unique tags from both tables
        const tags = await query(`
            SELECT DISTINCT tag
            FROM (
                SELECT unnest(tags) as tag FROM products WHERE status = 'active'
                UNION
                SELECT unnest(pt_bg.tags) as tag 
                FROM product_translations pt_bg
                JOIN products p ON pt_bg.product_id = p.id
                WHERE p.status = 'active' AND pt_bg.language_code = 'bg'
                UNION
                SELECT unnest(pt_en.tags) as tag 
                FROM product_translations pt_en
                JOIN products p ON pt_en.product_id = p.id
                WHERE p.status = 'active' AND pt_en.language_code = 'en'
            ) as t
            WHERE tag IS NOT NULL AND tag != ''
        `);

        return NextResponse.json({
            collections: collections.rows,
            tags: tags.rows.map(r => r.tag)
        });

    } catch (error) {
        console.error('Preload search data failed:', error);
        return NextResponse.json({ error: 'Failed to preload' }, { status: 500 });
    }
}
