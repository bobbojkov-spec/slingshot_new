# Playbook: Vite (Lovable) to Next.js Conversion

**Objective:** Port a design 1:1 from `apps/frontend-loveable` (Vite) to `apps/frontend-next` (Next.js App Router) with minimal logic rewriting.

## 1. The "Copy-Paste" Foundation
Before moving pages, ensure the styling engine is identical.

1.  **Tailwind Config:**
    *   Copy `tailwind.config.js` from Vite to Next.js.
    *   Ensure `content` paths in the config match the Next.js structure (e.g., `./app/**/*.{ts,tsx}`, `./components/**/*.{ts,tsx}`).
2.  **Global Styles:**
    *   Copy the contents of `src/index.css` (Vite) to `app/globals.css` (Next.js).
    *   Keep the `@tailwind` directives at the top.
3.  **Utils:**
    *   Copy `src/lib/utils.ts` (standard shadcn/ui helper) to `lib/utils.ts` in Next.js.

## 2. Component Migration
*   **Action:** Copy the entire `src/components` folder from Vite to `components` in Next.js.
*   **Rule:** Do not refactor into Server Components yet. Our goal is visual parity first.

## 3. Page Conversion Strategy
Next.js App Router uses file-system routing.

### Step A: Create the Route
If the Vite route is `/about`, create `app/about/page.tsx`.

### Step B: The "Client Wrapper" Pattern
Since Lovable code relies heavily on React hooks (`useState`, `useEffect`), the page **must** be a Client Component.

**Template for `app/page.tsx` (or any route):**

```tsx
'use client'; // <--- CRITICAL: This makes it behave like Vite

// Paste the exact content of the Lovable page component here
import Hero from '@/components/Hero';

export default function Page() {
  // ... original Lovable logic
  return (
    <div>
      <Hero />
    </div>
  );
}
```

## 4. Syntax Replacements (The "Fix List")
You must find and replace these specific patterns.

| Feature | Vite (React Router) | Next.js (App Router) |
| :--- | :--- | :--- |
| **Link Import** | `import { Link } from 'react-router-dom'` | `import Link from 'next/link'` |
| **Hook Import** | `import { useNavigate } from 'react-router-dom'` | `import { useRouter } from 'next/navigation'` |
| **Navigation** | `const navigate = useNavigate();`<br>`navigate('/path')` | `const router = useRouter();`<br>`router.push('/path')` |
| **Images** | `<img src="..." />` | `<Image src="..." width={500} height={300} alt="..." />`<br>*(Import from `next/image`)* |
| **Params** | `useParams()` | `params` prop in page component (or `useParams` hook) |

## 5. Handling "Window is not defined"
If a component crashes because it tries to access `window` or `document` during Server Side Rendering (SSR):

**Solution:** Dynamic Import with SSR disabled.

```tsx
import dynamic from 'next/dynamic';

const MapComponent = dynamic(() => import('@/components/Map'), { 
  ssr: false,
  loading: () => <p>Loading Map...</p>
});
```

## 6. Final Verification
1.  Run `npm run dev`.
2.  Check the console for Hydration Errors (Text content does not match server-rendered HTML).
3.  If hydration errors persist on a specific component, wrap it in a `<NoSSR>` helper or use `useEffect` to render it only after mount.