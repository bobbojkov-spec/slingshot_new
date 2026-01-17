import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, image_path, display_order } = body;

    const res = await query(
      `INSERT INTO product_colors (product_id, name, image_path, display_order)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [id, name, image_path, display_order || 0]
    );

    return NextResponse.json({ color: res.rows[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const res = await query(
      `SELECT * FROM product_colors WHERE product_id = $1 ORDER BY display_order ASC`,
      [id]
    );
    return NextResponse.json({ colors: res.rows });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
