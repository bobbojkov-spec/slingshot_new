import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(req: Request) {
  const { productId, variants = [], deleteIds = [] } = await req.json();

  if (!productId) {
    return NextResponse.json({ error: 'productId required' }, { status: 400 });
  }

  try {
    if (Array.isArray(deleteIds) && deleteIds.length > 0) {
      await query('DELETE FROM product_variants WHERE id = ANY($1)', [deleteIds]);
    }

    for (const variant of variants) {
      const title = variant.title ?? variant.name ?? null;
      const sku = variant.sku ?? null;
      const price = variant.price ?? null;
      const available = variant.available ?? null;
      const shopifyVariantId = variant.shopify_variant_id ?? null;

      if (variant.id) {
        await query(
          `
            UPDATE product_variants
            SET title = $1,
                sku = $2,
                price = $3,
                available = $4,
                shopify_variant_id = $5
            WHERE id = $6
          `,
          [title, sku, price, available, shopifyVariantId, variant.id]
        );
      } else {
        await query(
          `
            INSERT INTO product_variants (product_id, title, sku, price, available, shopify_variant_id)
            VALUES ($1, $2, $3, $4, $5, $6)
          `,
          [productId, title, sku, price, available, shopifyVariantId]
        );
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to save variants' }, { status: 500 });
  }
}

