import CategoriesListClient from './CategoriesListClient';
import { getAdminCategoriesList } from '@/lib/categories-admin';

export const revalidate = 0;

export default async function CategoriesPage() {
  try {
    const categories = await getAdminCategoriesList();
    return <CategoriesListClient categories={categories || []} />;
  } catch (error) {
    console.error('Failed to load categories', error);
    return <CategoriesListClient categories={[]} />;
  }
}

