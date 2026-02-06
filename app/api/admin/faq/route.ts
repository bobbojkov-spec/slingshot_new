
import { NextResponse } from 'next/server';
import { getFaqItems, createFaqItem, updateFaqItem, deleteFaqItem, reorderFaqItems } from '@/lib/db/repositories/faq';

export async function GET() {
    try {
        const items = await getFaqItems(false);
        return NextResponse.json({ ok: true, data: items });
    } catch (error: any) {
        return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { action, ...data } = body;

        if (action === 'reorder') {
            await reorderFaqItems(data.updates); // Expects { updates: { id, sort_order }[] }
            return NextResponse.json({ ok: true });
        }

        const id = await createFaqItem(data);
        return NextResponse.json({ ok: true, data: { id, ...data } });
    } catch (error: any) {
        return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const { id, ...updates } = body;

        if (!id) throw new Error('ID required for update');

        await updateFaqItem(id, updates);
        return NextResponse.json({ ok: true });
    } catch (error: any) {
        return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) throw new Error('ID required for deletion');

        await deleteFaqItem(Number(id));
        return NextResponse.json({ ok: true });
    } catch (error: any) {
        return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
}
