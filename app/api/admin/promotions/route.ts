import { NextResponse } from 'next/server';
import { promotionsRepository } from '@/lib/db/repositories/promotions';

export async function GET() {
    try {
        const promotions = await promotionsRepository.getAll();
        return NextResponse.json({ promotions });
    } catch (error) {
        console.error('Error fetching promotions:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        if (!body.title) {
            return NextResponse.json({ error: 'Title is required' }, { status: 400 });
        }
        const promotion = await promotionsRepository.create(body);
        return NextResponse.json({ promotion });
    } catch (error) {
        console.error('Error creating promotion:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
