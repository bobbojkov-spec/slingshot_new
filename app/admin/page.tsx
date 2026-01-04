import DashboardClient from './DashboardClient';
import { fetchDashboardSnapshot } from '@/lib/supabase/adminData';

export default async function AdminDashboardPage() {
  const snapshot = await fetchDashboardSnapshot();
  return <DashboardClient snapshot={snapshot} />;
}

