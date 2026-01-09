import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// Helper to slugify text
function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')     // Replace spaces with -
    .replace(/&/g, '-and-')   // Replace & with 'and'
    .replace(/[^\w\u0400-\u04FF-]+/g, '') // Remove all non-word chars (allowing Cyrillic)
    .replace(/--+/g, '-')     // Replace multiple - with single -
    .replace(/^-+/, '')       // Trim - from start of text
    .replace(/-+$/, '');      // Trim - from end of text
}

// GET all categories
export async function GET() {
  try {
    const { rows } = await query(`
      SELECT 
        c.*,
        (SELECT CAST(COUNT(*) AS INTEGER) FROM products p WHERE p.category_id = c.id) as product_count,
        (SELECT json_build_object('name', ct.name, 'description', ct.description)
         FROM category_translations ct 
         WHERE ct.category_id = c.id AND ct.language_code = 'en') as translation_en,
        (SELECT json_build_object('name', ct.name, 'description', ct.description)
         FROM category_translations ct 
         WHERE ct.category_id = c.id AND ct.language_code = 'bg') as translation_bg
      FROM categories c
      ORDER BY c.name ASC
    `);

    return NextResponse.json({ categories: rows });
  } catch (error: any) {
    console.error('Failed to load categories:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to load categories' },
      { status: 500 }
    );
  }
}

// CREATE new category
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, slug, description, sort_order, image_url } = body;

    if (!name) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }

    // Auto-generate slug if not provided
    const finalSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    const { rows } = await query(
      `
        INSERT INTO categories (
          name, 
          slug, 
          handle,
          description, 
          sort_order, 
          image_url,
          status,
          visible,
          created_at,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
        RETURNING *
      `,
      [name, finalSlug, finalSlug, description || null, sort_order || 0, image_url || null, 'active', true]
    );

    return NextResponse.json({ category: rows[0] });
  } catch (error: any) {
    console.error('Failed to create category:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create category' },
      { status: 500 }
    );
  }
}

// UPDATE existing category
export async function PUT(req: Request) {
  try {
    const { categoryId, data, translation_en, translation_bg } = await req.json();

    if (!categoryId) {
      return NextResponse.json({ error: 'categoryId required' }, { status: 400 });
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(data.name);
    }
    if (data.slug !== undefined) {
      updates.push(`slug = $${paramIndex++}, handle = $${paramIndex++}`);
      values.push(data.slug, data.slug);
    }
    if (data.description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(data.description);
    }
    if (data.sort_order !== undefined) {
      updates.push(`sort_order = $${paramIndex++}`);
      values.push(data.sort_order);
    }
    if (data.image_url !== undefined) {
      updates.push(`image_url = $${paramIndex++}`);
      values.push(data.image_url);
    }
    if (data.status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      values.push(data.status);
    }
    if (data.visible !== undefined) {
      updates.push(`visible = $${paramIndex++}`);
      values.push(data.visible);
    }

    updates.push(`updated_at = NOW()`);
    values.push(categoryId);

    const { rows } = await query(
      `
        UPDATE categories
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `,
      values
    );

    // Save translations if provided
    if (translation_en) {
      const enSlug = slugify(translation_en.name);
      await query(
        `
          INSERT INTO category_translations (category_id, language_code, name, slug, description, updated_at)
          VALUES ($1, 'en', $2, $3, $4, NOW())
          ON CONFLICT (category_id, language_code) DO UPDATE SET
            name = EXCLUDED.name,
            slug = EXCLUDED.slug,
            description = EXCLUDED.description,
            updated_at = NOW()
        `,
        [categoryId, translation_en.name, enSlug, translation_en.description]
      );
    }

    if (translation_bg) {
      const bgSlug = slugify(translation_bg.name);
      await query(
        `
          INSERT INTO category_translations (category_id, language_code, name, slug, description, updated_at)
          VALUES ($1, 'bg', $2, $3, $4, NOW())
          ON CONFLICT (category_id, language_code) DO UPDATE SET
            name = EXCLUDED.name,
            slug = EXCLUDED.slug,
            description = EXCLUDED.description,
            updated_at = NOW()
        `,
        [categoryId, translation_bg.name, bgSlug, translation_bg.description]
      );
    }

    return NextResponse.json({ category: rows[0] });
  } catch (error: any) {
    console.error('Failed to update category:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update category' },
      { status: 500 }
    );
  }
}

// DELETE category (only if inactive AND no products)
export async function DELETE(req: Request) {
  try {
    const { categoryId } = await req.json();

    if (!categoryId) {
      return NextResponse.json({ error: 'categoryId required' }, { status: 400 });
    }

    // Check status and product count
    const { rows: checkRows } = await query(
      `
        SELECT 
          c.status,
          CAST(COUNT(p.id) AS INTEGER) as product_count
        FROM categories c
        LEFT JOIN products p ON p.category_id = c.id
        WHERE c.id = $1
        GROUP BY c.id, c.status
      `,
      [categoryId]
    );

    if (checkRows.length === 0) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    const category = checkRows[0];

    // Check if active
    if (category.status === 'active') {
      return NextResponse.json(
        { error: 'Cannot delete active category. Set it to inactive first.' },
        { status: 400 }
      );
    }

    // Check if has products
    if (category.product_count > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete category with ${category.product_count} linked products. Remove or reassign products first.`
        },
        { status: 400 }
      );
    }

    // Safe to delete
    await query('DELETE FROM categories WHERE id = $1', [categoryId]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete category:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete category' },
      { status: 500 }
    );
  }
}

