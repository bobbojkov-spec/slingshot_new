import { NextResponse } from 'next/server';
import { promotionsRepository } from '@/lib/db/repositories/promotions';

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const promotion = await promotionsRepository.getById(params.id);
        if (!promotion) {
            return NextResponse.json({ error: 'Promotion not found' }, { status: 404 });
        }
        return NextResponse.json({ promotion });
    } catch (error) {
        console.error('Error fetching promotion:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json();
        const promotion = await promotionsRepository.update(params.id, body);
        if (!promotion) {
            return NextResponse.json({ error: 'Promotion not found' }, { status: 404 });
        }
        return NextResponse.json({ promotion });
    } catch (error) {
        console.error('Error updating promotion:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const success = await promotionsRepository.delete(params.id);
        if (!success) {
            return NextResponse.json({ error: 'Promotion not found' }, { status: 404 });
        }
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting promotion:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
