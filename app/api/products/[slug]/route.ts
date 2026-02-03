import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getPresignedUrl, getKeyFromUrl } from '@/lib/railway/storage';
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
        p.slug, 
        p.title, -- Added title
        p.description,
        p.description_bg,
        p.name_bg,
        p.product_type,
        p.brand, -- Added brand
        c.name as category_name,
        c.slug as category_slug,
        COALESCE(
          (SELECT storage_path FROM product_images_railway pir WHERE pir.product_id = p.id ORDER BY CASE size WHEN 'big' THEN 1 WHEN 'original' THEN 2 ELSE 3 END ASC, display_order ASC LIMIT 1),
          (SELECT url FROM product_images pi WHERE pi.product_id = p.id ORDER BY position ASC LIMIT 1)
        ) as image_path,
        p.category_id,
        p.category_id,
        p.features, -- New Column
        p.video_url, -- Youtube URL
        p.hero_video_url, -- Uploaded MP4 URL
        p.description_html,
        p.description_html2,
        p.specs_html,
        p.package_includes,
        p.subtitle,
        p.sku,
        p.hero_image_url
      FROM products p
      JOIN categories c ON p.category_id = c.id
      WHERE (p.slug = $1 OR p.id::text = $1) AND p.status = 'active'
    `;
    const productResult = await query(productSql, [slug]);

    if (productResult.rows.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const product = productResult.rows[0];

    // Sign Hero Video URL if it's a private upload
    if (product.hero_video_url) {
      const key = getKeyFromUrl(product.hero_video_url) || product.hero_video_url;
      try {
        product.hero_video_url = await getPresignedUrl(key);
      } catch (e) {
        console.error('Failed to sign hero video url', e);
      }
    }

    // Sign Hero Image URL if present
    if (product.hero_image_url) {
      const key = getKeyFromUrl(product.hero_image_url) || product.hero_image_url;
      try {
        product.hero_image_url = await getPresignedUrl(key);
      } catch (e) {
        console.error('Failed to sign hero image url', e);
      }
    }

    // 2. Fetch Variants (for pricing and options)
    const variantsSql = `
      SELECT 
        id, 
        price, 
        compare_at_price, 
        inventory_quantity,
        title,
        name_en, -- Use this for display
        name_bg,
        sku,
        available,
        status,
        position,
        product_color_id -- New Column
      FROM product_variants 
      WHERE product_id = $1 AND status = 'active'
      ORDER BY position ASC
    `;
    const imagesSql = `
      SELECT url as storage_path, position as display_order
      FROM product_images 
      WHERE product_id = $1 
      ORDER BY position ASC
    `;

    const localImagesSql = `
      SELECT storage_path as url, display_order as position
      FROM product_images_railway
      WHERE product_id = $1
        AND id IN (
          SELECT id FROM (
            SELECT id, ROW_NUMBER() OVER (
              PARTITION BY bundle_id 
              ORDER BY CASE size WHEN 'big' THEN 1 WHEN 'original' THEN 2 ELSE 3 END ASC
            ) as rn 
            FROM product_images_railway 
            WHERE product_id = $1
          ) sub WHERE rn = 1
        )
      ORDER BY display_order ASC
    `;

    const colorsSql = `
      SELECT id, name, image_path, display_order
      FROM product_colors
      WHERE product_id = $1
      ORDER BY display_order ASC
    `;

    const [variantsResult, imagesResult, localImagesResult, colorsResult] = await Promise.all([
      query(variantsSql, [product.id]),
      query(imagesSql, [product.id]),
      query(localImagesSql, [product.id]),
      query(colorsSql, [product.id])
    ]);

    const variants = variantsResult.rows;
    // ... (image processing remains same)
    const imageRowsRaw = imagesResult.rows;
    const localImageRows = localImagesResult.rows.map((r: any) => ({
      storage_path: r.url, // Use exact path from DB (no leading slash needed for S3 keys)
      display_order: r.position
    }));
    const allImageRows = [...imageRowsRaw, ...localImageRows].sort((a, b) => (a.display_order ?? 999) - (b.display_order ?? 999));
    const seenPaths = new Set();
    const imageRows = allImageRows.filter((r: any) => {
      if (seenPaths.has(r.storage_path)) return false;
      seenPaths.add(r.storage_path);
      return true;
    });

    // Process Product Colors
    const productColors = await Promise.all(colorsResult.rows.map(async (c: any) => ({
      ...c,
      url: c.image_path ? await getPresignedUrl(c.image_path) : null
    })));

    // Get Min/Max Price
    const prices = variants.map((v: any) => parseFloat(v.price)).filter(p => !isNaN(p));
    const price = prices.length > 0 ? Math.min(...prices) : 0;

    // Extract variant options 
    const variantOptions = variants.map((v: any) => ({
      id: v.id,
      title: v.name_en || v.name_bg || v.title || 'Default', // Prioritize name_en
      price: parseFloat(v.price || 0),
      compareAtPrice: v.compare_at_price ? parseFloat(v.compare_at_price) : null,
      available: v.available,
      sku: v.sku,
      product_color_id: v.product_color_id // Include color ID
    }));

    // 3. Fetch Related Products (Same Product Type or Category, max 4)
    // Prefer same type, fallback to category.
    const relatedSql = `
      SELECT 
        p.id, p.name, p.title, p.slug, 
        (
          SELECT storage_path 
          FROM product_images_railway pir 
          WHERE pir.product_id = p.id AND pir.size IN ('medium', 'big') 
          ORDER BY CASE WHEN pir.size='medium' THEN 1 ELSE 2 END ASC, display_order ASC 
          LIMIT 1
        ) as image_path,
        (SELECT price FROM product_variants pv WHERE pv.product_id = p.id ORDER BY position ASC LIMIT 1) as price,
        (SELECT compare_at_price FROM product_variants pv WHERE pv.product_id = p.id ORDER BY position ASC LIMIT 1) as original_price,
         c.name as category_name,
         c.slug as category_slug
      FROM products p
      JOIN categories c ON p.category_id = c.id
      WHERE p.category_id = $1 
      AND p.id != $2
      AND p.status = 'active'
      ORDER BY RANDOM()
      LIMIT 4
    `;
    const relatedResult = await query(relatedSql, [product.category_id, product.id]);
    const related = await Promise.all(relatedResult.rows.map(async (row: any) => ({
      id: row.id,
      name: row.title || row.name,
      category: row.category_name,
      category_slug: row.category_slug,
      price: parseFloat(row.price || '0'),
      originalPrice: row.original_price ? parseFloat(row.original_price) : undefined,
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
    // Images: Fetch from product_images table
    let images = await Promise.all(imageRows.map(async (r: any) => {
      let key = r.storage_path;
      // Use helper to extract key if it's a full URL
      const extractedKey = getKeyFromUrl(key);
      if (extractedKey) key = extractedKey;

      console.log(`[ProductImage] Signing key: "${key}" (original: "${r.storage_path}")`);

      return await getPresignedUrl(key);
    }));
    images = images.filter(Boolean); // Remove nulls

    if (product.image_path) {
      console.log(`[ProductMainImage] Signing key: "${product.image_path}"`);
    }

    const mainImage = product.image_path
      ? await getPresignedUrl(product.image_path)
      : null;

    if (images.length === 0 && mainImage) {
      images = [mainImage];
    }

    return NextResponse.json({
      product: {
        ...product,
        name: product.title || product.name, // Use Title as the primary Name
        title: product.title,
        brand: product.brand,
        image: mainImage,
        price,
        images,
        variants: variantOptions,
        specs,
        features: product.features || [], // Return features
        colors: productColors // Return resolved colors
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
