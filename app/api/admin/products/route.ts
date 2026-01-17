import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getPresignedUrl } from '@/lib/railway/storage';
import { PRODUCT_IMAGES_RAILWAY_TABLE } from '@/lib/productImagesRailway';

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

    // We'll process images later in map since async transformation needed
    const { rows: imageRows = [] } =
      productIds.length > 0
        ? await query(
          `
              SELECT id, product_id, storage_path, size, display_order
              FROM product_images_railway
              WHERE product_id = ANY($1) AND size = 'thumb'
              ORDER BY display_order ASC
            `,
          [productIds]
        )
        : { rows: [] };

    const { rows: variantRows = [] } =
      productIds.length > 0
        ? await query('SELECT * FROM product_variants WHERE product_id = ANY($1)', [productIds])
        : { rows: [] };

    const { rows: colorRows = [] } =
      productIds.length > 0
        ? await query('SELECT id, product_id, name_en AS name, hex_color, position FROM product_colors WHERE product_id = ANY($1) ORDER BY position ASC', [productIds])
        : { rows: [] };

    // Generate presigned URLs for all images found
    const processedImages = await Promise.all(
      imageRows.map(async (row: any) => {
        try {
          const url = row.storage_path ? await getPresignedUrl(row.storage_path) : null;
          return {
            ...row,
            url,
            thumb_url: url
          };
        } catch (err) {
          console.error(`Failed to sign URL for image ${row.id}`, err);
          return { ...row, url: null, thumb_url: null };
        }
      })
    );

    // Process colors
    const processedColors = colorRows.map((row: any) => ({
      ...row,
      url: null
    }));

    const imagesByProduct = new Map<string, any[]>();
    processedImages.forEach((img: any) => {
      const list = imagesByProduct.get(img.product_id) || [];
      const exists = list.some((existing) => existing.storage_path === img.storage_path);
      if (img.url && !exists) list.push(img);
      imagesByProduct.set(img.product_id, list);
    });

    const colorsByProduct = new Map<string, any[]>();
    processedColors.forEach((color: any) => {
      const list = colorsByProduct.get(color.product_id) || [];
      list.push(color); // Removed the color.url check as we use hex_color primarily
      colorsByProduct.set(color.product_id, list);
    });

    const variantsByProduct = new Map<string, any[]>();
    variantRows.forEach((v: any) => {
      const list = variantsByProduct.get(v.product_id) || [];
      list.push(v);
      variantsByProduct.set(v.product_id, list);
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
        product_colors: colorsByProduct.get(product.id) || [],
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


