# Slingshot New — Architecture & Deployment Contract

This repository is a **controlled monorepo** used for fast design iteration and safe backend development.

⚠️ **This README is not documentation — it is a contract.**
Anyone working on this project must follow it exactly.

---

## 1. High-Level Architecture

This project is intentionally split into **two independent systems**:

### A) Backend / Admin (Next.js)
- Location: `apps/admin-next`
- Tech: Next.js
- Responsibilities:
  - Admin UI
  - API
  - Database access
- Deployment: Railway
- Database access: **READ-ONLY Prisma**
- Assets: Uses bucket storage (no long-term `/public` usage)

### B) Frontend (Loveable)
- Location: `apps/frontend-loveable`
- Tech: Loveable (separate system / workflow)
- Responsibilities:
  - Customer-facing UI (Home, Shop, PDP)
- Deployment: Railway (separate service)
- Database access: ❌ NONE
- Data source: Admin API only
- Assets: Uses the **same bucket URLs** as backend

### C) Public Frontend (Next.js)
- Location: `apps/frontend-next`
- Tech: Next.js App Router
- Responsibilities:
  - Public-facing website that now serves as the default app entry.
  - Mirrors the data surface of the Loveable frontend while supporting the `/admin` proxy.
- Deployment: Any host that can route `/` to this app and `/admin` to the admin panel.
- Database access: ❌ NONE (consumes APIs from `admin-next`)

🚫 These two systems MUST NOT be merged.
They communicate **only via API and shared buckets**.

---

## 2. Repository Structure
slingshot_new/
├─ apps/
│  ├─ admin-next/          # Next.js backend + admin
│  ├─ frontend-loveable/   # Loveable frontend
├─ README.md
├─ .gitignore




## ⚠️ DATABASE SAFETY RULE

❌ NEVER run:
- prisma migrate
- prisma migrate dev
- prisma migrate deploy
- prisma db push
- prisma db pull
- prisma migrate reset


---

## 3. Environments

There are **two environments**, fully separated.

### DEVELOPMENT
- Branch: `dev`
- Railway project: `slingshot_new`
- Database: DEV DB
- Bucket: DEV bucket

### PRODUCTION
- Branch: `main`
- Railway project: `slingshot`
- Database: PROD DB
- Bucket: PROD bucket

🚫 NEVER mix environments  
🚫 NEVER point DEV to PROD resources

---

## 4. Prisma Rules (HARD LOCK)

Prisma is used **ONLY as a typed ORM client**.

### ❌ FORBIDDEN COMMANDS
Never run:
- `prisma migrate`
- `prisma migrate dev`
- `prisma migrate deploy`
- `prisma db push`
- `prisma db pull`
- `prisma migrate reset`

### ✅ ALLOWED COMMAND
- `prisma generate`

All database schema and data changes are handled manually via:
- SQL
- TablePlus

Prisma migrations are **disabled by design**.

---

## 5. Database Policy

- Databases are created and cloned manually
- Data is copied using:
  - SQL dumps
  - TablePlus export/import
- No automatic schema sync
- No migration pipelines

This protects production data and prevents accidental wipes.

---

## 6. Bucket / Assets Policy (CRITICAL)

- All images and assets must live in **buckets**
- `/public` is temporary only (bootstrapping)
- Long-term rule:
  - Backend returns **bucket URLs**
  - Frontend consumes **bucket URLs**

### Required setup
- DEV bucket
- PROD bucket
- No bucket sharing across environments

### Migration rule
- Assets from PROD bucket must be copied into DEV bucket
- Assets currently in `/public` must be uploaded to the bucket

---

## 7. Railway Deployment Rules

### Admin Backend (apps/admin-next)
- Service root: `apps/admin-next`
- Branch:
  - `dev` → DEV
  - `main` → PROD
- Required env vars:
  - `DATABASE_URL`
  - `BUCKET_NAME`
  - `BUCKET_KEY`
  - `BUCKET_SECRET`
  - `NODE_ENV`

### Frontend (apps/frontend-loveable)
- Separate Railway service
- Required env vars:
  - `API_BASE_URL`
  - `BUCKET_PUBLIC_BASE_URL`
  - `ENV` (`dev` / `prod`)

⚠️ NO environment variables are stored locally.
Everything lives in Railway.

---

## 8. Development Workflow

### Design changes
- Done in Loveable
- Copied into `apps/frontend-loveable`
- No Tailwind fights
- No backend coupling

### Backend changes
- Done in `apps/admin-next`
- APIs evolve independently
- Database stays protected

### Deployment
- `dev` branch → DEV environment
- `main` branch → PROD environment
- Merge only when stable

---

## 9. Absolute Rules

❌ No Prisma migrations  
❌ No local DB assumptions  
❌ No shared buckets  
❌ No frontend DB access  
❌ No mixing frontend & admin code  

✅ Everything deployed via Railway  
✅ Everything environment-isolated  
✅ Everything explicit and controlled  

---

## 10. If You Are an Agent or New Contributor

Before making **any** change:
1. Read this README fully
2. Confirm understanding
3. Ask before touching:
   - Prisma
   - Database
   - Buckets
   - Deployment settings

This project prioritizes **safety, speed, and clarity** over convenience.

## 11. Path-based routing for development & deploy

The monorepo now exposes one public domain:

- `/` → `apps/frontend-next` (default storefront)
- `/admin` → `apps/admin-next` (admin panel)

### Development workflow

1. Start the frontend:  
   `cd /Users/borislavbojkov/dev/slingshot_new && npm run dev:frontend` (runs on port 3000)
2. Start the admin panel:  
   `cd /Users/borislavbojkov/dev/slingshot_new && npm run dev:admin` (runs on port 3001)
3. Start the proxy server:  
   `cd /Users/borislavbojkov/dev/slingshot_new && npm run dev:proxy` (listens on port 4000 and routes / and /admin as described)
4. Alternatively, run `npm run dev:all` from the repo root to launch all three commands via `concurrently`.

The proxy honors `FRONTEND_PORT`, `ADMIN_PORT`, and `PORT` if you need to change the defaults.

### Production (or any reverse proxy)

Replace the hostname in `deploy/nginx/reverse-proxy.conf` with your actual domain. That config:

- proxies `/admin` to port `3001`
- proxies `/` to port `3000`

Use the same port pair in your hosting platform so `/` always serves `frontend-next` and `/admin` always hits `admin-next`.

---



✅ ONLY allowed Prisma command:
- prisma generate

Database changes are handled manually via SQL / TablePlus.

---

## 12. Google Analytics 4 (GA4) Integration

This project includes full Google Analytics 4 tracking for comprehensive website statistics.

### Setup

#### Environment Variables

Add the following to your `.env.local` file:

```bash
NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-RCW3Z1EN0T
```

For production, add this environment variable to your Railway deployment settings.

#### What's Tracked

The GA4 implementation automatically tracks:

1. **Pageviews** - Every route change in the Next.js App Router
2. **Custom Events** - Via the helper API (see usage below)
3. **E-commerce Events** - Product views, add to cart, purchases, etc.
4. **User Engagement** - Searches, form submissions, video interactions

### Implementation Details

The GA4 integration consists of:

- **`lib/ga4.ts`** - Type-safe helper library with tracking functions
- **`components/GoogleAnalytics.tsx`** - Script loader component
- **`components/GA4RouteTracker.tsx`** - Automatic pageview tracking
- **`app/layout.tsx`** - Integration point in root layout

### Usage Examples

#### Track Custom Events

```typescript
import { event } from '@/lib/ga4';

// Simple event
event('button_click', { button_name: 'subscribe' });

// Search event
import { engagement } from '@/lib/ga4';
engagement.search('kitesurf board');
```

#### Track E-commerce Events

```typescript
import { ecommerce } from '@/lib/ga4';

// Product view
ecommerce.viewItem({
  currency: 'BGN',
  value: 1299.99,
  items: [{
    item_id: 'SLING-001',
    item_name: 'Slingshot Kite 12m',
    item_category: 'Kites',
    item_brand: 'Slingshot',
    price: 1299.99,
    quantity: 1
  }]
});

// Add to cart
ecommerce.addToCart({
  currency: 'BGN',
  value: 1299.99,
  items: [/* same format as above */]
});

// Purchase
ecommerce.purchase({
  transaction_id: 'ORDER-12345',
  currency: 'BGN',
  value: 1299.99,
  tax: 259.99,
  shipping: 0,
  items: [/* same format as above */]
});
```

#### Track User Engagement

```typescript
import { engagement } from '@/lib/ga4';

// Form submission
engagement.submitForm('contact_form');

// Link click
engagement.clickLink('/products/kites', 'View All Kites');

// Video interaction
engagement.videoPlay('Slingshot 2024 Product Overview');
engagement.videoComplete('Slingshot 2024 Product Overview');
```

### Verification

#### Local Development

1. Start the development server: `npm run dev`
2. Open browser DevTools Console
3. Navigate between pages
4. Look for `[GA4] Pageview tracked: /path` messages

#### Production Verification

1. Visit [Google Analytics](https://analytics.google.com/)
2. Navigate to **Reports** → **Realtime**
3. Open your website in a new tab
4. Verify events appear in the Realtime report
5. Use **DebugView** for detailed event inspection:
   - Go to **Admin** → **DebugView**
   - Events will appear with full parameter details

### Best Practices

1. **Always check if GA4 is enabled** - The helper functions do this automatically
2. **Use descriptive event names** - Follow GA4 naming conventions (lowercase, underscores)
3. **Include relevant parameters** - Add context to events for better insights
4. **Test in DebugView** - Verify events before deploying to production
5. **Respect user privacy** - GA4 is loaded only when the measurement ID is configured

### Troubleshooting

**Events not showing up?**
- Check that `NEXT_PUBLIC_GA4_MEASUREMENT_ID` is set correctly
- Verify the measurement ID starts with `G-`
- Check browser console for errors
- Ensure ad blockers are disabled during testing

**Pageviews not tracking?**
- The `GA4RouteTracker` component must be mounted in the layout
- Check that `send_page_view: false` is set in the GA4 config
- Manual pageview events are sent on route changes

**Double counting pageviews?**
- Ensure `send_page_view: false` is set in GoogleAnalytics component
- Only one `GA4RouteTracker` should be mounted (in root layout)

---



# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
