import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string; colorId: string }> }) {
    try {
        const { colorId } = await params;
        await query(`DELETE FROM product_colors WHERE id = $1`, [colorId]);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string; colorId: string }> }) {
    try {
        const { colorId } = await params;
        const body = await req.json();
        const { name, display_order } = body;

        // Build dynamic query
        const updates = [];
        const values = [];
        let idx = 1;

        if (name !== undefined) {
            updates.push(`name = $${idx++}`);
            values.push(name);
        }
        if (display_order !== undefined) {
            updates.push(`display_order = $${idx++}`);
            values.push(display_order);
        }

        values.push(colorId);

        const res = await query(
            `UPDATE product_colors SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
            values
        );

        return NextResponse.json({ color: res.rows[0] });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
