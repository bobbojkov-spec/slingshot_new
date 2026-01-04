import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET all product types
export async function GET() {
  try {
    const { rows } = await query(`
      SELECT 
        pt.*,
        CAST(COUNT(p.id) AS INTEGER) as product_count
      FROM product_types pt
      LEFT JOIN products p ON p.product_type = pt.name
      GROUP BY pt.id
      ORDER BY pt.sort_order ASC, pt.name ASC
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
    const { name, slug, description, sort_order } = body;

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
          status,
          visible,
          created_at,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        RETURNING *
      `,
      [name, finalSlug, finalSlug, description || null, sort_order || 0, 'active', true]
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
    const { productTypeId, data } = await req.json();

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

