import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/connection';

// POST /api/hero-slides/fix-orders - Fix hero slide orders to be sequential (0, 1, 2, ...)
export async function POST(request: NextRequest) {
    try {
        // Get all hero slides ordered by current order
        const slides = await query<any>(
            'SELECT id FROM hero_slides ORDER BY "order" ASC, id ASC'
        );

        if (slides.length === 0) {
            return NextResponse.json({
                message: 'No hero slides found',
                fixed: 0
            });
        }

        // Update each slide to have sequential order starting from 0
        for (let i = 0; i < slides.length; i++) {
            await query(
                'UPDATE hero_slides SET "order" = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
                [i, slides[i].id]
            );
        }

        return NextResponse.json({
            message: `Fixed orders for ${slides.length} hero slides`,
            fixed: slides.length,
            newOrders: slides.map((_: any, index: number) => index)
        });
    } catch (error) {
        console.error('Error fixing hero slide orders:', error);
        return NextResponse.json(
            {
                error: 'Failed to fix hero slide orders',
                details: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        );
    }
}
