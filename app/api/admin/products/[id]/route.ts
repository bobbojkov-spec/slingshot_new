import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getImageVariantUrl } from '@/lib/utils/imagePaths';
import { getPresignedUrl } from '@/lib/railway/storage';

export async function GET(_: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
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
      { rows: translationsEN = [] },
      { rows: translationsBG = [] },
      { rows: activityRows = [] },
      { rows: colorRows = [] },
      { rows: availabilityRows = [] },
    ] = await Promise.all([
      query(
        `
          SELECT
            id,
            product_id,
            url,
            position,
            sort_order,
            shopify_product_id,
            original_path,
            thumb_path,
            medium_path
          FROM product_images
          WHERE product_id = $1
          ORDER BY COALESCE(position, sort_order, 9999)
        `,
        [productId]
      ),
      query(
        `
          SELECT 
            pv.*,
            json_build_object('title', pvt_en.title) as translation_en,
            json_build_object('title', pvt_bg.title) as translation_bg
          FROM product_variants pv
          LEFT JOIN product_variant_translations pvt_en ON pv.id = pvt_en.variant_id AND pvt_en.language_code = 'en'
          LEFT JOIN product_variant_translations pvt_bg ON pv.id = pvt_bg.variant_id AND pvt_bg.language_code = 'bg'
          WHERE pv.product_id = $1
        `,
        [productId]
      ),
      query('SELECT * FROM product_descriptions WHERE product_id = $1 LIMIT 1', [productId]),
      query('SELECT * FROM product_specs WHERE product_id = $1 LIMIT 1', [productId]),
      query('SELECT * FROM product_packages WHERE product_id = $1 LIMIT 1', [productId]),
      query('SELECT * FROM product_translations WHERE product_id = $1 AND language_code = $2 LIMIT 1', [productId, 'en']),
      query('SELECT * FROM product_translations WHERE product_id = $1 AND language_code = $2 LIMIT 1', [productId, 'bg']),
      query(
        `
          SELECT 
            ac.id,
            ac.name_en,
            ac.name_bg,
            ac.slug
          FROM activity_categories ac
          JOIN product_activity_categories pac ON pac.activity_category_id = ac.id
          WHERE pac.product_id = $1
          ORDER BY ac.position ASC
        `,
        [productId],
      ),
      query(
        `
          SELECT id, product_id, name_en, name_bg, hex_color, position, created_at, updated_at
          FROM product_colors
          WHERE product_id = $1
          ORDER BY position ASC, name_en ASC
        `,
        [productId]
      ),
      query(
        `
          SELECT 
            pva.variant_id,
            pva.color_id,
            pva.stock_qty,
            pva.is_active,
            pva.created_at,
            pva.updated_at
          FROM product_variant_availability pva
          JOIN product_variants pv ON pv.id = pva.variant_id
          WHERE pv.product_id = $1
            AND EXISTS (
              SELECT 1 FROM product_colors pc WHERE pc.id = pva.color_id AND pc.product_id = $1
            )
        `,
        [productId]
      ),
    ]);

    const descriptions = descRows[0] || {};
    const specs = specsRows[0] || {};
    const pkg = packageRows[0] || {};
    const translationEN = translationsEN[0] || {};
    const translationBG = translationsBG[0] || {};

    const { category_info, ...rest } = product;
    const signedImages = await Promise.all(
      imageRows.map(async (row: any) => {
        const thumbUrl = row.thumb_path ? await getPresignedUrl(row.thumb_path) : null;
        const mediumUrl = row.medium_path ? await getPresignedUrl(row.medium_path) : null;
        const originalUrl = row.original_path ? await getPresignedUrl(row.original_path) : null;
        return {
          ...row,
          thumb_url: thumbUrl || getImageVariantUrl(row.url, 'thumb') || row.url,
          medium_url: mediumUrl || getImageVariantUrl(row.url, 'medium') || row.url,
          original_url: originalUrl || row.url,
        };
      })
    );

    return NextResponse.json({
      product: {
        ...rest,
        category: category_info || null,
        images: signedImages,
        variants: variantRows,
        // Legacy fallback fields
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
        // Translation objects
        translation_en: {
          title: translationEN.title || rest.title || rest.name || '',
          description_html: translationEN.description_html || rest.description_html || '',
          description_html2: translationEN.description_html2 || rest.description_html2 || '',
          specs_html: translationEN.specs_html || rest.specs_html || '',
          package_includes: translationEN.package_includes || rest.package_includes || '',
          tags: translationEN.tags || rest.tags || [],
          seo_title: translationEN.seo_title || rest.seo_title || '',
          seo_description: translationEN.seo_description || rest.seo_description || '',
        },
        translation_bg: {
          title: translationBG.title || '',
          description_html: translationBG.description_html || '',
          description_html2: translationBG.description_html2 || '',
          specs_html: translationBG.specs_html || '',
          package_includes: translationBG.package_includes || '',
          tags: translationBG.tags || [],
          seo_title: translationBG.seo_title || '',
          seo_description: translationBG.seo_description || '',
        },
        activity_categories: activityRows,
        activity_category_ids: activityRows.map((row) => row.id),
        colors: colorRows,
        availability: availabilityRows,
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


