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
    context: { params: Promise<{ blockId: string }> }
) {
    try {
        const { blockId } = await context.params;
        const numId = parseId(blockId);

        const { rows } = await query(
            `SELECT pgi.id as gallery_row_id, pgi.media_id, pgi.position
       FROM page_gallery_images pgi
       WHERE pgi.block_id = $1
       ORDER BY pgi.position ASC`,
            [numId]
        );

        return NextResponse.json({ ok: true, data: rows });
    } catch (error) {
        console.error('GALLERY GET FAILED:', error);
        return NextResponse.json(
            { ok: false, error: 'Failed to load gallery images' },
            { status: 500 }
        );
    }
}

export async function POST(
    request: NextRequest,
    context: { params: Promise<{ blockId: string }> }
) {
    try {
        const { blockId } = await context.params;
        const numId = parseId(blockId);
        const payload = await request.json();

        const images = Array.isArray(payload.images) ? payload.images : [];

        if (images.length === 0) {
            return NextResponse.json(
                { ok: false, error: 'No images provided' },
                { status: 400 }
            );
        }

        // Delete existing gallery images
        await query('DELETE FROM page_gallery_images WHERE block_id = $1', [numId]);

        // Insert new images
        const insertPromises = images.map((img: { mediaId: number }, index: number) => {
            return query(
                'INSERT INTO page_gallery_images (block_id, media_id, position) VALUES ($1, $2, $3)',
                [numId, img.mediaId, index + 1]
            );
        });

        await Promise.all(insertPromises);

        // Fetch and return the updated gallery
        const { rows } = await query(
            `SELECT id as gallery_row_id, media_id, position
       FROM page_gallery_images
       WHERE block_id = $1
       ORDER BY position ASC`,
            [numId]
        );

        return NextResponse.json({ ok: true, data: rows });
    } catch (error) {
        console.error('GALLERY POST FAILED:', error);
        return NextResponse.json(
            { ok: false, error: 'Failed to save gallery images' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const galleryRowId = searchParams.get('galleryRowId');

        if (!galleryRowId) {
            return NextResponse.json(
                { ok: false, error: 'Gallery row ID required' },
                { status: 400 }
            );
        }

        const numId = parseId(galleryRowId);

        const { rows } = await query(
            'DELETE FROM page_gallery_images WHERE id = $1 RETURNING id',
            [numId]
        );

        if (!rows.length) {
            return NextResponse.json(
                { ok: false, error: 'Gallery image not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ ok: true, data: { id: numId } });
    } catch (error) {
        return NextResponse.json(
            { ok: false, error: 'Failed to delete gallery image' },
            { status: 500 }
        );
    }
}
