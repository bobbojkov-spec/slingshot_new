import { NextRequest, NextResponse } from 'next/server';
import { deleteBlock, updateBlock } from '@/lib/pagesNewBlocksDb';

const success = (data: unknown) => NextResponse.json({ ok: true, data });

const failure = (message: string, status = 400) =>
    NextResponse.json({ ok: false, error: message }, { status });

const parseBlockId = (blockId?: string) => {
    if (!blockId) {
        throw new Error('Missing blockId');
    }

    const numBlockId = Number(blockId);
    if (Number.isNaN(numBlockId) || numBlockId <= 0) {
        throw new Error('Invalid blockId');
    }

    return numBlockId;
};

export async function PATCH(
    request: NextRequest,
    context: { params: Promise<{ blockId: string }> }
) {
    const { blockId } = await context.params;

    if (!blockId) {
        return NextResponse.json(
            { ok: false, error: 'Missing blockId' },
            { status: 400 }
        );
    }

    try {
        const parsedBlockId = parseBlockId(blockId);
        const payload = await request.json();
        const updates: { data?: Record<string, unknown>; enabled?: boolean } = {};

        if (payload.data !== undefined) {
            updates.data = payload.data;
        }

        if (payload.enabled !== undefined) {
            updates.enabled = Boolean(payload.enabled);
        }

        const block = await updateBlock(parsedBlockId, updates);
        return success(block);
    } catch (error) {
        return failure(error instanceof Error ? error.message : 'Failed to update block', 500);
    }
}

export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ blockId: string }> }
) {
    const { blockId } = await context.params;

    try {
        const parsedBlockId = parseBlockId(blockId);
        await deleteBlock(parsedBlockId);
        return success({ id: parsedBlockId });
    } catch (error) {
        return failure(error instanceof Error ? error.message : 'Failed to delete block', 500);
    }
}
