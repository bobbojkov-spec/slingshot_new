import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const { rows: productRows = [] } = await query(`
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
      ORDER BY p.created_at DESC
      LIMIT 1000
    `);

    const productIds = productRows.map((row: any) => row.id).filter(Boolean);

    const { rows: imageRows = [] } =
      productIds.length > 0
        ? await query(
            `
              SELECT id, product_id, url, position, shopify_product_id
              FROM product_images
              WHERE product_id = ANY($1)
              ORDER BY COALESCE(position, 9999)
            `,
            [productIds]
          )
        : { rows: [] };

    const { rows: variantRows = [] } =
      productIds.length > 0
        ? await query('SELECT * FROM product_variants WHERE product_id = ANY($1)', [productIds])
        : { rows: [] };

    const imagesByProduct = new Map<string, any[]>();
    imageRows.forEach((img: any) => {
      const list = imagesByProduct.get(img.product_id) || [];
      list.push(img);
      imagesByProduct.set(img.product_id, list);
    });

    const variantsByProduct = new Map<string, any[]>();
    variantRows.forEach((variant: any) => {
      const list = variantsByProduct.get(variant.product_id) || [];
      list.push(variant);
      variantsByProduct.set(variant.product_id, list);
    });

    const assembled = productRows.map((product: any) => {
      const { category_info, ...rest } = product;
      const images = imagesByProduct.get(product.id) || [];
      return {
        ...rest,
        category: category_info || null,
        images,
        imageCount: images.length,
        variants: variantsByProduct.get(product.id) || [],
      };
    });

    return NextResponse.json({ products: assembled });
  } catch (error: any) {
    console.error('Failed to load admin products', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to load products' },
      { status: 500 }
    );
  }
}


