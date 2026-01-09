import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

import { getPresignedUrl } from '@/lib/railway/storage';
import { PRODUCT_IMAGES_RAILWAY_TABLE } from '@/lib/productImagesRailway';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const requestedLang = (searchParams.get('lang') || 'en').toLowerCase();
    const lang = requestedLang === 'bg' ? 'bg' : 'en';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const offset = (page - 1) * limit;

    // Filters
    const queryTerm = searchParams.get('q') || searchParams.get('search');
    const categorySlug = searchParams.get('category'); // e.g., 'kite', 'foil'
    const typeSlugs = searchParams.getAll('type'); // e.g., ['boards', 'kites']
    const tagNames = searchParams.getAll('tag'); // e.g. ['Big Air', 'Freeride']
    const availability = searchParams.get('availability'); // 'in_stock' or 'out_of_stock'

    console.log('[API Products] Fetch started:', { lang, page, limit, queryTerm, category: categorySlug, types: typeSlugs, tags: tagNames, availability });

    // Build WHERE clause
    const conditions = [`p.status = 'active'`, `c.visible = true`, `c.status = 'active'`, `pt.visible = true`, `pt.status = 'active'`];
    const params: any[] = [lang];
    let paramIndex = 2; // $1 is lang

    if (queryTerm) {
      conditions.push(`(
        p.name ILIKE $${paramIndex} OR 
        p.description_html ILIKE $${paramIndex} OR
        pt_t.title ILIKE $${paramIndex} OR
        array_to_string(p.tags, ' ') ILIKE $${paramIndex} OR
        pt.name ILIKE $${paramIndex}
      )`);
      params.push(`%${queryTerm}%`);
      paramIndex++;
    }

    if (categorySlug) {
      conditions.push(`c.slug = $${paramIndex}`);
      params.push(categorySlug);
      paramIndex++;
    }

    if (typeSlugs.length > 0) {
      // Create placeholders for types: $3, $4, ...
      const placeholders = typeSlugs.map(() => `$${paramIndex++}`).join(', ');
      conditions.push(`pt.slug IN (${placeholders})`);
      params.push(...typeSlugs);
    }

    if (tagNames.length > 0) {
      // Filter by tags column (array of text)
      // We want products that contain ANY of the selected tags? Or ALL? 
      // Typically facets are "OR" within same group, "AND" across groups.
      // But user said "filters are set to all". 
      // Let's assume standard behavior: Products must have AT LEAST ONE of the selected tags.
      // Postgres: p.tags && ARRAY['Tag1', 'Tag2']
      const placeholders = tagNames.map(() => `$${paramIndex++}`).join(', ');
      conditions.push(`p.tags && ARRAY[${placeholders}]::text[]`);
      params.push(...tagNames);
    }

    // Availability Filter (Subquery Logic)
    if (availability === 'in_stock') {
      conditions.push(`
        EXISTS (
          SELECT 1 FROM product_variants pv 
          WHERE pv.product_id = p.id 
          AND pv.inventory_quantity > 0
        )
      `);
    } else if (availability === 'out_of_stock') {
      conditions.push(`
        NOT EXISTS (
          SELECT 1 FROM product_variants pv 
          WHERE pv.product_id = p.id 
          AND pv.inventory_quantity > 0
        )
      `);
    }

    const whereClause = conditions.join(' AND ');

    // Count Query
    const countSql = `
      SELECT COUNT(p.id) as total
      FROM products p
      JOIN categories c ON p.category_id = c.id
      JOIN product_types pt ON pt.name = p.product_type
      LEFT JOIN product_translations pt_t ON pt_t.product_id = p.id AND pt_t.language_code = $1
      WHERE ${whereClause}
      AND ($1::text IS NOT NULL OR true) -- Ensure $1 is used
    `;

    // We need to pass params for count query as well
    const countResult = await query(countSql, params);
    const total = parseInt(countResult.rows[0]?.total || '0', 10);

    // Products Query
    const productsSql = `
      SELECT
        p.id,
        COALESCE(pt_t.title, p.name) as name,
        p.slug,
        p.og_image_url,
        (SELECT price FROM product_variants pv WHERE pv.product_id = p.id ORDER BY position ASC LIMIT 1) as price,
        (SELECT compare_at_price FROM product_variants pv WHERE pv.product_id = p.id ORDER BY position ASC LIMIT 1) as "originalPrice",
        (SELECT storage_path FROM product_images_railway pir WHERE pir.product_id = p.id AND pir.size = 'small' ORDER BY display_order ASC LIMIT 1) as image_path,
        c.slug as category_slug,
        COALESCE(ct.name, c.name) as category_name,
        pt.name as type_name,
        pt.slug as type_slug,
        (
          SELECT SUM(inventory_quantity) 
          FROM product_variants pv 
          WHERE pv.product_id = p.id
        ) as total_inventory
      FROM products p
      JOIN categories c ON p.category_id = c.id
      JOIN product_types pt ON pt.name = p.product_type
      LEFT JOIN category_translations ct ON ct.category_id = c.id AND ct.language_code = $1
      LEFT JOIN product_translations pt_t ON pt_t.product_id = p.id AND pt_t.language_code = $1
      WHERE ${whereClause}
      ORDER BY c.sort_order ASC, pt.sort_order ASC, p.name ASC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    // Add limit/offset to params
    const productsParams = [...params, limit, offset];
    const productsResult = await query(productsSql, productsParams);

    console.log('[API Products] Count result:', countResult.rows[0]);
    console.log('[API Products] Products fetched:', productsResult.rows.length);


    const products = await Promise.all(productsResult.rows.map(async (row: any) => ({
      id: row.id,
      name: row.name,
      slug: row.slug || row.id, // Fallback to ID if slug is empty
      price: row.price ? parseFloat(row.price) : 0,
      originalPrice: row.originalPrice ? parseFloat(row.originalPrice) : undefined,
      image: row.image_path ? await getPresignedUrl(row.image_path) : (row.og_image_url || '/placeholder.jpg'), // Fallback to og_image_url
      category: row.category_name,
      categorySlug: row.category_slug,
      type: row.type_name,
      typeSlug: row.type_slug,
      inStock: (parseInt(row.total_inventory || '0') > 0), // simplified check
      badge: undefined,
    })));

    // Facets Query (Dynamic filters based on current selection - excluding self?)
    // Actually simplicity: filtering by Kite should show Kite types.
    // If we want "facets reduce themselves", we can query available types for the current category selection.

    // --- Base Params for Facets (excluding limit/offset) ---
    // NOTE: True faceted navigation usually involves excluding the CURRENT active filter when calculating counts for that filter group.
    // For simplicity V1: We'll calculate counts based on the FULL query (so if you select Kite, you see 0 counts for Wake).
    // This effectively "narrows down" options.

    // However, for "siblings" (other types within same category) we might want to see them.
    // But user request said "Scrolling through products... then we have filters".
    // Let's stick to "Narrowing Down" for now. 

    let facets: { categories: any[], types: any[], tags: any[] } = { categories: [], types: [], tags: [] };

    // Get Categories
    const categoriesSql = `
      SELECT c.slug, COALESCE(ct.name, c.name) as name, COUNT(distinct p.id) as count
      FROM categories c
      LEFT JOIN products p ON p.category_id = c.id AND p.status = 'active'
      LEFT JOIN category_translations ct ON ct.category_id = c.id AND ct.language_code = $1
      WHERE c.visible = true AND c.status = 'active'
      GROUP BY c.slug, ct.name, c.name, c.sort_order
      ORDER BY c.sort_order ASC
    `;
    const categoriesResult = await query(categoriesSql, [lang]);

    // Get Product Types (Filtered by current Context)
    // We reuse the basic 'whereClause' ideas but maybe relax the 'type' filter itself if we wanted to show all types.
    // But let's just show types available in current search/category context.

    // Simplified: Just use the same basic conditions but group by type.
    // NOTE: This means if I select Type=Board, Type=Kite count will go to 0 unless I remove the filter.
    // This is "Drill Down" behavior.

    // We need to RE-BUILD conditions without the specific filter to show "siblings".
    // 1. Types Facet (Constraints: Q + Category + Tags) -> show counts for ALL Types.

    const contextConditionsBase = [`p.status = 'active'`, `c.visible = true`, `c.status = 'active'`, `pt.visible = true`, `pt.status = 'active'`];
    const contextParams: any[] = [lang];
    let ctxIdx = 2;

    if (queryTerm) {
      contextConditionsBase.push(`(p.name ILIKE $${ctxIdx} OR p.description_html ILIKE $${ctxIdx} OR pt_t.title ILIKE $${ctxIdx} OR array_to_string(p.tags, ' ') ILIKE $${ctxIdx} OR pt.name ILIKE $${ctxIdx})`);
      contextParams.push(`%${queryTerm}%`);
      ctxIdx++;
    }

    if (categorySlug) {
      contextConditionsBase.push(`c.slug = $${ctxIdx}`);
      contextParams.push(categorySlug);
      ctxIdx++;
    }

    if (tagNames.length > 0) {
      const placeholders = tagNames.map(() => `$${ctxIdx++}`).join(', ');
      contextConditionsBase.push(`p.tags && ARRAY[${placeholders}]::text[]`);
      contextParams.push(...tagNames);
    }

    // Query Types with current context (search + category + tags), IGNORING type selection itself to show siblings?
    // Actually let's assume "Drill Down" strictly for now as per user "Filters are set to all".
    // If we want strict context:

    const typesSql = `
      SELECT pt.slug, pt.name, COUNT(distinct p.id) as count
      FROM product_types pt
      JOIN products p ON p.product_type = pt.name
      JOIN categories c ON p.category_id = c.id
      LEFT JOIN product_translations pt_t ON pt_t.product_id = p.id AND pt_t.language_code = $1
      WHERE ${contextConditionsBase.join(' AND ')}
      AND ($1::text IS NOT NULL OR true)
      GROUP BY pt.slug, pt.name, pt.sort_order
      ORDER BY pt.sort_order ASC
    `;
    const typesResult = await query(typesSql, contextParams);

    // 2. Tags Facet (Constraints: Q + Category + Type) -> show counts for Tags.
    // We need conditions without Tags filter.
    const tagContextConditions = [`p.status = 'active'`, `c.visible = true`, `c.status = 'active'`, `pt.visible = true`, `pt.status = 'active'`];
    const tagContextParams: any[] = [lang];
    let tagCtxIdx = 2;

    if (queryTerm) {
      tagContextConditions.push(`(p.name ILIKE $${tagCtxIdx} OR p.description_html ILIKE $${tagCtxIdx} OR pt_t.title ILIKE $${tagCtxIdx} OR array_to_string(p.tags, ' ') ILIKE $${tagCtxIdx} OR pt.name ILIKE $${tagCtxIdx})`);
      tagContextParams.push(`%${queryTerm}%`);
      tagCtxIdx++;
    }

    if (categorySlug) {
      tagContextConditions.push(`c.slug = $${tagCtxIdx}`);
      tagContextParams.push(categorySlug);
      tagCtxIdx++;
    }

    if (typeSlugs.length > 0) {
      const placeholders = typeSlugs.map(() => `$${tagCtxIdx++}`).join(', ');
      tagContextConditions.push(`pt.slug IN (${placeholders})`);
      tagContextParams.push(...typeSlugs);
    }

    const tagsSql = `
      SELECT t.tag as name, t.tag as slug, COUNT(distinct p.id) as count
      FROM products p
      JOIN categories c ON p.category_id = c.id
      JOIN product_types pt ON pt.name = p.product_type
      LEFT JOIN product_translations pt_t ON pt_t.product_id = p.id AND pt_t.language_code = $1,
      LATERAL unnest(p.tags) as t(tag)
      WHERE ${tagContextConditions.join(' AND ')} 
      AND ($1::text IS NOT NULL OR true)
      GROUP BY t.tag
      ORDER BY count DESC
      LIMIT 50
    `;
    const tagsResult = await query(tagsSql, tagContextParams);

    facets = {
      categories: categoriesResult.rows,
      types: typesResult.rows,
      tags: tagsResult.rows
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
    console.error('[API Products] Failed to load products - Full Error:', error);
    console.error('[API Products] Stack:', error.stack);
    return NextResponse.json(
      { error: error.message || 'Failed to load products' },
      { status: 500 }
    );
  }
}
