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
            `SELECT id, page_id, type, position, data, enabled, created_at, updated_at
       FROM page_blocks WHERE id = $1`,
            [numId]
        );

        if (!rows.length) {
            return NextResponse.json(
                { ok: false, error: 'Block not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ ok: true, data: rows[0] });
    } catch (error) {
        return NextResponse.json(
            { ok: false, error: 'Failed to load block' },
            { status: 500 }
        );
    }
}

export async function PATCH(
    request: NextRequest,
    context: { params: Promise<{ blockId: string }> }
) {
    try {
        const { blockId } = await context.params;
        const numId = parseId(blockId);
        const payload = await request.json();

        const updates: string[] = [];
        const values: unknown[] = [];
        let paramIndex = 1;

        if (payload.data !== undefined) {
            updates.push(`data = $${paramIndex++}`);
            values.push(JSON.stringify(payload.data));
        }

        if (payload.enabled !== undefined) {
            updates.push(`enabled = $${paramIndex++}`);
            values.push(Boolean(payload.enabled));
        }

        if (updates.length === 0) {
            return NextResponse.json(
                { ok: false, error: 'No updates provided' },
                { status: 400 }
            );
        }

        values.push(numId);

        const { rows } = await query(
            `UPDATE page_blocks
       SET ${updates.join(', ')}, updated_at = NOW()
       WHERE id = $${paramIndex}
       RETURNING id, page_id, type, position, data, enabled, created_at, updated_at`,
            values
        );

        if (!rows.length) {
            return NextResponse.json(
                { ok: false, error: 'Block not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ ok: true, data: rows[0] });
    } catch (error) {
        console.error('BLOCK PATCH FAILED:', error);
        return NextResponse.json(
            { ok: false, error: 'Failed to update block' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ blockId: string }> }
) {
    try {
        const { blockId } = await context.params;
        const numId = parseId(blockId);

        const { rows } = await query(
            'DELETE FROM page_blocks WHERE id = $1 RETURNING id',
            [numId]
        );

        if (!rows.length) {
            return NextResponse.json(
                { ok: false, error: 'Block not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ ok: true, data: { id: numId } });
    } catch (error) {
        return NextResponse.json(
            { ok: false, error: 'Failed to delete block' },
            { status: 500 }
        );
    }
}
