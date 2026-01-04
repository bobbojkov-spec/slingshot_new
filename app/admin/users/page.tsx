import UsersTable from './UsersTable';

async function fetchAdmins() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || ''}/api/admin/users`, { cache: 'no-store' });
    if (!res.ok) return { users: [], error: 'Failed to load users' };
    const body = await res.json();
    return { users: body.users || [], error: null };
  } catch (err: any) {
    return { users: [], error: err?.message || 'Failed to load users' };
  }
}

export default async function AdminUsersPage() {
  const { users, error } = await fetchAdmins();
  return <UsersTable initialUsers={users} initialError={error} />;
}

