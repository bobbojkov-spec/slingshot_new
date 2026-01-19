
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // Fetch all active collections with both names
        const collections = await query(`
            SELECT 
                c.slug, 
                c.title as title_en,
                ct.title as title_bg
            FROM collections c
            LEFT JOIN collection_translations ct ON c.id = ct.collection_id AND ct.language_code = 'bg'
            WHERE c.visible = true
        `);

        // Fetch all unique tags from both tables
        const tags = await query(`
            SELECT DISTINCT tag
            FROM (
                SELECT unnest(tags) as tag FROM products WHERE status = 'active'
                UNION
                SELECT unnest(tags) as tag FROM product_translations WHERE tags IS NOT NULL
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
