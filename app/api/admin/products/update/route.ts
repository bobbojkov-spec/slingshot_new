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

    // Dynamic Update Query Construction
    const updateFields: any = {};
    if (info.title !== undefined) updateFields.title = info.title;
    if (info.name !== undefined) updateFields.name = info.name || info.title; // Fallback logic preserved
    if (info.handle !== undefined) updateFields.handle = info.handle;
    if (info.product_type !== undefined) updateFields.product_type = info.product_type;
    if (info.product_type !== undefined) updateFields.product_type = info.product_type;

    // Fix: Prefer English translation tags as canonical if available, to avoid BG tags leaking into EN
    if (product.translation_en?.tags && Array.isArray(product.translation_en.tags)) {
      updateFields.tags = product.translation_en.tags;
    } else if (info.tags !== undefined) {
      updateFields.tags = normalizedTags;
    }

    if (info.status !== undefined) updateFields.status = info.status;
    if (info.status !== undefined) updateFields.status = info.status;
    if (info.video_url !== undefined) updateFields.video_url = info.video_url;
    if (info.hero_video_url !== undefined) updateFields.hero_video_url = info.hero_video_url;
    if (info.hero_image_url !== undefined) updateFields.hero_image_url = info.hero_image_url;
    if (info.brand !== undefined) updateFields.brand = info.brand;
    if (info.seo_title !== undefined) updateFields.seo_title = info.seo_title;
    if (info.seo_description !== undefined) updateFields.seo_description = info.seo_description;
    if (info.description_html !== undefined) updateFields.description_html = info.description_html;
    if (info.description_html2 !== undefined) updateFields.description_html2 = info.description_html2;
    if (info.specs_html !== undefined) updateFields.specs_html = info.specs_html;
    if (info.package_includes !== undefined) updateFields.package_includes = info.package_includes;
    if (info.categoryId !== undefined) {
      // If it's an object with an 'id' property (common from UI), extract it.
      // If it's a string, use it directly. If it's empty/null, set to null.
      const rawId = info.categoryId?.id || (typeof info.categoryId === 'string' ? info.categoryId : null);
      updateFields.category_id = rawId || null;
    }
    if (info.meta_keywords !== undefined) updateFields.meta_keywords = info.meta_keywords;
    if (info.og_title !== undefined) updateFields.og_title = info.og_title;
    if (info.og_description !== undefined) updateFields.og_description = info.og_description;
    if (info.og_image_url !== undefined) updateFields.og_image_url = info.og_image_url;
    if (info.canonical_url !== undefined) updateFields.canonical_url = info.canonical_url;
    if (info.meta_robots !== undefined) updateFields.meta_robots = info.meta_robots;
    if (info.seo_score !== undefined) updateFields.seo_score = info.seo_score;
    if (info.seo_generated_at !== undefined) updateFields.seo_generated_at = info.seo_generated_at;

    // Always update updated_at
    updateFields.updated_at = new Date();

    const setClauses: string[] = [];
    const params: any[] = [];
    let paramIdx = 1;

    Object.entries(updateFields).forEach(([col, val]) => {
      setClauses.push(`${col} = $${paramIdx}`);
      params.push(val);
      paramIdx++;
    });

    if (setClauses.length > 0) {
      params.push(product.id);
      await query(
        `UPDATE products SET ${setClauses.join(', ')} WHERE id = $${paramIdx}`,
        params
      );
    }

    // Update or insert English translation
    if (product.translation_en) {
      const enTrans = product.translation_en;
      const enTags = Array.isArray(enTrans.tags) ? enTrans.tags : [];

      // Sync tags to master table
      if (enTags.length > 0) {
        try {
          for (const tag of enTags) {
            if (typeof tag === 'string' && tag.trim()) {
              const cleanTag = tag.trim();
              const slug = cleanTag.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
              await query(`
                INSERT INTO tags (name_en, slug)
                VALUES ($1, $2)
                ON CONFLICT (name_en) DO NOTHING
              `, [cleanTag, slug]);
            }
          }
        } catch (err) {
          console.error('Failed to sync tags to master table during product update', err);
        }
      }

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

