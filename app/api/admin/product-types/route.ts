import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET all product types
export async function GET() {
  try {
    const { rows } = await query(`
      SELECT 
        pt.*,
        CAST(COUNT(p.id) AS INTEGER) as product_count,
        json_build_object(
          'name', ptt_en.name,
          'description', ptt_en.description
        ) as translation_en,
        json_build_object(
          'name', ptt_bg.name,
          'description', ptt_bg.description
        ) as translation_bg
      FROM product_types pt
      LEFT JOIN products p ON p.product_type = pt.name
      LEFT JOIN product_type_translations ptt_en ON pt.id = ptt_en.product_type_id AND ptt_en.language_code = 'en'
      LEFT JOIN product_type_translations ptt_bg ON pt.id = ptt_bg.product_type_id AND ptt_bg.language_code = 'bg'
      GROUP BY pt.id, pt.menu_group, ptt_en.name, ptt_en.description, ptt_bg.name, ptt_bg.description
      ORDER BY pt.menu_group, pt.sort_order, pt.name ASC
    `);

    return NextResponse.json({ productTypes: rows });
  } catch (error: any) {
    console.error('Failed to load product types:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to load product types' },
      { status: 500 }
    );
  }
}

// CREATE new product type
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, slug, description, sort_order, menu_group } = body;

    if (!name) {
      return NextResponse.json({ error: 'Product type name is required' }, { status: 400 });
    }

    // Auto-generate slug if not provided
    const finalSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    const { rows } = await query(
      `
        INSERT INTO product_types (
          name, 
          slug, 
          handle,
          description, 
          sort_order,
          menu_group,
          status,
          visible,
          created_at,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
        RETURNING *
      `,
      [name, finalSlug, finalSlug, description || null, sort_order || 0, menu_group || 'gear', 'active', true]
    );

    return NextResponse.json({ productType: rows[0] });
  } catch (error: any) {
    console.error('Failed to create product type:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create product type' },
      { status: 500 }
    );
  }
}

// UPDATE existing product type
export async function PUT(req: Request) {
  try {
    const { productTypeId, data, translation_en, translation_bg } = await req.json();

    if (!productTypeId) {
      return NextResponse.json({ error: 'productTypeId required' }, { status: 400 });
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
    if (data.status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      values.push(data.status);
    }
    if (data.visible !== undefined) {
      updates.push(`visible = $${paramIndex++}`);
      values.push(data.visible);
    }
    if (data.menu_group !== undefined) {
      updates.push(`menu_group = $${paramIndex++}`);
      values.push(data.menu_group);
    }

    updates.push(`updated_at = NOW()`);
    values.push(productTypeId);

    const { rows } = await query(
      `
        UPDATE product_types
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `,
      values
    );

    const { rows: slugRows } = await query(
      'SELECT slug FROM product_types WHERE id = $1 LIMIT 1',
      [productTypeId]
    );
    const translationSlug = slugRows[0]?.slug || data.slug || '';

    // Save translations if provided
    if (translation_en) {
      await query(
        `
          INSERT INTO product_type_translations (product_type_id, language_code, name, slug, description, updated_at)
          VALUES ($1, 'en', $2, $3, $4, NOW())
          ON CONFLICT (product_type_id, language_code) DO UPDATE SET
            name = EXCLUDED.name,
            slug = EXCLUDED.slug,
            description = EXCLUDED.description,
            updated_at = NOW()
        `,
        [productTypeId, translation_en.name, translationSlug, translation_en.description]
      );
    }

    if (translation_bg) {
      await query(
        `
          INSERT INTO product_type_translations (product_type_id, language_code, name, slug, description, updated_at)
          VALUES ($1, 'bg', $2, $3, $4, NOW())
          ON CONFLICT (product_type_id, language_code) DO UPDATE SET
            name = EXCLUDED.name,
            slug = EXCLUDED.slug,
            description = EXCLUDED.description,
            updated_at = NOW()
        `,
        [productTypeId, translation_bg.name, translationSlug, translation_bg.description]
      );
    }

    return NextResponse.json({ productType: rows[0] });
  } catch (error: any) {
    console.error('Failed to update product type:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update product type' },
      { status: 500 }
    );
  }
}

// DELETE product type (only if inactive AND no products)
export async function DELETE(req: Request) {
  try {
    const { productTypeId } = await req.json();

    if (!productTypeId) {
      return NextResponse.json({ error: 'productTypeId required' }, { status: 400 });
    }

    // Check status and product count
    const { rows: checkRows } = await query(
      `
        SELECT 
          pt.status,
          pt.name,
          CAST(COUNT(p.id) AS INTEGER) as product_count
        FROM product_types pt
        LEFT JOIN products p ON p.product_type = pt.name
        WHERE pt.id = $1
        GROUP BY pt.id, pt.status, pt.name
      `,
      [productTypeId]
    );

    if (checkRows.length === 0) {
      return NextResponse.json({ error: 'Product type not found' }, { status: 404 });
    }

    const productType = checkRows[0];

    // Check if active
    if (productType.status === 'active') {
      return NextResponse.json(
        { error: 'Cannot delete active product type. Set it to inactive first.' },
        { status: 400 }
      );
    }

    // Check if has products
    if (productType.product_count > 0) {
      return NextResponse.json(
        { 
          error: `Cannot delete product type with ${productType.product_count} linked products. Reassign products first.` 
        },
        { status: 400 }
      );
    }

    // Safe to delete
    await query('DELETE FROM product_types WHERE id = $1', [productTypeId]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete product type:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete product type' },
      { status: 500 }
    );
  }
}

