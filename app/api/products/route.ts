import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

import { getPublicImageUrl } from '@/lib/railway/storage';
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
    const typeSlugs = searchParams.getAll('type'); // Legacy support? Or reuse 'type' param for collections?
    // User asked to replace "Product Type" filter with "Collection".
    // Let's support 'collection' param but check if 'type' param implies collection too if needed.
    // For cleanliness, let's look for 'collection' param first.
    const collectionSlugs = searchParams.getAll('collection');

    const tagNames = searchParams.getAll('tag');
    const availability = searchParams.get('availability');
    const brandSlug = searchParams.get('brand');

    // Build WHERE clause
    // USER REQUEST: "category NOT visible HIDES just the category from the menu... not all products within."
    // Removed `c.visible = true` so products in hidden categories (like rideengine) are still visible.
    const conditions = [`p.status = 'active'`, `c.status = 'active'`];
    const params: any[] = [lang];
    let paramIndex = 2; // $1 is lang

    if (queryTerm) {
      conditions.push(`(
        p.name ILIKE $${paramIndex} OR 
        array_to_string(p.tags, ' ') ILIKE $${paramIndex}
      )`);
      params.push(`%${queryTerm}%`);
      paramIndex++;
    }

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

      if (catTreeResult.rows.length > 0) {
        const catIds = catTreeResult.rows.map((r: any) => r.id);
        const placeholders = catIds.map((_, i) => `$${paramIndex + i}`).join(', ');
        conditions.push(`p.category_id IN (${placeholders})`);
        params.push(...catIds);
        paramIndex += catIds.length;
      } else {
        conditions.push('1=0');
      }
    }

    if (collectionSlugs.length > 0) {
      // Filter by collection(s)
      // Products must be in one of the selected collections
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

    // Legacy support for 'type' param if needed, or if frontend still sends it
    // If 'type' matches a collection slug, treat it as collection?
    // Or ignore type entirely as requested?
    // Let's support type filtering as fallback if NO collection filter is present,
    // to verify old links still work if any.
    if (typeSlugs.length > 0 && collectionSlugs.length === 0) {
      // Check if these are actually collection slugs?
      // The user said "Replace product type filter with collections".
      // Let's assume if 'type' is passed it might be legacy URL.
      const placeholders = typeSlugs.map(() => `$${paramIndex++}`).join(', ');
      conditions.push(`
        (
            pt.slug IN (${placeholders}) 
            OR 
            EXISTS (
                SELECT 1 FROM collection_products cp
                JOIN collections col ON cp.collection_id = col.id
                WHERE cp.product_id = p.id AND col.slug IN (${placeholders})
            )
        )
      `);
      params.push(...typeSlugs); // Push once, reuse placeholders
    }


    if (tagNames.length > 0) {
      const placeholders = tagNames.map(() => `$${paramIndex++}`).join(', ');
      conditions.push(`p.tags && ARRAY[${placeholders}]::text[]`);
      params.push(...tagNames);
    }

    if (brandSlug) {
      conditions.push(`LOWER(REPLACE(p.brand, ' ', '-')) = $${paramIndex}`);
      params.push(brandSlug.toLowerCase());
      paramIndex++;
    }

    if (availability === 'in_stock') {
      conditions.push(`EXISTS (SELECT 1 FROM product_variants pv WHERE pv.product_id = p.id AND pv.inventory_quantity > 0)`);
    } else if (availability === 'out_of_stock') {
      conditions.push(`NOT EXISTS (SELECT 1 FROM product_variants pv WHERE pv.product_id = p.id AND pv.inventory_quantity > 0)`);
    }

    const whereClause = conditions.join(' AND ');

    // Count Query
    const countSql = `
      SELECT COUNT(p.id) as total
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN product_types pt ON pt.name = p.product_type
      LEFT JOIN product_translations pt_t ON pt_t.product_id = p.id AND pt_t.language_code = $1
      WHERE ${whereClause}
      AND ($1::text IS NOT NULL OR true)
    `;

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
      WHERE ${whereClause}
      ORDER BY c.sort_order ASC NULLS LAST, p.name ASC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const productsParams = [...params, limit, offset];
    const productsResult = await query(productsSql, productsParams);

    const products = await Promise.all(productsResult.rows.map(async (row: any) => {
      let imageUrl = row.og_image_url || '/placeholder.jpg';
      if (row.image_path) {
        try {
          imageUrl = getPublicImageUrl(row.image_path);
        } catch (e) {
          console.error(`Failed to sign URL for product ${row.id} path ${row.image_path}:`, e);
        }
      }
      let badge = null;
      // "New" badge logic: Created in last 60 days OR has "New" tag
      const createdAt = new Date(row.created_at);
      const isNew = (Date.now() - createdAt.getTime()) < 60 * 24 * 60 * 60 * 1000;
      const hasNewTag = row.tags && Array.isArray(row.tags) && row.tags.includes('New');

      if (isNew || hasNewTag) {
        badge = 'New';
      }

      return {
        id: row.id,
        name: row.name,
        slug: row.slug || row.id, // Fallback to ID if slug is empty
        price: row.price ? parseFloat(row.price) : 0,
        originalPrice: row.originalPrice ? parseFloat(row.originalPrice) : undefined,
        image: imageUrl,
        badge: badge,
        category: row.category_name,
        categorySlug: row.category_slug,
        type: row.type_name,
        typeSlug: row.type_slug,
        inStock: (parseInt(row.total_inventory || '0') > 0), // simplified check
      };
    }));

    let facets: { categories: any[], collections: any[], tags: any[], brands: any[] } = { categories: [], collections: [], tags: [], brands: [] };

    // 1. Categories Facet
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

    // 2. Collections Facet (REPLACES TYPES)
    // Filter collections based on the current context (Mainly Category AND Brand)

    let collectionFacetSql = '';
    let colParams = [lang];
    let colIdx = 2; // $1 is lang

    // Determine source filter based on brand
    // 'slingshot' -> ['slingshot']
    // 'ride-engine' -> ['rideengine']
    // else -> ['slingshot', 'rideengine']

    let sourceFilter = [`'slingshot'`, `'rideengine'`];
    if (brandSlug === 'ride-engine' || brandSlug === 'rideengine') {
      sourceFilter = [`'rideengine'`];
    } else if (brandSlug === 'slingshot') {
      sourceFilter = [`'slingshot'`];
    }

    const sourceCondition = `col.source IN (${sourceFilter.join(', ')})`;

    let categoryAllQuery = `
            SELECT 
                col.slug, 
                COALESCE(ct.title, col.title) as name, 
                COUNT(distinct p.id) as count
            FROM collections col
            JOIN collection_products cp ON col.id = cp.collection_id
            JOIN products p ON cp.product_id = p.id
            LEFT JOIN collection_translations ct ON ct.collection_id = col.id AND ct.language_code = $1
            WHERE col.visible = true
            AND ${sourceCondition}
            AND p.status = 'active'
            GROUP BY col.slug, col.title, ct.title
            HAVING COUNT(distinct p.id) > 0
            ORDER BY col.title ASC
    `;

    if (categorySlug) {
      collectionFacetSql = `
            SELECT 
                col.slug, 
                COALESCE(ct.title, col.title) as name, 
                COUNT(distinct p.id) as count
            FROM collections col
            JOIN collection_products cp ON col.id = cp.collection_id
            JOIN products p ON cp.product_id = p.id
            JOIN categories c ON p.category_id = c.id
            LEFT JOIN collection_translations ct ON ct.collection_id = col.id AND ct.language_code = $1
            WHERE col.visible = true 
            AND ${sourceCondition}
            AND c.slug = $${colIdx}
            AND p.status = 'active'
            GROUP BY col.slug, col.title, ct.title
            HAVING COUNT(distinct p.id) > 0
            ORDER BY col.title ASC
        `;
      colParams.push(categorySlug);
    } else {
      collectionFacetSql = categoryAllQuery;
    }

    const collectionsResult = await query(collectionFacetSql, colParams);

    // 3. Tags Facet
    // Same context logic as before
    const tagsSql = `
      SELECT t.tag as name, t.tag as slug, COUNT(distinct p.id) as count
      FROM products p
      JOIN categories c ON p.category_id = c.id
      JOIN product_types pt ON pt.name = p.product_type
      LEFT JOIN product_translations pt_t ON pt_t.product_id = p.id AND pt_t.language_code = $1,
      LATERAL unnest(p.tags) as t(tag)
      WHERE ${conditions.join(' AND ')} -- Use full conditions including collection filter? Yes -> Narrow down tags.
      AND ($1::text IS NOT NULL OR true)
      GROUP BY t.tag
      ORDER BY count DESC
      LIMIT 50
    `;
    const tagsResult = await query(tagsSql, params); // use main query params

    // 4. Brands Facet
    const brandsSql = `
      SELECT 
        LOWER(REPLACE(p.brand, ' ', '-')) as slug,
        p.brand as name,
        COUNT(distinct p.id) as count
      FROM products p
      JOIN categories c ON p.category_id = c.id
      JOIN product_types pt ON pt.name = p.product_type
      LEFT JOIN product_translations pt_t ON pt_t.product_id = p.id AND pt_t.language_code = $1
      WHERE ${conditions.join(' AND ')}
      AND p.brand IS NOT NULL 
      AND p.brand != ''
      AND ($1::text IS NOT NULL OR true)
      GROUP BY p.brand
      ORDER BY p.brand ASC
    `;
    const brandsResult = await query(brandsSql, params); // Use main query params for context

    facets = {
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
