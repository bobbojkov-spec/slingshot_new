import ProductsListClient from './ProductsListClient';
import { getAdminProducts } from '@/lib/data/products-admin';

export const revalidate = 0;

export default async function ProductsPage() {
  const products = await getAdminProducts();
  return <ProductsListClient products={products} />;
}


