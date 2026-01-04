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
