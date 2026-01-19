
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/dbPg';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    if (!slug) return NextResponse.json({ error: 'slug required' });

    try {
        const result = await query(
            `SELECT * FROM collections WHERE slug = $1`,
            [slug]
        );
        return NextResponse.json({
            found: result.rows.length > 0,
            data: result.rows[0]
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message });
    }
}
