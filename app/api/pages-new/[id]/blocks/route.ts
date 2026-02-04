import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

const parseId = (id?: string) => {
    if (!id) throw new Error('Missing id');
    const numId = Number(id);
    if (Number.isNaN(numId) || numId <= 0) throw new Error('Invalid id');
    return numId;
};

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const pageId = parseId(id);

        const { rows } = await query(
            `SELECT id, page_id, type, position, data, enabled, created_at, updated_at
             FROM page_blocks
             WHERE page_id = $1
             ORDER BY position ASC`,
            [pageId]
        );

        // Sign media URLs
        const { getPresignedUrl } = await import('@/lib/railway/storage');
        const signedRows = await Promise.all(rows.map(async (row: any) => {
            if (!row.data) return row;
            const data = { ...row.data };

            if (data.image_url && !data.image_url.startsWith('http')) {
                try {
                    data.image_url = await getPresignedUrl(data.image_url);
                } catch (e) {
                    console.error('Failed to sign image_url', e);
                }
            }

            if (data.video_url && !data.video_url.startsWith('http')) {
                try {
                    data.video_url = await getPresignedUrl(data.video_url);
                } catch (e) {
                    console.error('Failed to sign video_url', e);
                }
            }

            return { ...row, data };
        }));

        return NextResponse.json({ ok: true, data: signedRows });
    } catch (error) {
        console.error('BLOCKS GET FAILED:', error);
        return NextResponse.json(
            { ok: false, error: 'Failed to load blocks' },
            { status: 500 }
        );
    }
}

export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const pageId = parseId(id);
        const payload = await request.json();

        const type = payload.type;
        if (!['HERO', 'TEXT', 'TEXT_IMAGE'].includes(type)) {
            return NextResponse.json(
                { ok: false, error: 'Invalid block type' },
                { status: 400 }
            );
        }

        // Get next position
        const { rows: posRows } = await query(
            'SELECT COALESCE(MAX(position), 0) AS max_pos FROM page_blocks WHERE page_id = $1',
            [pageId]
        );
        const nextPosition = Number(posRows[0]?.max_pos ?? 0) + 1;

        const data = payload.data || {};

        const { rows } = await query(
            `INSERT INTO page_blocks (page_id, type, position, data, enabled)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, page_id, type, position, data, enabled, created_at, updated_at`,
            [pageId, type, nextPosition, JSON.stringify(data), true]
        );

        return NextResponse.json({ ok: true, data: rows[0] });
    } catch (error) {
        console.error('BLOCKS POST FAILED:', error);
        return NextResponse.json(
            { ok: false, error: 'Failed to create block' },
            { status: 500 }
        );
    }
}
