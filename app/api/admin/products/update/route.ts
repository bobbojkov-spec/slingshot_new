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
          handle = $2,
          product_type = $3,
          tags = $4,
          status = $5,
          seo_title = $6,
          seo_description = $7,
          description_html = $8,
          specs_html = $9,
          package_includes = $10,
          category_id = $11
        WHERE id = $12
      `,
      [
        info.title ?? null,
        info.handle ?? null,
        info.product_type ?? null,
        normalizedTags ?? null,
        info.status ?? null,
        info.seo_title ?? null,
        info.seo_description ?? null,
        info.description_html ?? null,
        info.specs_html ?? null,
        info.package_includes ?? null,
        info.categoryId ?? null,
        product.id,
      ]
    );

    await query(
      `
        INSERT INTO product_descriptions (product_id, description_html, description_html2)
        VALUES ($1, $2, $3)
        ON CONFLICT (product_id) DO UPDATE
        SET description_html = EXCLUDED.description_html,
            description_html2 = EXCLUDED.description_html2
      `,
      [product.id, info.description_html ?? '', info.description_html2 ?? '']
    );

    await query(
      `
        INSERT INTO product_specs (product_id, specs_html)
        VALUES ($1, $2)
        ON CONFLICT (product_id) DO UPDATE
        SET specs_html = EXCLUDED.specs_html
      `,
      [product.id, info.specs_html ?? '']
    );

    await query(
      `
        INSERT INTO product_packages (product_id, package_includes)
        VALUES ($1, $2)
        ON CONFLICT (product_id) DO UPDATE
        SET package_includes = EXCLUDED.package_includes
      `,
      [product.id, info.package_includes ?? '']
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Unexpected error' }, { status: 500 });
  }
}

