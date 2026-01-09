import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// Helper removed as params are now async and destructuring is preferred inline
// or we can make helper async if needed, but inline is cleaner for Next.js 15 patterns


export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: productId } = await params;
  if (!productId) {
    return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
  }

  try {
    const { rows: colors = [] } = await query(
      `
        SELECT id, product_id, name_en, name_bg, hex_color, position, is_visible, created_at, updated_at
        FROM product_colors
        WHERE product_id = $1
        ORDER BY position ASC, name_en ASC
      `,
      [productId]
    );

    return NextResponse.json({ colors });
  } catch (error: any) {
    console.error('Failed to load product colors', error);
    return NextResponse.json(
      { error: error?.message || 'Unable to fetch colors' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: productId } = await params;
  console.log('[colors route] url=', req.url);
  console.log('[colors route] params.id=', productId);
  if (!productId) {
    return NextResponse.json(
      { error: 'Product ID required', url: req.url, params },
      { status: 400 }
    );
  }

  try {
    const body = await req.json();
    console.log('[colors POST] productId=', productId);
    console.log('[colors POST] body=', body);
    const { name_en, name_bg, hex_color, position } = body;
    if (!name_en || !name_bg) {
      return NextResponse.json(
        { error: 'name_en and name_bg are required', received: body },
        { status: 400 }
      );
    }

    const { rows: colorRows } = await query(
      `
        INSERT INTO product_colors (product_id, name_en, name_bg, hex_color, position, is_visible, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, TRUE, NOW(), NOW())
        RETURNING id, product_id, name_en, name_bg, hex_color, position, is_visible, created_at, updated_at
      `,
      [productId, name_en, name_bg, hex_color || '#000000', position ?? 0]
    );

    const color = colorRows[0];

    const { rows: availabilityRows = [] } = await query(
      `
        INSERT INTO product_variant_availability (variant_id, color_id, stock_qty, is_active, created_at, updated_at)
        SELECT id, $1, 0, false, NOW(), NOW()
        FROM product_variants
        WHERE product_id = $2
        ON CONFLICT (variant_id, color_id) DO NOTHING
        RETURNING *
      `,
      [color.id, productId]
    );

    return NextResponse.json({ color, availability: availabilityRows });
  } catch (error: any) {
    console.error('Failed to create product color', error);
    return NextResponse.json({ error: error?.message || 'Unable to create color' }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: productId } = await params;
  if (!productId) {
    return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
  }

  try {
    const { colorId, name_en, name_bg, hex_color, position, is_visible } = await req.json();
    if (!colorId) {
      return NextResponse.json({ error: 'colorId required' }, { status: 400 });
    }

    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (name_en !== undefined) {
      updates.push(`name_en = $${idx++}`);
      values.push(name_en);
    }
    if (name_bg !== undefined) {
      updates.push(`name_bg = $${idx++}`);
      values.push(name_bg);
    }
    if (hex_color !== undefined) {
      updates.push(`hex_color = $${idx++}`);
      values.push(hex_color);
    }
    if (position !== undefined) {
      updates.push(`position = $${idx++}`);
      values.push(position);
    }
    if (is_visible !== undefined) {
      updates.push(`is_visible = $${idx++}`);
      values.push(is_visible);
    }

    if (!updates.length) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    updates.push('updated_at = NOW()');
    values.push(colorId);
    values.push(productId);

    const { rows: updatedRows } = await query(
      `
        UPDATE product_colors
        SET ${updates.join(', ')}
        WHERE id = $${idx++} AND product_id = $${idx}
        RETURNING id, product_id, name_en, name_bg, hex_color, position, is_visible, created_at, updated_at
      `,
      values
    );

    if (!updatedRows.length) {
      return NextResponse.json({ error: 'Color not found' }, { status: 404 });
    }

    const updatedColor = updatedRows[0];

    if (is_visible === true) {
      await query(
        `
          INSERT INTO product_variant_availability (variant_id, color_id, stock_qty, is_active, created_at, updated_at)
          SELECT id, $1, 0, false, NOW(), NOW()
          FROM product_variants
          WHERE product_id = $2
          ON CONFLICT (variant_id, color_id) DO NOTHING
        `,
        [colorId, productId]
      );
    }

    return NextResponse.json({ color: updatedColor });
  } catch (error: any) {
    console.error('Failed to edit product color', error);
    return NextResponse.json({ error: error?.message || 'Unable to update color' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: productId } = await params;
  if (!productId) {
    return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
  }

  try {
    const { colorId } = await req.json();
    if (!colorId) {
      return NextResponse.json({ error: 'colorId required' }, { status: 400 });
    }

    const { rows: deletedRows } = await query(
      `
        DELETE FROM product_colors
        WHERE id = $1 AND product_id = $2
        RETURNING id
      `,
      [colorId, productId]
    );

    if (!deletedRows.length) {
      return NextResponse.json({ error: 'Color not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete product color', error);
    return NextResponse.json({ error: error?.message || 'Unable to delete color' }, { status: 500 });
  }
}

