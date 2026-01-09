import { query } from '@/lib/db';
import { getPresignedUrl } from '@/lib/railway/storage';

type AnyRecord = Record<string, any>;

export async function fetchProductsWithImages() {
  try {
    // 1. Fetch Products with joined data
    // We'll join simpler tables, but might need separate queries for one-to-many to avoid massive duplication
    // For now, let's fetch products and their categories first
    const productsSql = `
      SELECT 
        p.*,
        c.id as category_id_joined, c.name as category_name, c.slug as category_slug, c.handle as category_handle
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY p.created_at DESC
    `;
    const { rows: products } = await query(productsSql);

    if (!products.length) {
      return { products: [], error: null };
    }

    const productIds = products.map((p: any) => p.id);

    // 2. Fetch Images (Railway S3)
    const imagesSql = `
      SELECT product_id, storage_path, size, display_order 
      FROM product_images_railway 
      WHERE product_id = ANY($1)
      ORDER BY display_order ASC
    `;
    const { rows: imageRows } = await query(imagesSql, [productIds]);

    // Process images: Generate presigned URLs
    // This needs to be async, but we can't use await inside basic map nicely without Promise.all
    // We'll create a map of product_id -> promise of images
    const imagesByProductId = new Map<string, any[]>();

    // Group raw rows first
    for (const img of imageRows) {
      const list = imagesByProductId.get(img.product_id) || [];
      list.push(img);
      imagesByProductId.set(img.product_id, list);
    }

    // 3. Fetch Variants
    const variantsSql = `
      SELECT * FROM product_variants WHERE product_id = ANY($1) ORDER BY position ASC
    `;
    const { rows: variantsRows } = await query(variantsSql, [productIds]);
    const variantsByProductId = new Map<string, any[]>();
    for (const v of variantsRows) {
      const list = variantsByProductId.get(v.product_id) || [];
      list.push(v);
      variantsByProductId.set(v.product_id, list);
    }

    // 4. Fetch Descriptions
    const descSql = `
      SELECT product_id, description_html, description_html2 FROM product_descriptions WHERE product_id = ANY($1)
    `;
    const { rows: descRows } = await query(descSql, [productIds]);
    const descByProductId = new Map<string, any>();
    for (const d of descRows) {
      descByProductId.set(d.product_id, d);
    }

    // 5. Fetch Specs
    const specsSql = `
      SELECT * FROM product_specs WHERE product_id = ANY($1)
    `;
    const { rows: specsRows } = await query(specsSql, [productIds]);
    const specsByProductId = new Map<string, any>();
    for (const s of specsRows) {
      specsByProductId.set(s.product_id, s);
    }

    // 6. Fetch Packages
    const pkgSql = `
      SELECT * FROM product_packages WHERE product_id = ANY($1)
    `;
    const { rows: pkgRows } = await query(pkgSql, [productIds]);
    const pkgByProductId = new Map<string, any>();
    for (const p of pkgRows) {
      pkgByProductId.set(p.product_id, p);
    }

    // Assemble Data with Async Image Signing
    const resultProducts = await Promise.all(products.map(async (p: any) => {
      const rawImages = imagesByProductId.get(p.id) || [];

      // Sign URLs for all images
      const imagesWithUrls = await Promise.all(rawImages.map(async (img: any) => ({
        ...img,
        url: await getPresignedUrl(img.storage_path)
      })));

      const desc = descByProductId.get(p.id);
      const specsFirst = specsByProductId.get(p.id);
      const pkgFirst = pkgByProductId.get(p.id);

      return {
        ...p,
        category: {
          id: p.category_id_joined,
          name: p.category_name,
          slug: p.category_slug,
          handle: p.category_handle
        },
        description_html: p.description_html ?? desc?.description_html,
        description_html2: p.description_html2 ?? desc?.description_html2,
        specs_html: p.specs_html ?? specsFirst?.specs_html ?? specsFirst?.specs ?? specsFirst?.content,
        package_includes: p.package_includes ??
          pkgFirst?.package_includes ??
          pkgFirst?.includes ??
          pkgFirst?.content ??
          pkgFirst?.description,
        variants: variantsByProductId.get(p.id) || [],
        images: imagesWithUrls
      };
    }));

    return { products: resultProducts, error: null };

  } catch (error: any) {
    console.error('Fetch products error:', error);
    return { products: [] as AnyRecord[], error };
  }
}

export async function fetchDashboardSnapshot() {
  async function countTable(table: string) {
    try {
      // Use parameterized query even for table name if possible, but PG doesn't allow table name param.
      // Since 'table' is internal string literal, it's safe.
      const sql = `SELECT COUNT(*) as count FROM ${table}`;
      const { rows } = await query(sql);
      return parseInt(rows[0]?.count || '0', 10);
    } catch (e) {
      console.error(`Error counting ${table}:`, e);
      return 0;
    }
  }

  const [productsCount, categoriesCount, inquiriesCount, subscribersCount] = await Promise.all([
    countTable('products'),
    countTable('categories'),
    countTable('inquiries'),
    countTable('newsletter_subscribers'),
  ]);

  let lastImported: AnyRecord[] = [];
  try {
    const { rows } = await query(`
      SELECT id, title, updated_at, created_at 
      FROM products 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    lastImported = rows;
  } catch (e) {
    console.error('Error fetching last imported:', e);
    lastImported = [];
  }

  return {
    productsCount,
    categoriesCount,
    inquiriesCount,
    subscribersCount,
    lastImported,
  };
}


