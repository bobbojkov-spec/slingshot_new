import ProductsListClient from './ProductsListClient';

export const revalidate = 0;

const getAdminProductsUrl = () => {
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.BASE_URL ||
    'http://localhost:3000';
  return new URL('/api/admin/products', baseUrl.replace(/\/$/, '')).toString();
};

export default async function ProductsPage() {
  try {
    const res = await fetch(getAdminProductsUrl(), { cache: 'no-store' });
    if (!res.ok) {
      console.error('Failed to load admin products', res.status);
      return <ProductsListClient products={[]} />;
    }
    const data = await res.json();
    const products = data?.products ?? data?.items ?? [];
    return <ProductsListClient products={products} />;
  } catch (error) {
    console.error('Failed to load admin products', error);
    return <ProductsListClient products={[]} />;
  }
}


