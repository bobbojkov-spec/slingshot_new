import { NextRequest, NextResponse } from 'next/server';
import { reorderBlocks } from '@/lib/pagesNewBlocksDb';

const success = (data: unknown) => NextResponse.json({ ok: true, data });
const failure = (message: string, status = 400) =>
    NextResponse.json({ ok: false, error: message }, { status });

const parsePageId = (id?: string) => {
    if (!id) {
        throw new Error('Missing pageId');
    }

    const pageId = Number(id);
    if (Number.isNaN(pageId) || pageId <= 0) {
        throw new Error('Invalid pageId');
    }

    return pageId;
};

export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id?: string }> }
) {
    try {
        const { id } = await context.params;
        const pageId = parsePageId(id);
        const payload = await request.json();
        const orderedBlockIds = Array.isArray(payload?.orderedBlockIds)
            ? payload.orderedBlockIds.map((id: string | number) => Number(id))
            : [];

        if (!orderedBlockIds.length) {
            return failure('Ordered block list is required');
        }

        const blocks = await reorderBlocks(pageId, orderedBlockIds);
        return success(blocks);
    } catch (error) {
        return failure(error instanceof Error ? error.message : 'Failed to reorder blocks', 500);
    }
}
