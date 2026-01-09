import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getPresignedUrl } from '@/lib/railway/storage';
import { PRODUCT_IMAGES_RAILWAY_TABLE } from '@/lib/productImagesRailway';

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(req.url); // For language if needed

    // 1. Fetch Product
    const productSql = `
      SELECT 
        p.id, 
        p.name, 
        p.slug, 
        p.description, 
        p.product_type,
        c.name as category_name,
        c.slug as category_slug,
        (SELECT storage_path FROM product_images_railway pir WHERE pir.product_id = p.id AND pir.size = 'big' ORDER BY display_order ASC LIMIT 1) as image_path,
        p.category_id
      FROM products p
      JOIN categories c ON p.category_id = c.id
      WHERE (p.slug = $1 OR p.id::text = $1) AND p.status = 'active'
    `;
    const productResult = await query(productSql, [slug]);

    if (productResult.rows.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const product = productResult.rows[0];

    // 2. Fetch Variants (for pricing and options)
    // Assuming structure: price, inventory_quantity, size (option1?), color (option2?)
    // Need to verify columns. For now assuming standard Shopify-like structure.
    const variantsSql = `
      SELECT 
        id, 
        price, 
        compare_at_price, 
        option1_value as size, 
        option2_value as color, 
        inventory_quantity,
        title
      FROM product_variants 
      WHERE product_id = $1 
      ORDER BY position ASC
    `;
    const imagesSql = `
      SELECT storage_path, display_order 
      FROM product_images_railway
      WHERE product_id = $1 AND size = 'big'
      ORDER BY display_order ASC
    `;

    const [variantsResult, imagesResult] = await Promise.all([
      query(variantsSql, [product.id]),
      query(imagesSql, [product.id])
    ]);

    const variants = variantsResult.rows;
    const imageRows = imagesResult.rows;

    // Get Min/Max Price
    const prices = variants.map((v: any) => parseFloat(v.price));
    const price = Math.min(...prices) || 0;

    // Extract options
    const sizes = Array.from(new Set(variants.map((v: any) => v.size).filter(Boolean)));
    const colors = Array.from(new Set(variants.map((v: any) => v.color).filter(Boolean))); // Need to map to actual color codes later?

    // 3. Fetch Related Products (Same Product Type or Category, max 4)
    // Prefer same type, fallback to category.
    const relatedSql = `
      SELECT 
        p.id, p.name, p.slug, 
        (SELECT storage_path FROM product_images_railway pir WHERE pir.product_id = p.id AND pir.size = 'thumb' ORDER BY display_order ASC LIMIT 1) as image_path,
        (SELECT price FROM product_variants pv WHERE pv.product_id = p.id ORDER BY position ASC LIMIT 1) as price,
         c.name as category_name
      FROM products p
      JOIN categories c ON p.category_id = c.id
      WHERE p.category_id = $1 
      AND p.id != $2
      AND p.status = 'active'
      ORDER BY RANDOM() -- Randomize for better discovery? Or use ID desc.
      LIMIT 4
    `;
    // Note: RANDOM() is efficient enough for small catalog.
    const relatedResult = await query(relatedSql, [product.category_id, product.id]);
    const related = await Promise.all(relatedResult.rows.map(async (row: any) => ({
      id: row.id,
      name: row.name,
      category: row.category_name,
      price: parseFloat(row.price || '0'),
      image: row.image_path ? await getPresignedUrl(row.image_path) : null,
      slug: row.slug
    })));

    // 4. Specs - Hardcoded for now or fetch?
    // User requested dynamic. If not in DB, maybe just generic?
    // Let's keep the generic specs from the static page for now, or infer from Type.
    const specs = [
      { label: "Type", value: product.product_type },
      { label: "Category", value: product.category_name },
      // Add more real specs if available in DB
    ];

    // Images: Fetch from product_images table
    // fallback to og_image_url if no images found?
    let images = await Promise.all(imageRows.map(async (r: any) => r.storage_path ? await getPresignedUrl(r.storage_path) : null));
    images = images.filter(Boolean); // Remove nulls

    const mainImage = product.image_path ? await getPresignedUrl(product.image_path) : null;

    if (images.length === 0 && mainImage) {
      images = [mainImage];
    }

    return NextResponse.json({
      product: {
        ...product,
        image: mainImage,
        price,
        images,
        sizes,
        specs
        // colors: [] // Handled by frontend mapping?
      },
      related
    });

  } catch (error: any) {
    console.error('Failed to fetch product:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch product' },
      { status: 500 }
    );
  }
}
