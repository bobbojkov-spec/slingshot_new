import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: productId } = await params;
  if (!productId) {
    return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
  }

  try {
    const { entries } = await req.json();
    if (!Array.isArray(entries) || entries.length === 0) {
      return NextResponse.json({ error: 'entries array required' }, { status: 400 });
    }

    const normalizedEntries = entries
      .map((entry: any) => ({
        variant_id: entry.variant_id,
        color_id: entry.color_id,
        stock_qty: Number.isFinite(entry.stock_qty) ? entry.stock_qty : 0,
        is_active: Boolean(entry.is_active),
      }))
      .filter((entry) => entry.variant_id && entry.color_id);

    if (!normalizedEntries.length) {
      return NextResponse.json({ error: 'entries must include variant_id and color_id' }, { status: 400 });
    }

    const placeholders = normalizedEntries
      .map((_, index) => {
        const base = index * 4;
        return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4})`;
      })
      .join(', ');

    const values = normalizedEntries.flatMap((entry) => [
      entry.variant_id,
      entry.color_id,
      entry.stock_qty,
      entry.is_active,
    ]);

    const { rows: upsertedRows } = await query(
      `
        INSERT INTO product_variant_availability (variant_id, color_id, stock_qty, is_active, created_at, updated_at)
        VALUES ${placeholders}
        ON CONFLICT (variant_id, color_id) DO UPDATE SET
          stock_qty = EXCLUDED.stock_qty,
          is_active = EXCLUDED.is_active,
          updated_at = NOW()
        RETURNING variant_id, color_id, stock_qty, is_active, created_at, updated_at
      `,
      values
    );

    return NextResponse.json({ entries: upsertedRows });
  } catch (error: any) {
    console.error('Failed to save variant availability', error);
    return NextResponse.json(
      { error: error?.message || 'Unable to persist availability' },
      { status: 500 }
    );
  }
}

