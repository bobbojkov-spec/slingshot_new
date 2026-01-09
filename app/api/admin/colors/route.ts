import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { randomUUID } from 'crypto';

const COLORS_TABLE = 'shared_colors';

async function ensureColorsTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS ${COLORS_TABLE} (
      id UUID PRIMARY KEY,
      name_en TEXT NOT NULL,
      name_bg TEXT,
      hex_color TEXT NOT NULL,
      position INT NOT NULL DEFAULT 0,
      created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
    )
  `);
  await query(`
    ALTER TABLE product_colors
    ADD COLUMN IF NOT EXISTS color_id UUID
  `);
}

async function fetchColors() {
  const { rows } = await query(`
    SELECT
      c.id,
      c.name_en,
      c.name_bg,
      c.hex_color,
      c.position,
      c.created_at,
      c.updated_at,
      (
        SELECT COUNT(*) FROM product_colors pc WHERE pc.color_id = c.id
      )::INT AS usage_count
    FROM ${COLORS_TABLE} c
    ORDER BY c.position ASC, c.name_en ASC
  `);
  return rows;
}

export async function GET() {
  try {
    await ensureColorsTable();
    const colors = await fetchColors();
    return NextResponse.json({ colors });
  } catch (error: any) {
    console.error('Failed to load colors', error);
    return NextResponse.json(
      { error: error?.message || 'Unable to load colors' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureColorsTable();
    const body = await req.json();
    const { name_en, name_bg, hex_color, position } = body;
    if (!name_en || !hex_color) {
      return NextResponse.json({ error: 'name_en and hex_color are required' }, { status: 400 });
    }

    const id = randomUUID();
    const { rows } = await query(
      `
        INSERT INTO ${COLORS_TABLE} (id, name_en, name_bg, hex_color, position, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        RETURNING id, name_en, name_bg, hex_color, position, created_at, updated_at
      `,
      [id, name_en.trim(), name_bg?.trim() || '', hex_color, position ?? 0]
    );
    const color = rows[0];
    return NextResponse.json({ color });
  } catch (error: any) {
    console.error('Failed to create color', error);
    return NextResponse.json({ error: error?.message || 'Unable to create color' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await ensureColorsTable();
    const body = await req.json();
    const { id, name_en, name_bg, hex_color, position } = body;
    if (!id) {
      return NextResponse.json({ error: 'Color id is required' }, { status: 400 });
    }

    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (name_en !== undefined) {
      updates.push(`name_en = $${idx++}`);
      values.push(name_en.trim());
    }
    if (name_bg !== undefined) {
      updates.push(`name_bg = $${idx++}`);
      values.push(name_bg.trim());
    }
    if (hex_color !== undefined) {
      updates.push(`hex_color = $${idx++}`);
      values.push(hex_color);
    }
    if (position !== undefined) {
      updates.push(`position = $${idx++}`);
      values.push(position);
    }

    if (!updates.length) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    updates.push('updated_at = NOW()');
    values.push(id);

    const { rows } = await query(
      `
        UPDATE ${COLORS_TABLE}
        SET ${updates.join(', ')}
        WHERE id = $${idx}
        RETURNING id, name_en, name_bg, hex_color, position, created_at, updated_at
      `,
      values
    );

    if (!rows.length) {
      return NextResponse.json({ error: 'Color not found' }, { status: 404 });
    }

    return NextResponse.json({ color: rows[0] });
  } catch (error: any) {
    console.error('Failed to update color', error);
    return NextResponse.json({ error: error?.message || 'Unable to update color' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await ensureColorsTable();
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: 'Color id is required' }, { status: 400 });
    }

    const { rows: usage } = await query(
      'SELECT COUNT(*)::INT AS count FROM product_colors WHERE color_id = $1',
      [id]
    );
    if (usage?.[0]?.count > 0) {
      return NextResponse.json(
        { error: 'Color is referenced by products and cannot be deleted' },
        { status: 400 }
      );
    }

    const { rows } = await query(
      `DELETE FROM ${COLORS_TABLE} WHERE id = $1 RETURNING id`,
      [id]
    );
    if (!rows.length) {
      return NextResponse.json({ error: 'Color not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete color', error);
    return NextResponse.json({ error: error?.message || 'Unable to delete color' }, { status: 500 });
  }
}

