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
        conditions.push(`(p.name ILIKE $${paramIndex} OR p.sku ILIKE $${paramIndex} OR array_to_string(p.tags, ' ') ILIKE $${paramIndex})`);
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
        const placeholders = tagNames.map(() => `$${paramIndex++}`).join(', ');
        conditions.push(`p.tags && ARRAY[${placeholders}]::text[]`);
        params.push(...tagNames);
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
      const createdAt = new Date(row.created_at);
      const isNew = (Date.now() - createdAt.getTime()) < 60 * 24 * 60 * 60 * 1000;
      const hasNewTag = row.tags && Array.isArray(row.tags) && row.tags.includes('New');
      if (isNew || hasNewTag) badge = 'New';

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
      };
    }));


    // FACETS ------------------------------------------------------------------

    // 2. Categories Facet (Always based on base Filters? Or filters excluding Category?)
    // Typically Categories is a drill-down. If I select a category, I see it.
    // Use FULL filters.
    const categoriesQP = buildQueryParts({}); // Keeping full filters for now
    // Actually, usually you want to see SIBLING categories. 
    // But since we removed the Category Filter from UI in Search, this is less relevant, 
    // but the API still returns it. Let's leave as is (filtered).
    const categoriesSql = `
      SELECT c.slug, COALESCE(ct.name, c.name) as name, COUNT(distinct p.id) as count
      FROM categories c
      LEFT JOIN products p ON p.category_id = c.id AND p.status = 'active'
      LEFT JOIN category_translations ct ON ct.category_id = c.id AND ct.language_code = $1
      WHERE c.visible = true AND c.status = 'active'
      -- We need to intersect with current query... this logic above was slightly different (group by c).
      -- Simplified: Just return categories that have matching products with current filters.
      -- BUT the previous query was joining on P with P.status='active'. 
      -- Now we want to apply 'mainQP' to P?
      -- The previous query had 'WHERE c.visible...'. It didn't apply query filters!
      -- That means Categories facet was STATIC? No, it used 'p.category_id = c.id'.
      -- But it didn't filter p by query! 
      -- Let's upgrade it to respect query filters.
    `;
    // Re-writing Categories properly:
    const catFacetsSql = `
        SELECT c.slug, COALESCE(ct.name, c.name) as name, COUNT(distinct p.id) as count
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN category_translations ct ON ct.category_id = c.id AND ct.language_code = $1
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
      SELECT t.tag as name, t.tag as slug, COUNT(distinct p.id) as count
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN product_types pt ON pt.name = p.product_type
      LEFT JOIN product_translations pt_t ON pt_t.product_id = p.id AND pt_t.language_code = $1,
      LATERAL unnest(p.tags) as t(tag)
      WHERE ${tagsQP.whereClause}
      AND ($1::text IS NOT NULL OR true)
      GROUP BY t.tag
      ORDER BY count DESC
      LIMIT 50
    `;
    const tagsResult = await query(tagsSql, tagsQP.params);

    // 5. Collections Facet (Skip Collection Filter)
    const collectionsQP = buildQueryParts({ skipCollection: true });

    // Determine Source Filter based on Brand (if present in brandsQP which excludes brand? NO.)
    // We should use the SELECTED brand to filter collections if desired. 
    // The user said: "if I search PUMP i got result from both brands! both should be listed".
    // If I select Brand A, I expect to see collections for Brand A?
    // BUT 'collectionsQP' skips 'collection' filter, does NOT skip 'brand' filter.
    // So 'collectionsQP' respects the Brand Filter.
    // So if I filter Brand=Slingshot, I only see Slingshot collections. Correct.

    // Logic for Source Filter based on selected brands
    let sourceFilter = [`'slingshot'`, `'rideengine'`];
    if (brandSlugs.length > 0) {
      // If only Ride Engine selected
      const hasRE = brandSlugs.some(b => b === 'ride-engine' || b === 'rideengine');
      const hasSS = brandSlugs.some(b => b === 'slingshot');
      if (hasRE && !hasSS) sourceFilter = [`'rideengine'`];
      if (hasSS && !hasRE) sourceFilter = [`'slingshot'`];
      // If both, keep both.
    }
    const sourceCondition = `col.source IN (${sourceFilter.join(', ')})`;

    const collectionFacetSql = `
        SELECT 
            col.slug, 
            COALESCE(ct.title, col.title) as name, 
            COUNT(distinct p.id) as count
        FROM collections col
        JOIN collection_products cp ON col.id = cp.collection_id
        JOIN products p ON cp.product_id = p.id
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN collection_translations ct ON ct.collection_id = col.id AND ct.language_code = $1
        WHERE col.visible = true 
        AND ${sourceCondition}
        AND p.status = 'active'
        -- Apply query filters to products
        AND p.id IN (SELECT p2.id FROM products p2 LEFT JOIN categories c2 ON p2.category_id = c2.id WHERE ${collectionsQP.whereClause.replace(/p\./g, 'p2.').replace(/c\./g, 'c2.')})
        HAVING COUNT(distinct p.id) > 0
        ORDER BY col.title ASC
    `;
    // Optimization: The IN clause is heavy. 
    // Better: Join the same conditions on 'p'. 
    // Since 'collectionsQP.whereClause' uses 'p' and 'c' alias, we can just dump it here?
    // But we are in a different FROM context (col join cp join p).
    // Yes, 'p' is products. 'c' is available via join above?
    // Added 'LEFT JOIN categories c'.
    // Now we can use collectionsQP.whereClause directly?
    // Yes.

    const collectionFacetSqlOptimized = `
        SELECT 
            col.slug, 
            COALESCE(ct.title, col.title) as name, 
            COUNT(distinct p.id) as count
        FROM collections col
        JOIN collection_products cp ON col.id = cp.collection_id
        JOIN products p ON cp.product_id = p.id
        LEFT JOIN categories c ON p.category_id = c.id
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
