import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
    try {
        const result = await query(
            `SELECT 
                c.id, 
                COALESCE(ct.title, c.title) as title,
                c.slug,
                c.source
             FROM collections c
             LEFT JOIN collection_translations ct ON ct.collection_id = c.id AND ct.language_code = 'en'
             ORDER BY title ASC`
        );

        return NextResponse.json({
            collections: result.rows
        });
    } catch (error: any) {
        console.error('Error fetching collections for search:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch collections' },
            { status: 500 }
        );
    }
}
