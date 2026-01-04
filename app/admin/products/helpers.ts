const OVERRIDE_BASE_URL =
  process.env.ADMIN_BASE_URL ||
  process.env.NEXT_PUBLIC_BASE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.BASE_URL;

function normalizePath(path: string) {
  if (path.startsWith('/')) {
    return path;
  }
  return `/${path}`;
}

export async function fetchAdminApi(path: string, init?: RequestInit) {
  const baseUrl = OVERRIDE_BASE_URL ? OVERRIDE_BASE_URL.replace(/\/$/, '') : '';
  const url = baseUrl ? `${baseUrl}${normalizePath(path)}` : normalizePath(path);
  const { cache, ...rest } = init || {};
  return fetch(url, {
    ...rest,
    cache: cache ?? 'no-store',
  });
}


