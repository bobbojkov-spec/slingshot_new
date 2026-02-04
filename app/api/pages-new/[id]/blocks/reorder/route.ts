import { NextRequest, NextResponse } from 'next/server';
import { query, transaction } from '@/lib/db';

const parseId = (id?: string) => {
    if (!id) throw new Error('Missing id');
    const numId = Number(id);
    if (Number.isNaN(numId) || numId <= 0) throw new Error('Invalid id');
    return numId;
};

export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const pageId = parseId(id);
        const payload = await request.json();

        const blockIds = Array.isArray(payload.blockIds) ? payload.blockIds : [];

        if (blockIds.length === 0) {
            return NextResponse.json(
                { ok: false, error: 'No block IDs provided' },
                { status: 400 }
            );
        }

        // Update positions
        await transaction(async (client) => {
            for (let i = 0; i < blockIds.length; i++) {
                await client.query(
                    'UPDATE page_blocks SET position = $1 WHERE id = $2 AND page_id = $3',
                    [i + 1, blockIds[i], pageId]
                );
            }
        });

        return NextResponse.json({ ok: true, data: { reordered: blockIds.length } });
    } catch (error) {
        console.error('BLOCKS REORDER FAILED:', error);
        return NextResponse.json(
            { ok: false, error: 'Failed to reorder blocks' },
            { status: 500 }
        );
    }
}
