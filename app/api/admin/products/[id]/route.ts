import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const productId = params?.id;

  if (!productId) {
    return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
  }

  try {
    const { rows: productRows } = await query(
      `
        SELECT
          p.*,
          jsonb_build_object(
            'id', c.id,
            'name', c.name,
            'slug', c.slug,
            'handle', c.handle
          ) AS category_info
        FROM products p
        LEFT JOIN categories c ON c.id = p.category_id
        WHERE p.id = $1
      `,
      [productId]
    );

    const product = productRows[0];
    if (!product) {
      return NextResponse.json({ product: null }, { status: 404 });
    }

    const [
      { rows: imageRows = [] },
      { rows: variantRows = [] },
      { rows: descRows = [] },
      { rows: specsRows = [] },
      { rows: packageRows = [] },
    ] = await Promise.all([
      query(
        `
          SELECT id, product_id, url, position, sort_order, shopify_product_id
          FROM product_images
          WHERE product_id = $1
          ORDER BY COALESCE(position, sort_order, 9999)
        `,
        [productId]
      ),
      query('SELECT * FROM product_variants WHERE product_id = $1 ORDER BY created_at ASC', [productId]),
      query('SELECT * FROM product_descriptions WHERE product_id = $1 LIMIT 1', [productId]),
      query('SELECT * FROM product_specs WHERE product_id = $1 LIMIT 1', [productId]),
      query('SELECT * FROM product_packages WHERE product_id = $1 LIMIT 1', [productId]),
    ]);

    const descriptions = descRows[0] || {};
    const specs = specsRows[0] || {};
    const pkg = packageRows[0] || {};

    const { category_info, ...rest } = product;

    return NextResponse.json({
      product: {
        ...rest,
        category: category_info || null,
        images: imageRows,
        variants: variantRows,
        description_html: rest.description_html ?? descriptions.description_html ?? null,
        description_html2: rest.description_html2 ?? descriptions.description_html2 ?? null,
        specs_html: rest.specs_html ?? specs.specs_html ?? specs.specs ?? specs.content ?? null,
        package_includes:
          rest.package_includes ??
          pkg.package_includes ??
          pkg.includes ??
          pkg.content ??
          pkg.description ??
          null,
      },
    });
  } catch (error: any) {
    console.error('Failed to fetch product details', error);
    return NextResponse.json(
      { error: error?.message || 'Unable to load product' },
      { status: 500 }
    );
  }
}


