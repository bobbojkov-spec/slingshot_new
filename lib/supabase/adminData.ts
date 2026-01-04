import { supabaseAdmin } from './server';

type AnyRecord = Record<string, any>;

export async function fetchProductsWithImages() {
  try {
    const { data, error } = await supabaseAdmin
      .from('products')
      .select(
        '*, category:categories(id, name, slug, handle), product_descriptions:product_descriptions(description_html, description_html2), product_variants:product_variants(*)'
      )
      .order('created_at', { ascending: false });

    if (error) {
      return { products: [] as AnyRecord[], error };
    }

    const productIds = (data || []).map((p: AnyRecord) => p.id).filter(Boolean);

    // fetch images keyed by product_id if table exists
    let images: AnyRecord[] = [];
    if (productIds.length > 0) {
      const { data: imagesData, error: imagesError } = await supabaseAdmin
        .from('product_images')
        .select('product_id, url, position, sort_order')
        .in('product_id', productIds);
      if (!imagesError && imagesData) {
        images = imagesData;
      }
    }

    const imagesByProduct = new Map<string, AnyRecord[]>();
    images
      .sort((a: AnyRecord, b: AnyRecord) => {
        const pa = a.position ?? a.sort_order ?? 9999;
        const pb = b.position ?? b.sort_order ?? 9999;
        return pa - pb;
      })
      .forEach((img: any) => {
        const list = imagesByProduct.get(img.product_id) || [];
        list.push(img);
        imagesByProduct.set(img.product_id, list);
      });

    // fetch specs and packages by product_id (even if no FK)
    const specsByProduct = new Map<string, AnyRecord>();
    const packagesByProduct = new Map<string, AnyRecord>();

    if (productIds.length > 0) {
      const { data: specsRows } = await supabaseAdmin
        .from('product_specs')
        .select('*')
        .in('product_id', productIds);
      (specsRows || []).forEach((row: AnyRecord) => {
        specsByProduct.set(row.product_id, row);
      });

      const { data: packageRows } = await supabaseAdmin
        .from('product_packages')
        .select('*')
        .in('product_id', productIds);
      (packageRows || []).forEach((row: AnyRecord) => {
        packagesByProduct.set(row.product_id, row);
      });
    }

    const withImages =
      data?.map((p: AnyRecord) => {
        const desc =
          Array.isArray(p.product_descriptions) && p.product_descriptions[0]
            ? {
                description_html: p.product_descriptions[0].description_html,
              }
            : {};
        const specsFirst = specsByProduct.get(p.id);
        const pkgFirst = packagesByProduct.get(p.id);
        return {
          ...p,
          description_html: p.description_html ?? desc.description_html,
          description_html2: p.description_html2 ?? (desc as any).description_html2,
          specs_html: p.specs_html ?? specsFirst?.specs_html ?? specsFirst?.specs ?? specsFirst?.content,
          package_includes:
            p.package_includes ??
            pkgFirst?.package_includes ??
            pkgFirst?.includes ??
            pkgFirst?.content ??
            pkgFirst?.description,
          variants: p.variants ?? p.product_variants ?? [],
          images: imagesByProduct.get(p.id) || [],
        };
      }) || [];

    return { products: withImages, error: null };
  } catch (error: any) {
    return { products: [] as AnyRecord[], error };
  }
}

export async function fetchDashboardSnapshot() {
  async function countTable(table: string) {
    try {
      const { count } = await supabaseAdmin.from(table).select('*', { count: 'exact', head: true });
      return count ?? 0;
    } catch {
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
    const { data } = await supabaseAdmin
      .from('products')
      .select('id, title, updated_at, created_at')
      .order('created_at', { ascending: false })
      .limit(5);
    lastImported = data || [];
  } catch {
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

