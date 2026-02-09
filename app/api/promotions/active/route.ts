import { NextResponse } from 'next/server';
import { promotionsRepository } from '@/lib/db/repositories/promotions';

export async function GET() {
    try {
        const promotions = await promotionsRepository.getActivePromotions();
        return NextResponse.json({ promotions });
    } catch (error) {
        console.error('Error fetching active promotions:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
