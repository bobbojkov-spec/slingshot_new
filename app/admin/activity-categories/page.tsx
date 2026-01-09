import ActivityCategoriesClient from './ActivityCategoriesClient';

export const revalidate = 0;

const ADMIN_BASE_URL =
  process.env.ADMIN_BASE_URL ||
  process.env.NEXT_PUBLIC_BASE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.BASE_URL ||
  'http://localhost:3000';

export default async function ActivityCategoriesPage() {
  try {
    const res = await fetch(`${ADMIN_BASE_URL}/api/admin/activity-categories`, { cache: 'no-store' });
    if (!res.ok) {
      console.error('Failed to load activity categories', res.status);
      return <ActivityCategoriesClient activityCategories={[]} />;
    }

    const data = await res.json();
    return <ActivityCategoriesClient activityCategories={data?.activityCategories || []} />;
  } catch (error) {
    console.error('Failed to load activity categories', error);
    return <ActivityCategoriesClient activityCategories={[]} />;
  }
}

