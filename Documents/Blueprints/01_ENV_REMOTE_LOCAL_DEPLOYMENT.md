# Blueprint 01 — Environment, Remote/Local Parity, and Deploy Safety

## Purpose
Prevent deployment regressions caused by:
- **dev-only proxy magic** leaking into prod
- **missing build-time variables** (Vite/Next builds)
- **relative API calls** hitting the frontend instead of the backend
- **Railway/PaaS variable scope** mismatches

This is intentionally **project-agnostic**. Replace names/domains only.

---

## 1) Non‑negotiable rules

### Rule 1 — Never hardcode localhost
- No `http://localhost:*` anywhere in app logic.
- All environments must use a **single base URL resolver**.

### Rule 2 — Single source of truth for API base
- Exactly **one** place defines the API base URL.
- All fetch/axios clients use it.

### Rule 3 — Build-time variables are different from runtime variables
- **Vite** and many static builds “bake” env vars at build time.
- If the variable is missing during CI/PaaS build, the produced JS will contain `undefined` forever.

### Rule 4 — Fail fast (and loudly)
- If required env vars are missing, the system must:
  - log a specific error
  - exit (for backend) or use a safe fallback (for frontend)

### Rule 5 — Always remove trailing slash in base URLs
- Prevent `//endpoint` bugs.

---

## 2) Canonical patterns

### 2.1 Frontend: API base resolver (TypeScript)
Use this exact idea (adapt to Vite/Next/CRA).

```ts
// lib/apiBase.ts
export function getApiBaseUrl(): string {
  const raw = (
    // Vite
    (import.meta as any).env?.VITE_API_URL ||
    // Next.js (public var)
    process.env.NEXT_PUBLIC_API_URL ||
    // Generic
    process.env.API_URL
  ) as string | undefined;

  const normalized = (raw || '').trim().replace(/\/$/, '');

  // Never allow empty/relative in production builds.
  // If you must ship a fallback, make it explicit and correct.
  if (!normalized || normalized === 'undefined') {
    // OPTION A (preferred): crash in dev, fallback in prod.
    if (process.env.NODE_ENV !== 'production') {
      throw new Error('Missing API base URL env var (VITE_API_URL / NEXT_PUBLIC_API_URL).');
    }

    // OPTION B: hard fallback (only if you really need it)
    return 'https://YOUR-BACKEND-DOMAIN.example.com';
  }

  return normalized;
}
```

```ts
// lib/apiClient.ts
import { getApiBaseUrl } from './apiBase';

export const API_BASE_URL = getApiBaseUrl();

export async function apiFetch(path: string, init?: RequestInit) {
  const url = `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });

  // JSON trap guard
  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('application/json')) {
    const text = await res.text().catch(() => '');
    throw new Error(`API returned non-JSON (status ${res.status}). First chars: ${text.slice(0, 80)}`);
  }

  return res;
}
```

### 2.2 Backend: required env vars (Node)
```ts
const required = ['DATABASE_URL', 'SESSION_SECRET'];
for (const key of required) {
  if (!process.env[key]) {
    console.error(`Missing required env var: ${key}`);
    process.exit(1);
  }
}
```

### 2.3 Backend: health endpoint contract
Your backend **must** expose a health endpoint returning JSON.

```json
{
  "status": "ok",
  "services": {
    "database": "connected",
    "latency": "12ms"
  },
  "env": {
    "node_env": "production"
  }
}
```

---

## 3) PaaS / Railway specifics (apply similarly to any platform)

### 3.1 Variable scope
- Variables may be scoped by environment (dev/staging/prod).
- Ensure the variable exists in the **service** that needs it (frontend build vs backend runtime).

### 3.2 Verify build-time values in logs (Vite)
Add a build audit log:

```ts
// vite.config.ts
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  console.log('BUILD-TIME AUDIT: VITE_API_URL =', env.VITE_API_URL);
  return {};
});
```

### 3.3 Preflight command (before every push)
A preflight should verify:
- backend starts
- DB reachable
- frontend build passes
- API base URL is correct

If preflight fails: **stop, do not push**.

---

## 4) Sanity check script (portable)
Create a script that:
- prints API base
- pings health
- detects HTML vs JSON
- fails CI if DB is disconnected

Keep the concept from your existing `check-env.js` as a project template.

---

## 5) Production parity checklist
- [ ] No code assumes a dev proxy exists
- [ ] API base comes from env and is absolute
- [ ] Trailing slash removed
- [ ] Health endpoint returns JSON
- [ ] Frontend build works without running the dev server
- [ ] Backend logs real errors (not swallowed)
