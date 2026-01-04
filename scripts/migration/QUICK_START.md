# Quick Start: Supabase → Railway Migration

## 🚀 Quick Migration Steps

### 1. Document Your Variables

Add all your Railway variables to `.env.local` or `scripts/migration/railway-variables.md`:

```bash
# See scripts/migration/railway-variables.md for all required variables
```

### 2. Install Dependencies

```bash
npm install
```

This will install the AWS SDK needed for storage migration.

### 3. Migrate Database

```bash
npm run db:export:supabase-to-railway
```

### 4. Migrate Storage

```bash
npm run storage:migrate:to-railway
```

### 5. Update Database URLs (if needed)

If your database stores full Supabase URLs, update them:

```bash
npm run migration:update-urls
```

### 6. Update Railway Environment Variables

Add all Railway variables to your Railway project settings.

### 7. Test & Deploy

Test locally, then deploy to Railway.

---

## 📚 Full Documentation

See `scripts/migration/MIGRATION_GUIDE.md` for detailed instructions, troubleshooting, and best practices.

