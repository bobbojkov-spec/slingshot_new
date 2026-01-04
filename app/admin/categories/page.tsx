import CategoriesListClient from './CategoriesListClient';

export const revalidate = 0;

const ADMIN_BASE_URL =
  process.env.ADMIN_BASE_URL ||
  process.env.NEXT_PUBLIC_BASE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.BASE_URL ||
  'http://localhost:3000';

export default async function CategoriesPage() {
  try {
    const url = new URL('/api/admin/categories', ADMIN_BASE_URL).toString();
    const res = await fetch(url, { cache: 'no-store' });
    
    if (!res.ok) {
      console.error('Failed to load categories', res.status);
      return <CategoriesListClient categories={[]} />;
    }
    
    const data = await res.json();
    const categories = data?.categories || [];
    
    return <CategoriesListClient categories={categories} />;
  } catch (error) {
    console.error('Failed to load categories', error);
    return <CategoriesListClient categories={[]} />;
  }
}

