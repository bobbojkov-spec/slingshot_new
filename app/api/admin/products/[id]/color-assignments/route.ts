import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

const ensureProductColorsColumn = async () => {
  await query(`
    ALTER TABLE product_colors
    ADD COLUMN IF NOT EXISTS color_id UUID
  `);
};

export async function POST(req: NextRequest, { params }: { params: { id?: string } }) {
  const productId = params?.id;
  if (!productId) {
    return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
  }

  try {
    const { colorId, position } = await req.json();
    if (!colorId) {
      return NextResponse.json({ error: 'colorId required' }, { status: 400 });
    }

    await ensureProductColorsColumn();

    const { rows } = await query(
      `
        INSERT INTO product_colors (product_id, color_id, position, created_at, updated_at)
        VALUES ($1, $2, $3, NOW(), NOW())
        RETURNING
          id,
          color_id,
          position
      `,
      [productId, colorId, position ?? 0]
    );

    if (!rows.length) {
      return NextResponse.json({ error: 'Unable to assign color' }, { status: 500 });
    }

    const assignment = rows[0];
    const { rows: sharedRows } = await query(
      `
        SELECT id, name_en, name_bg, hex_color
        FROM shared_colors
        WHERE id = $1
      `,
      [assignment.color_id]
    );

    return NextResponse.json({
      assignment: {
        id: assignment.id,
        color_id: assignment.color_id,
        position: assignment.position,
        shared: sharedRows[0] ?? null,
      },
    });
  } catch (error: any) {
    console.error('[color assignments] POST failed', error);
    return NextResponse.json({ error: error?.message || 'Unable to assign color' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id?: string } }) {
  const productId = params?.id;
  if (!productId) {
    return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
  }

  try {
    const { assignmentId } = await req.json();
    if (!assignmentId) {
      return NextResponse.json({ error: 'assignmentId required' }, { status: 400 });
    }

    const { rows } = await query(
      `
        DELETE FROM product_colors
        WHERE id = $1 AND product_id = $2
        RETURNING id
      `,
      [assignmentId, productId]
    );

    if (!rows.length) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[color assignments] DELETE failed', error);
    return NextResponse.json({ error: error?.message || 'Unable to delete assignment' }, { status: 500 });
  }
}

