import ProductTypesListClient from './ProductTypesListClient';

export const revalidate = 0;

const ADMIN_BASE_URL =
  process.env.ADMIN_BASE_URL ||
  process.env.NEXT_PUBLIC_BASE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.BASE_URL ||
  'http://localhost:3000';

export default async function ProductTypesPage() {
  try {
    const url = new URL('/api/admin/product-types', ADMIN_BASE_URL).toString();
    const res = await fetch(url, { cache: 'no-store' });
    
    if (!res.ok) {
      console.error('Failed to load product types', res.status);
      return <ProductTypesListClient productTypes={[]} />;
    }
    
    const data = await res.json();
    const productTypes = data?.productTypes || [];
    
    return <ProductTypesListClient productTypes={productTypes} />;
  } catch (error) {
    console.error('Failed to load product types', error);
    return <ProductTypesListClient productTypes={[]} />;
  }
}

