import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// CREATE new variant
export async function POST(req: Request) {
  try {
    const { productId, variant } = await req.json();

    if (!productId) {
      return NextResponse.json({ error: 'productId required' }, { status: 400 });
    }

    const { rows } = await query(
      `
        INSERT INTO product_variants (
          product_id,
          title,
          sku,
          price,
          compare_at_price,
          inventory_quantity,
          available,
          status,
          name_en,
          name_bg,
          position,
          created_at,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
        RETURNING *
      `,
      [
        productId,
        variant.title || null,
        variant.sku || null,
        variant.price || null,
        variant.compare_at_price || null,
        variant.inventory_quantity || 0,
        true,
        'active',
        variant.name_en || variant.title || null,
        variant.name_bg || null,
        variant.position || 0,
      ]
    );

    const createdVariant = rows[0];

    const { rows: availabilityRows = [] } = await query(
      `
        INSERT INTO product_variant_availability (variant_id, color_id, stock_qty, is_active, created_at, updated_at)
        SELECT $1, id, 0, false, NOW(), NOW()
        FROM product_colors
        WHERE product_id = $2
        ON CONFLICT (variant_id, color_id) DO NOTHING
        RETURNING variant_id, color_id, stock_qty, is_active, created_at, updated_at
      `,
      [createdVariant.id, productId]
    );

    return NextResponse.json({ variant: createdVariant, availability: availabilityRows });
  } catch (error: any) {
    console.error('Failed to create variant:', error);
    return NextResponse.json({ error: error.message || 'Failed to create variant' }, { status: 500 });
  }
}

// UPDATE existing variant
export async function PUT(req: Request) {
  try {
    const { variantId, data, translation_en, translation_bg } = await req.json();

    if (!variantId) {
      return NextResponse.json({ error: 'variantId required' }, { status: 400 });
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    // Build dynamic UPDATE query based on provided fields
    if (data.title !== undefined) {
      updates.push(`title = $${paramIndex++}`);
      values.push(data.title);
    }
    if (data.sku !== undefined) {
      updates.push(`sku = $${paramIndex++}`);
      values.push(data.sku);
    }
    if (data.price !== undefined) {
      updates.push(`price = $${paramIndex++}`);
      values.push(data.price);
    }
    if (data.compare_at_price !== undefined) {
      updates.push(`compare_at_price = $${paramIndex++}`);
      values.push(data.compare_at_price);
    }
    if (data.inventory_quantity !== undefined) {
      updates.push(`inventory_quantity = $${paramIndex++}`);
      values.push(data.inventory_quantity);
    }
    if (data.available !== undefined) {
      updates.push(`available = $${paramIndex++}`);
      values.push(data.available);
    }
    if (data.status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      values.push(data.status);
    }
    if (data.name_en !== undefined) {
      updates.push(`name_en = $${paramIndex++}`);
      values.push(data.name_en);
    }
    if (data.name_bg !== undefined) {
      updates.push(`name_bg = $${paramIndex++}`);
      values.push(data.name_bg);
    }
    if (data.position !== undefined) {
      updates.push(`position = $${paramIndex++}`);
      values.push(data.position);
    }
    if (data.product_color_id !== undefined) {
      updates.push(`product_color_id = $${paramIndex++}`);
      values.push(data.product_color_id);
    }

    // Always update updated_at
    updates.push(`updated_at = NOW()`);
    values.push(variantId);

    const { rows } = await query(
      `
        UPDATE product_variants
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `,
      values
    );

    // Save translations if provided
    if (translation_en) {
      await query(
        `
          INSERT INTO product_variant_translations (variant_id, language_code, title, updated_at)
          VALUES ($1, 'en', $2, NOW())
          ON CONFLICT (variant_id, language_code) DO UPDATE SET
            title = EXCLUDED.title,
            updated_at = NOW()
        `,
        [variantId, translation_en.title]
      );
    }

    if (translation_bg) {
      await query(
        `
          INSERT INTO product_variant_translations (variant_id, language_code, title, updated_at)
          VALUES ($1, 'bg', $2, NOW())
          ON CONFLICT (variant_id, language_code) DO UPDATE SET
            title = EXCLUDED.title,
            updated_at = NOW()
        `,
        [variantId, translation_bg.title]
      );
    }

    return NextResponse.json({ variant: rows[0] });
  } catch (error: any) {
    console.error('Failed to update variant:', error);
    return NextResponse.json({ error: error.message || 'Failed to update variant' }, { status: 500 });
  }
}

// DELETE variant (only if inactive)
export async function DELETE(req: Request) {
  try {
    const { variantId } = await req.json();

    if (!variantId) {
      return NextResponse.json({ error: 'variantId required' }, { status: 400 });
    }

    // Check if variant is inactive before deleting
    const { rows: checkRows } = await query(
      'SELECT status FROM product_variants WHERE id = $1',
      [variantId]
    );

    if (checkRows.length === 0) {
      return NextResponse.json({ error: 'Variant not found' }, { status: 404 });
    }

    if (checkRows[0].status === 'active') {
      return NextResponse.json(
        { error: 'Cannot delete active variant. Set it to inactive first.' },
        { status: 400 }
      );
    }

    await query('DELETE FROM product_variants WHERE id = $1', [variantId]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete variant:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete variant' }, { status: 500 });
  }
}
