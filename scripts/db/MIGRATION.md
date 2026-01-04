# Database Migration: Supabase → Railway

This guide explains how to export your database from Supabase and import it into Railway.

## Prerequisites

1. **Install PostgreSQL client tools** (if not already installed):
   ```bash
   # macOS
   brew install postgresql@15
   
   # Or use Homebrew's postgresql (latest)
   brew install postgresql
   ```

2. **Get your connection strings**:
   - **Supabase DB URL**: Supabase Dashboard → Project Settings → Database → Connection string (URI)
     - Format: `postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres`
   - **Railway DB URL**: Railway → Postgres Service → Connect → Postgres Connection URL
     - Format: `postgresql://postgres:[PASSWORD]@[HOST]:5432/railway`

## Migration Steps

### Step 1: Set up `.env.local`

If you don't have `.env.local` yet:
```bash
cp env.local.template .env.local
```

Then edit `.env.local` and add:
- `SUPABASE_DATABASE_URL` = Your Supabase Postgres connection string
- `RAILWAY_DATABASE_URL` = Your Railway Postgres connection string

### Step 2: Run the migration

```bash
npm run db:export:supabase-to-railway
```

Or directly:
```bash
SUPABASE_DATABASE_URL="postgresql://..." RAILWAY_DATABASE_URL="postgresql://..." bash scripts/db/export-supabase-to-railway.sh
```

### Step 3: Update Railway environment variables

After migration completes:
1. Go to Railway → Your Service → Variables
2. Set `DATABASE_URL` to your Railway Postgres connection string
3. Keep all Supabase variables (`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, etc.) - those stay the same

### Step 4: Test

- Railway will automatically redeploy with the new `DATABASE_URL`
- Check the logs to ensure the app connects successfully
- Test critical database operations

## What Gets Migrated

✅ **Included:**
- All your application tables (products, product_images, admin_profiles, etc.)
- All data in those tables
- Indexes, constraints, sequences

❌ **Excluded (Supabase-specific):**
- `auth.*` tables (Supabase Auth)
- `storage.*` tables (Supabase Storage)
- `realtime.*` tables (Supabase Realtime)
- `extensions.*` (Supabase extensions)

## Notes

- **Storage & Auth stay on Supabase**: Your images/files and user authentication remain on Supabase. Only the database (products, orders, etc.) moves to Railway.
- **Backup first**: The script doesn't modify your Supabase database, but consider making a backup anyway.
- **Downtime**: The migration itself is read-only on Supabase, but there may be a brief window where Railway isn't fully synced. Plan accordingly.

## Troubleshooting

**"command not found: pg_dump"**
- Install PostgreSQL client tools (see Prerequisites)

**"Connection refused"**
- Verify your connection strings are correct
- Check if your IP needs to be whitelisted (Supabase) or if Railway allows connections from your IP

**"permission denied"**
- Make sure you're using the correct database user credentials
- Railway Postgres should have full permissions automatically

**"relation already exists"**
- Railway database already has tables? The script will attempt to import anyway. If you need a clean slate, drop the Railway database first (Railway → Postgres → Settings → Delete).

