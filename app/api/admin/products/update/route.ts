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

    // Update main product table
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
          video_url = $7,
          hero_video_url = $8,
          seo_title = $9,
          seo_description = $10,
          description_html = $11,
          description_html2 = $12,
          specs_html = $13,
          package_includes = $14,
          category_id = $15,
          meta_keywords = $16,
          og_title = $17,
          og_description = $18,
          og_image_url = $19,
          canonical_url = $20,
          meta_robots = $21,
          seo_score = $22,
          seo_generated_at = $23,
          updated_at = NOW()
        WHERE id = $24
      `,
      [
        info.title ?? null,
        info.name ?? info.title ?? null,
        info.handle ?? null,
        info.product_type ?? null,
        normalizedTags,
        info.status ?? null,
        info.video_url ?? null,
        info.hero_video_url ?? null, // New hero_video_url param
        info.seo_title ?? null,
        info.seo_description ?? null,
        info.description_html ?? null,
        info.description_html2 ?? null,
        info.specs_html ?? null,
        info.package_includes ?? null,
        info.categoryId ?? null,
        info.meta_keywords ?? null,
        info.og_title ?? null,
        info.og_description ?? null,
        info.og_image_url ?? null,
        info.canonical_url ?? null,
        info.meta_robots ?? null,
        info.seo_score ?? null,
        info.seo_generated_at ?? null,
        product.id,
      ]
    );

    // Update or insert English translation
    if (product.translation_en) {
      const enTrans = product.translation_en;
      const enTags = Array.isArray(enTrans.tags) ? enTrans.tags : [];

      await query(
        `
          INSERT INTO product_translations (
            product_id, language_code, title, description_html, description_html2,
            specs_html, package_includes, tags, seo_title, seo_description,
            meta_keywords, og_title, og_description, updated_at
          )
          VALUES ($1, 'en', $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
          ON CONFLICT (product_id, language_code)
          DO UPDATE SET
            title = EXCLUDED.title,
            description_html = EXCLUDED.description_html,
            description_html2 = EXCLUDED.description_html2,
            specs_html = EXCLUDED.specs_html,
            package_includes = EXCLUDED.package_includes,
            tags = EXCLUDED.tags,
            seo_title = EXCLUDED.seo_title,
            seo_description = EXCLUDED.seo_description,
            meta_keywords = EXCLUDED.meta_keywords,
            og_title = EXCLUDED.og_title,
            og_description = EXCLUDED.og_description,
            updated_at = NOW()
        `,
        [
          product.id,
          enTrans.title || null,
          enTrans.description_html || null,
          enTrans.description_html2 || null,
          enTrans.specs_html || null,
          enTrans.package_includes || null,
          enTags.length > 0 ? enTags : null,
          enTrans.seo_title || null,
          enTrans.seo_description || null,
          enTrans.meta_keywords || null,
          enTrans.og_title || null,
          enTrans.og_description || null,
        ]
      );
    }

    // Update or insert Bulgarian translation
    if (product.translation_bg) {
      const bgTrans = product.translation_bg;
      const bgTags = Array.isArray(bgTrans.tags) ? bgTrans.tags : [];

      await query(
        `
          INSERT INTO product_translations (
            product_id, language_code, title, description_html, description_html2,
            specs_html, package_includes, tags, seo_title, seo_description,
            meta_keywords, og_title, og_description, updated_at
          )
          VALUES ($1, 'bg', $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
          ON CONFLICT (product_id, language_code)
          DO UPDATE SET
            title = EXCLUDED.title,
            description_html = EXCLUDED.description_html,
            description_html2 = EXCLUDED.description_html2,
            specs_html = EXCLUDED.specs_html,
            package_includes = EXCLUDED.package_includes,
            tags = EXCLUDED.tags,
            seo_title = EXCLUDED.seo_title,
            seo_description = EXCLUDED.seo_description,
            meta_keywords = EXCLUDED.meta_keywords,
            og_title = EXCLUDED.og_title,
            og_description = EXCLUDED.og_description,
            updated_at = NOW()
        `,
        [
          product.id,
          bgTrans.title || null,
          bgTrans.description_html || null,
          bgTrans.description_html2 || null,
          bgTrans.specs_html || null,
          bgTrans.package_includes || null,
          bgTags.length > 0 ? bgTags : null,
          bgTrans.seo_title || null,
          bgTrans.seo_description || null,
          bgTrans.meta_keywords || null,
          bgTrans.og_title || null,
          bgTrans.og_description || null,
        ]
      );
    }

    if (Array.isArray(product.activity_category_ids)) {
      await query('DELETE FROM product_activity_categories WHERE product_id = $1', [product.id]);
      const distinctIds = Array.from(new Set(product.activity_category_ids.filter(Boolean)));
      if (distinctIds.length > 0) {
        await query(
          `
            INSERT INTO product_activity_categories (product_id, activity_category_id, created_at, updated_at)
            SELECT $1, unnest($2::uuid[]), NOW(), NOW()
          `,
          [product.id, distinctIds],
        );
      }
    }

    // Update Collections
    if (Array.isArray(product.collection_ids)) {
      await query('DELETE FROM collection_products WHERE product_id = $1', [product.id]);
      const distinctColIds = Array.from(new Set(product.collection_ids.filter(Boolean)));
      if (distinctColIds.length > 0) {
        // We need to handle sort_order. For now, we just append them. 
        // Better logic: preserve existing sort_order if possible? 
        // For simplicity in this "assign" UI, we'll just re-insert with default sort 0 or index.
        // But bulk insert with unnest is easier.
        await query(
          `
                INSERT INTO collection_products (collection_id, product_id, sort_order)
                SELECT unnest($2::uuid[]), $1, 0 
                ON CONFLICT (collection_id, product_id) DO NOTHING
              `,
          [product.id, distinctColIds] // Note param order swapped for query convenience
        );
      }
    }

    return NextResponse.json({ success: true, message: 'Product updated successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Unexpected error' }, { status: 500 });
  }
}

