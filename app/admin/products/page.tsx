import ProductsListClient from './ProductsListClient';
import { getAdminProductsList } from '@/lib/products-admin';

export const revalidate = 0;

export default async function ProductsPage() {
  try {
    const products = await getAdminProductsList();
    return <ProductsListClient products={products} />;
  } catch (error) {
    console.error('Failed to load admin products', error);
    return <ProductsListClient products={[]} />;
  }
}


