import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await req.json();
        const { images } = body; // Array of image paths

        if (!images || !Array.isArray(images)) {
            return NextResponse.json({ error: 'Images array is required' }, { status: 400 });
        }

        // Get current max display order
        const { rows: maxRows } = await query(
            'SELECT MAX(display_order) as max_order FROM product_colors WHERE product_id = $1',
            [id]
        );
        let nextOrder = (maxRows[0]?.max_order ?? -1) + 1;

        const insertedColors = [];
        for (const image_path of images) {
            const res = await query(
                `INSERT INTO product_colors (product_id, name, image_path, display_order)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
                [id, 'New Color', image_path, nextOrder++]
            );
            insertedColors.push(res.rows[0]);
        }

        return NextResponse.json({ colors: insertedColors });
    } catch (error: any) {
        console.error('Bulk color addition failed:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
