import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

function slugify(input: string | undefined) {
  return (input || '')
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function GET() {
  try {
    const { rows } = await query(
      `
        SELECT id, name_en, name_bg, slug, position, is_active
        FROM activity_categories
        ORDER BY position ASC, name_en ASC
      `,
    );
    return NextResponse.json({ activityCategories: rows });
  } catch (error: any) {
    console.error('Failed to load activity categories', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to load activity categories' },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const { name_en, name_bg, slug, position, is_active } = await req.json();

    if (!name_en || !name_bg) {
      return NextResponse.json(
        { error: 'name_en and name_bg are required' },
        { status: 400 },
      );
    }

    const finalSlug = slugify(slug || name_en);

    const { rows } = await query(
      `
        INSERT INTO activity_categories (name_en, name_bg, slug, position, is_active, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        RETURNING id, name_en, name_bg, slug, position, is_active
      `,
      [name_en, name_bg, finalSlug, position ?? 0, is_active ?? true],
    );

    return NextResponse.json({ activityCategory: rows[0] });
  } catch (error: any) {
    console.error('Failed to create activity category', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to create activity category' },
      { status: 500 },
    );
  }
}

export async function PUT(req: Request) {
  try {
    const { id, name_en, name_bg, slug, position, is_active } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'id required' }, { status: 400 });
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (name_en !== undefined) {
      updates.push(`name_en = $${paramIndex++}`);
      values.push(name_en);
    }
    if (name_bg !== undefined) {
      updates.push(`name_bg = $${paramIndex++}`);
      values.push(name_bg);
    }
    if (slug !== undefined) {
      updates.push(`slug = $${paramIndex++}`);
      values.push(slugify(slug));
    }
    if (position !== undefined) {
      updates.push(`position = $${paramIndex++}`);
      values.push(position);
    }
    if (is_active !== undefined) {
      updates.push(`is_active = $${paramIndex++}`);
      values.push(is_active);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'At least one field must be provided to update' },
        { status: 400 },
      );
    }

    updates.push(`updated_at = NOW()`);
    const queryText = `
      UPDATE activity_categories
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, name_en, name_bg, slug, position, is_active
    `;
    values.push(id);

    const { rows } = await query(queryText, values);
    return NextResponse.json({ activityCategory: rows[0] });
  } catch (error: any) {
    console.error('Failed to update activity category', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to update activity category' },
      { status: 500 },
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: 'id required' }, { status: 400 });
    }

    await query('DELETE FROM activity_categories WHERE id = $1', [id]);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete activity category', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to delete activity category' },
      { status: 500 },
    );
  }
}

