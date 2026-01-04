import EditProduct from './EditProduct';
import { fetchAdminApi } from '@/app/admin/products/helpers';

export const revalidate = 0;

async function fetchProduct(id: string) {
  try {
    const res = await fetchAdminApi(`/api/admin/products/${id}`);
    if (!res.ok) {
      return null;
    }
    const payload = await res.json();
    const data = payload?.product;
    if (!data) {
      return null;
    }

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
    console.error('Failed to load product', error);
    return null;
  }
}

async function fetchCategoriesAndTypes() {
  try {
    const res = await fetchAdminApi('/api/admin/products/meta');
    if (!res.ok) {
      return { categories: [], productTypes: [] };
    }
    const data = await res.json();
    return {
      categories: data?.categories || [],
      productTypes: data?.productTypes || [],
    };
  } catch (error) {
    console.error('Failed to load product meta', error);
    return { categories: [], productTypes: [] };
  }
}

export default async function EditProductPage(props: { params: { id: string } }) {
  const params = await props.params;
  const [product, lists] = await Promise.all([fetchProduct(params.id), fetchCategoriesAndTypes()]);

  if (!product) {
    return <div style={{ padding: 24 }}>Product not found</div>;
  }

  return <EditProduct product={product} categories={lists.categories} productTypes={lists.productTypes} />;
}


