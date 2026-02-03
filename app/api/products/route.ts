import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

import { getPresignedUrl, getKeyFromUrl } from '@/lib/railway/storage';
import { PRODUCT_IMAGES_RAILWAY_TABLE } from '@/lib/productImagesRailway';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const requestedLang = (searchParams.get('lang') || 'en').toLowerCase();
    const lang = requestedLang === 'bg' ? 'bg' : 'en';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const offset = (page - 1) * limit;

    // Parsed Filters
    const queryTerm = searchParams.get('q') || searchParams.get('search');
    const categorySlug = searchParams.get('category');
    const collectionSlugs = searchParams.getAll('collection');
    const tagNames = searchParams.getAll('tag');
    const availability = searchParams.get('availability');
    // Support multiple brands
    const brandSlugs = searchParams.getAll('brand');

    // Helper to build WHERE clause and Params dynamically
    const buildConditions = async (options: { skipBrand?: boolean, skipTag?: boolean, skipCollection?: boolean } = {}) => {
      const conditions = [`p.status = 'active'`, `c.status = 'active'`];
      const params: any[] = [lang]; // $1
      let paramIndex = 2; // Next param is $2

      // 1. Text Search
      if (queryTerm) {
        conditions.push(`(
        p.name ILIKE $${paramIndex} OR 
        p.sku ILIKE $${paramIndex} OR
        array_to_string(p.tags, ' ') ILIKE $${paramIndex}
      )`);
        params.push(`%${queryTerm}%`);
        paramIndex++;
      }

      // 2. Category
      if (categorySlug) {
        const catTreeSql = `
        WITH RECURSIVE CategoryTree AS (
          SELECT id FROM categories WHERE slug = $1
          UNION ALL
          SELECT c.id FROM categories c
          INNER JOIN CategoryTree ct ON c.parent_id = ct.id
        )
        SELECT id FROM CategoryTree
      `;
        // Note: We need a fresh query helper here or reuse raw SQL. 
        // Since we are inside an async function building string, we can't easily await inside strictly synchronous return logic 
        // unless we fetch category IDs upfront. 
        // Refactor: Fetch Category IDs ONCE at top level if needed. 
      }
      // *Wait*: The previous logic fetched categories inside the flow. 
      // To keep buildConditions clean, let's resolve Category IDs *before* calling this, 
      // OR handle the async nature. 
      // Let's resolve Category IDs once at the top.

      if (!options.skipCollection && collectionSlugs.length > 0) {
        const placeholders = collectionSlugs.map(() => `$${paramIndex++}`).join(', ');
        conditions.push(`
        EXISTS (
            SELECT 1 FROM collection_products cp
            JOIN collections col ON cp.collection_id = col.id
            WHERE cp.product_id = p.id AND col.slug IN (${placeholders})
        )
      `);
        params.push(...collectionSlugs);
      }

      if (!options.skipTag && tagNames.length > 0) {
        const placeholders = tagNames.map(() => `$${paramIndex++}`).join(', ');
        conditions.push(`p.tags && ARRAY[${placeholders}]::text[]`);
        params.push(...tagNames);
      }

      if (!options.skipBrand && brandSlugs.length > 0) {
        // Multi-brand support
        const placeholders = brandSlugs.map(() => `$${paramIndex++}`).join(', ');
        conditions.push(`LOWER(REPLACE(p.brand, ' ', '-')) IN (${placeholders})`);
        params.push(...brandSlugs.map(b => b.toLowerCase()));
      }

      if (availability === 'in_stock') {
        conditions.push(`EXISTS (SELECT 1 FROM product_variants pv WHERE pv.product_id = p.id AND pv.inventory_quantity > 0)`);
      } else if (availability === 'out_of_stock') {
        conditions.push(`NOT EXISTS (SELECT 1 FROM product_variants pv WHERE pv.product_id = p.id AND pv.inventory_quantity > 0)`);
      }

      return { whereClause: conditions.join(' AND '), params, nextIndex: paramIndex };
    };


    // PRE-FETCH: Category IDs if needed
    let categoryIds: number[] = [];
    if (categorySlug) {
      const catTreeSql = `
        WITH RECURSIVE CategoryTree AS (
          SELECT id FROM categories WHERE slug = $1
          UNION ALL
          SELECT c.id FROM categories c
          INNER JOIN CategoryTree ct ON c.parent_id = ct.id
        )
        SELECT id FROM CategoryTree
      `;
      const catTreeResult = await query(catTreeSql, [categorySlug]);
      categoryIds = catTreeResult.rows.map((r: any) => r.id);
    }

    // UPDATED Helper with Pre-fetched Categories
    const buildQueryParts = (options: { skipBrand?: boolean, skipTag?: boolean, skipCollection?: boolean } = {}) => {
      const conditions = [`p.status = 'active'`, `c.status = 'active'`];
      const params: any[] = [lang];
      let paramIndex = 2;

      if (queryTerm) {
        conditions.push(`(
          p.name ILIKE $${paramIndex} OR 
          p.title ILIKE $${paramIndex} OR 
          pt_t.title ILIKE $${paramIndex} OR 
          p.sku ILIKE $${paramIndex} OR 
          p.handle ILIKE $${paramIndex} OR
          array_to_string(p.tags, ' ') ILIKE $${paramIndex}
        )`);
        params.push(`%${queryTerm}%`);
        paramIndex++;
      }

      if (categoryIds.length > 0) {
        const placeholders = categoryIds.map((_, i) => `$${paramIndex + i}`).join(', ');
        conditions.push(`p.category_id IN (${placeholders})`);
        params.push(...categoryIds);
        paramIndex += categoryIds.length;
      } else if (categorySlug) {
        // Category requested but not found -> 0 results
        conditions.push('1=0');
      }

      if (!options.skipCollection && collectionSlugs.length > 0) {
        const placeholders = collectionSlugs.map(() => `$${paramIndex++}`).join(', ');
        conditions.push(`EXISTS (SELECT 1 FROM collection_products cp JOIN collections col ON cp.collection_id = col.id WHERE cp.product_id = p.id AND col.slug IN (${placeholders}))`);
        params.push(...collectionSlugs);
      }

      if (!options.skipTag && tagNames.length > 0) {
        // Tag filter: Accept tag names in EITHER English OR Bulgarian
        // Look up tags by name_en OR name_bg, then check if product has matching tags
        const lowerTags = tagNames.map(t => t.toLowerCase());

        // Create placeholders for name_en check
        const placeholdersEn = lowerTags.map(() => `$${paramIndex++}`).join(', ');
        // Create placeholders for name_bg check (separate indices)
        const placeholdersBg = lowerTags.map(() => `$${paramIndex++}`).join(', ');

        conditions.push(`EXISTS (
          SELECT 1 FROM tags tg
          WHERE (LOWER(tg.name_en) IN (${placeholdersEn}) OR LOWER(tg.name_bg) IN (${placeholdersBg}))
          AND (
            p.tags && ARRAY[tg.name_en, COALESCE(tg.name_bg, tg.name_en)]::text[] OR
            pt_t.tags && ARRAY[tg.name_en, COALESCE(tg.name_bg, tg.name_en)]::text[] OR
            EXISTS (SELECT 1 FROM product_translations pt_sub WHERE pt_sub.product_id = p.id AND pt_sub.language_code = 'en' AND pt_sub.tags && ARRAY[tg.name_en, COALESCE(tg.name_bg, tg.name_en)]::text[])
          )
        )`);
        // Push params twice (once for each IN clause)
        params.push(...lowerTags, ...lowerTags);
      }

      if (!options.skipBrand && brandSlugs.length > 0) {
        const placeholders = brandSlugs.map(() => `$${paramIndex++}`).join(', ');
        conditions.push(`LOWER(REPLACE(p.brand, ' ', '-')) IN (${placeholders})`);
        params.push(...brandSlugs.map(b => b.toLowerCase()));
      }

      if (availability === 'in_stock') {
        conditions.push(`EXISTS (SELECT 1 FROM product_variants pv WHERE pv.product_id = p.id AND pv.inventory_quantity > 0)`);
      } else if (availability === 'out_of_stock') {
        conditions.push(`NOT EXISTS (SELECT 1 FROM product_variants pv WHERE pv.product_id = p.id AND pv.inventory_quantity > 0)`);
      }

      return { whereClause: conditions.join(' AND '), params, nextIndex: paramIndex };
    };

    // 1. MAIN QUERY (Apply All Filters)
    const mainQP = buildQueryParts();

    // Count
    const countSql = `
      SELECT COUNT(p.id) as total
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN product_types pt ON pt.name = p.product_type
      LEFT JOIN product_translations pt_t ON pt_t.product_id = p.id AND pt_t.language_code = $1
      WHERE ${mainQP.whereClause}
      AND ($1::text IS NOT NULL OR true)
    `;
    const countResult = await query(countSql, mainQP.params);
    const total = parseInt(countResult.rows[0]?.total || '0', 10);

    // Products
    const productsSql = `
      SELECT
        p.id,
        COALESCE(pt_t.title, p.name) as name,
        p.slug,
        p.og_image_url,
        p.hero_image_url,
        p.hero_video_url,
        (SELECT price FROM product_variants pv WHERE pv.product_id = p.id ORDER BY position ASC LIMIT 1) as price,
        (SELECT compare_at_price FROM product_variants pv WHERE pv.product_id = p.id ORDER BY position ASC LIMIT 1) as "originalPrice",
        (SELECT storage_path FROM product_images_railway pir WHERE pir.product_id = p.id ORDER BY CASE size WHEN 'small' THEN 1 WHEN 'thumb' THEN 2 ELSE 3 END ASC, display_order ASC LIMIT 1) as image_path,
        c.slug as category_slug,
        COALESCE(ct.name, c.name) as category_name,
        pt.name as type_name,
        pt.slug as type_slug,
        (SELECT SUM(inventory_quantity) FROM product_variants pv WHERE pv.product_id = p.id) as total_inventory
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN product_types pt ON pt.name = p.product_type
      LEFT JOIN category_translations ct ON ct.category_id = c.id AND ct.language_code = $1
      LEFT JOIN product_translations pt_t ON pt_t.product_id = p.id AND pt_t.language_code = $1
      WHERE ${mainQP.whereClause}
      ORDER BY c.sort_order ASC NULLS LAST, p.name ASC
      LIMIT $${mainQP.nextIndex} OFFSET $${mainQP.nextIndex + 1}
    `;
    const productsResult = await query(productsSql, [...mainQP.params, limit, offset]);

    const products = await Promise.all(productsResult.rows.map(async (row: any) => {
      let imageUrl = row.og_image_url || '/placeholder.jpg';

      const legacyKey = getKeyFromUrl(imageUrl);
      if (legacyKey) {
        try {
          imageUrl = await getPresignedUrl(legacyKey);
        } catch (e) {
          console.warn('Failed to sign legacy URL:', e);
        }
      }

      if (row.image_path) {
        try {
          imageUrl = await getPresignedUrl(row.image_path);
        } catch (e) {
          console.error(`Failed to sign URL for product ${row.id} path ${row.image_path}:`, e);
        }
      }
      let badge = null;
      const hasNewTag = row.tags && Array.isArray(row.tags) && row.tags.includes('New');
      // Simple logic for new, can be refined
      if (hasNewTag) badge = 'New';

      return {
        id: row.id,
        name: row.name,
        slug: row.slug || row.id,
        price: row.price ? parseFloat(row.price) : 0,
        originalPrice: row.originalPrice ? parseFloat(row.originalPrice) : undefined,
        image: imageUrl,
        badge: badge,
        category: row.category_name,
        categorySlug: row.category_slug,
        type: row.type_name,
        typeSlug: row.type_slug,
        inStock: (parseInt(row.total_inventory || '0') > 0),
        hero_image_url: await (async () => {
          if (!row.hero_image_url) return null;
          const key = getKeyFromUrl(row.hero_image_url) || row.hero_image_url;
          try { return await getPresignedUrl(key); } catch (e) { return row.hero_image_url; }
        })(),
        hero_video_url: await (async () => {
          if (!row.hero_video_url) return null;
          const key = getKeyFromUrl(row.hero_video_url) || row.hero_video_url;
          try { return await getPresignedUrl(key); } catch (e) { return row.hero_video_url; }
        })(),
      };
    }));


    // FACETS ------------------------------------------------------------------

    // 2. Categories Facet
    const catFacetsSql = `
        SELECT c.slug, COALESCE(ct.name, c.name) as name, COUNT(distinct p.id) as count
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN category_translations ct ON ct.category_id = c.id AND ct.language_code = $1
        LEFT JOIN product_translations pt_t ON pt_t.product_id = p.id AND pt_t.language_code = $1
        WHERE ${mainQP.whereClause}
        AND c.id IS NOT NULL
        GROUP BY c.slug, c.name, ct.name, c.sort_order
        ORDER BY c.sort_order ASC
    `;
    const categoriesResult = await query(catFacetsSql, mainQP.params);


    // 3. Brands Facet (Skip Brand Filter)
    const brandsQP = buildQueryParts({ skipBrand: true });
    const brandsSql = `
      SELECT 
        LOWER(REPLACE(p.brand, ' ', '-')) as slug,
        p.brand as name,
        COUNT(distinct p.id) as count
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN product_types pt ON pt.name = p.product_type
      LEFT JOIN product_translations pt_t ON pt_t.product_id = p.id AND pt_t.language_code = $1
      WHERE ${brandsQP.whereClause}
      AND p.brand IS NOT NULL 
      AND p.brand != ''
      AND ($1::text IS NOT NULL OR true)
      GROUP BY p.brand
      ORDER BY p.brand ASC
    `;
    const brandsResult = await query(brandsSql, brandsQP.params);

    // 4. Tags Facet (Skip Tag Filter)
    const tagsQP = buildQueryParts({ skipTag: true });
    const tagsSql = `
      SELECT 
        CASE WHEN $1 = 'bg' AND tg.name_bg IS NOT NULL AND tg.name_bg != '' 
             THEN tg.name_bg 
             ELSE tg.name_en 
        END as name,
        COUNT(distinct p.id) as count
      FROM products p
      LEFT JOIN product_translations pt_t ON pt_t.product_id = p.id AND pt_t.language_code = $1
      LEFT JOIN categories c ON p.category_id = c.id,
      LATERAL unnest(COALESCE(pt_t.tags, p.tags)) as t(tag)
      JOIN tags tg ON LOWER(tg.name_en) = LOWER(t.tag) OR LOWER(tg.name_bg) = LOWER(t.tag)
      WHERE ${tagsQP.whereClause}
      AND ($1::text IS NOT NULL OR true)
      GROUP BY tg.name_en, tg.name_bg
      ORDER BY count DESC
      LIMIT 50
    `;
    const tagsResult = await query(tagsSql, tagsQP.params);

    // 5. Collections Facet (Skip Collection Filter)
    const collectionsQP = buildQueryParts({ skipCollection: true });

    let sourceFilter = [`'slingshot'`, `'rideengine'`];
    if (brandSlugs.length > 0) {
      const hasRE = brandSlugs.some(b => b === 'ride-engine' || b === 'rideengine');
      const hasSS = brandSlugs.some(b => b === 'slingshot');
      if (hasRE && !hasSS) sourceFilter = [`'rideengine'`];
      if (hasSS && !hasRE) sourceFilter = [`'slingshot'`];
    }
    const sourceCondition = `col.source IN (${sourceFilter.join(', ')})`;

    const collectionFacetSqlOptimized = `
        SELECT 
            col.slug, 
            COALESCE(ct.title, col.title) as name, 
            COUNT(distinct p.id) as count
        FROM collections col
        JOIN collection_products cp ON col.id = cp.collection_id
        JOIN products p ON cp.product_id = p.id
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN product_translations pt_t ON pt_t.product_id = p.id AND pt_t.language_code = $1
        LEFT JOIN collection_translations ct ON ct.collection_id = col.id AND ct.language_code = $1
        WHERE col.visible = true 
        AND ${sourceCondition}
        AND ${collectionsQP.whereClause}
        GROUP BY col.slug, col.title, ct.title
        HAVING COUNT(distinct p.id) > 0
        ORDER BY col.title ASC
    `;

    const collectionsResult = await query(collectionFacetSqlOptimized, collectionsQP.params);


    // Assembly
    const facets = {
      categories: categoriesResult.rows,
      collections: collectionsResult.rows,
      tags: tagsResult.rows,
      brands: brandsResult.rows
    };

    return NextResponse.json({
      products,
      facets,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
