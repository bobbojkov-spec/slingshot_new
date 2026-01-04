import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const product = body?.product;

    if (!product?.id) {
      return NextResponse.json({ error: 'Missing product id' }, { status: 400 });
    }

    const info = product.info || {};

    const parsedTags = Array.isArray(info.tags)
      ? info.tags
      : typeof info.tags === 'string'
        ? info.tags
            .split(',')
            .map((t: string) => t.trim())
            .filter(Boolean)
        : null;
    const normalizedTags = parsedTags && parsedTags.length > 0 ? parsedTags : null;

    await query(
      `
        UPDATE products
        SET
          title = $1,
          name = $2,
          handle = $3,
          product_type = $4,
          tags = $5,
          status = $6,
          seo_title = $7,
          seo_description = $8,
          description_html = $9,
          description_html2 = $10,
          specs_html = $11,
          package_includes = $12,
          category_id = $13,
          updated_at = NOW()
        WHERE id = $14
      `,
      [
        info.title ?? null,
        info.name ?? info.title ?? null,
        info.handle ?? null,
        info.product_type ?? null,
        normalizedTags,
        info.status ?? null,
        info.seo_title ?? null,
        info.seo_description ?? null,
        info.description_html ?? null,
        info.description_html2 ?? null,
        info.specs_html ?? null,
        info.package_includes ?? null,
        info.categoryId ?? null,
        product.id,
      ]
    );

    return NextResponse.json({ success: true, message: 'Product updated successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Unexpected error' }, { status: 500 });
  }
}

