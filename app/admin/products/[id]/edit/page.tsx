import EditProduct from './EditProduct';

export const revalidate = 0;

const ADMIN_BASE_URL =
  process.env.NEXT_API_URL ||
  process.env.ADMIN_BASE_URL ||
  process.env.NEXT_PUBLIC_BASE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.BASE_URL ||
  'http://localhost:3000';

async function fetchProduct(id: string) {
  try {
    const url = new URL(`/api/admin/products/${id}`, ADMIN_BASE_URL).toString();
    console.log('[EDIT PAGE] Fetching product from:', url);
    const res = await fetch(url, { cache: 'no-store' });
    console.log('[EDIT PAGE] Product fetch status:', res.status);

    if (!res.ok) {
      const text = await res.text();
      console.error('[EDIT PAGE] Product fetch failed:', res.status, text);
      return null;
    }

    const payload = await res.json();
    console.log('[EDIT PAGE] Product payload keys:', Object.keys(payload));
    const data = payload?.product;

    if (!data) {
      console.error('[EDIT PAGE] No product in payload');
      return null;
    }

    console.log('[EDIT PAGE] Product loaded:', data.title || data.name);
    console.log('[EDIT PAGE] translation_en:', data.translation_en);
    console.log('[EDIT PAGE] translation_bg:', data.translation_bg);

    const images = (data.images || [])
      .slice()
      .sort((a: any, b: any) => {
        const pa = a.position ?? a.sort_order ?? 9999;
        const pb = b.position ?? b.sort_order ?? 9999;
        return pa - pb;
      })
      .map((img: any) => ({ ...img, position: img.position ?? img.sort_order }));

    const infoTags = Array.isArray(data.tags)
      ? data.tags
      : typeof data.tags === 'string'
        ? data.tags
          .split(',')
          .map((t: string) => t.trim())
          .filter(Boolean)
        : [];

    return {
      ...data,
      images,
      variants: data.variants || [],
      info: {
        title: data.title ?? data.name ?? '',
        name: data.name ?? data.title ?? '',
        handle: data.handle ?? '',
        brand: (data as any).brand ?? '',
        product_type: data.product_type ?? '',
        tags: infoTags,
        status: data.status ?? '',
        hero_video_url: data.hero_video_url ?? '',
        hero_image_url: data.hero_image_url ?? '',
        video_url: data.video_url ?? '',
        categoryId: data.category?.id ?? data.category_id ?? data.category ?? null,
        categoryName: data.category?.name ?? '',
        description_html: data.description_html ?? '',
        description_html2: data.description_html2 ?? '',
        specs_html: data.specs_html ?? '',
        package_includes: data.package_includes ?? '',
        seo_title: data.seo_title ?? '',
        seo_description: data.seo_description ?? '',
        meta_keywords: data.meta_keywords ?? '',
        og_title: data.og_title ?? '',
        og_description: data.og_description ?? '',
        og_image_url: data.og_image_url ?? '',
        canonical_url: data.canonical_url ?? '',
        meta_robots: data.meta_robots ?? 'index, follow',
        seo_score: data.seo_score ?? undefined,
        seo_generated_at: data.seo_generated_at ?? undefined,
      },
      translation_en: data.translation_en || {
        title: '',
        description_html: '',
        description_html2: '',
        specs_html: '',
        package_includes: '',
        tags: [],
        seo_title: '',
        seo_description: '',
        meta_keywords: '',
        og_title: '',
        og_description: '',
      },
      translation_bg: data.translation_bg || {
        title: '',
        description_html: '',
        description_html2: '',
        specs_html: '',
        package_includes: '',
        tags: [],
        seo_title: '',
        seo_description: '',
        meta_keywords: '',
        og_title: '',
        og_description: '',
      },
    };
  } catch (error) {
    console.error('[EDIT PAGE] Failed to load product', error);
    return null;
  }
}

export default async function EditProductPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const productId = params.id;

  console.log('[EDIT PAGE] Loading product with ID:', productId);

  /* 
   * FETCHING DIRECTLY FROM DB (Server Component) 
   * Avoids internal API fetch issues.
   */
  const { query } = await import("@/lib/dbPg");

  const [product, categoriesList, collections] = await Promise.all([
    fetchProduct(productId),
    (async () => {
      const res = await query('SELECT id, name FROM categories ORDER BY name');
      return res.rows;
    })(),
    (async () => {
      const cols = await query(`SELECT id, title FROM collections ORDER BY title ASC`);
      const assigned = await query(`SELECT collection_id FROM collection_products WHERE product_id = $1`, [productId]);
      return {
        all: cols.rows,
        assignedIds: assigned.rows.map((a: any) => a.collection_id)
      };
    })()
  ]);

  console.log('[EDIT PAGE] Product result:', product ? 'FOUND' : 'NOT FOUND');
  console.log('[EDIT PAGE] Categories count:', categoriesList.length);

  if (!product) {
    return (
      <div style={{ padding: 24 }}>
        <h2>Product not found</h2>
        <p>Product ID: {productId}</p>
        <p>Check the server console for detailed logs.</p>
      </div>
    );
  }

  return (
    <EditProduct
      product={product}
      categories={categoriesList}
      collections={collections.all}
      initialCollectionIds={collections.assignedIds}
    />
  );
}
