import EditProduct from './EditProduct';

export const revalidate = 0;

const ADMIN_BASE_URL =
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
        categoryId: data.category?.id ?? data.category_id ?? data.category ?? null,
        categoryName: data.category?.name ?? '',
        description_html: data.description_html ?? '',
        description_html2: data.description_html2 ?? '',
        specs_html: data.specs_html ?? '',
        package_includes: data.package_includes ?? '',
        seo_title: data.seo_title ?? '',
        seo_description: data.seo_description ?? '',
      },
    };
  } catch (error) {
    console.error('[EDIT PAGE] Failed to load product', error);
    return null;
  }
}

async function fetchCategoriesAndTypes() {
  try {
    const url = new URL('/api/admin/products/meta', ADMIN_BASE_URL).toString();
    const res = await fetch(url, { cache: 'no-store' });
    
    if (!res.ok) {
      return { categories: [], productTypes: [] };
    }
    
    const data = await res.json();
    return {
      categories: data?.categories || [],
      productTypes: data?.productTypes || [],
    };
  } catch (error) {
    console.error('[EDIT PAGE] Failed to load product meta', error);
    return { categories: [], productTypes: [] };
  }
}

export default async function EditProductPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const productId = params.id;
  
  console.log('[EDIT PAGE] Loading product with ID:', productId);
  
  const [product, lists] = await Promise.all([
    fetchProduct(productId),
    fetchCategoriesAndTypes()
  ]);

  console.log('[EDIT PAGE] Product result:', product ? 'FOUND' : 'NOT FOUND');
  console.log('[EDIT PAGE] Categories count:', lists.categories.length);
  console.log('[EDIT PAGE] Product types count:', lists.productTypes.length);

  if (!product) {
    return (
      <div style={{ padding: 24 }}>
        <h2>Product not found</h2>
        <p>Product ID: {productId}</p>
        <p>Check the server console for detailed logs.</p>
      </div>
    );
  }

  return <EditProduct product={product} categories={lists.categories} productTypes={lists.productTypes} />;
}
