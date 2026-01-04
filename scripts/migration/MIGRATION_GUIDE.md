# Complete Migration Guide: Supabase → Railway

This guide covers migrating both the database and storage buckets from Supabase to Railway.

## 📋 Prerequisites

1. **Install PostgreSQL client tools** (for database migration):
   ```bash
   # macOS
   brew install postgresql@15
   ```

2. **Install AWS SDK** (for storage migration):
   ```bash
   npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
   ```

3. **Get all connection strings and credentials** (see `railway-variables.md`)

## 🔐 Step 1: Configure Environment Variables

### Option A: Use `.env.local` (Recommended)

Add all variables to `.env.local`:

```bash
# Supabase (Source)
NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT_REF].supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
SUPABASE_DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres"
SUPABASE_BUCKET_PUBLIC="slingshot-images-dev"
SUPABASE_BUCKET_RAW="slingshot-raw"

# Railway Database (Target)
RAILWAY_DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/railway"

# Railway Storage (Target - S3-Compatible)
RAILWAY_STORAGE_TYPE="s3"  # or "minio" or "r2"
RAILWAY_STORAGE_ENDPOINT="https://s3.amazonaws.com"
RAILWAY_STORAGE_REGION="us-east-1"
RAILWAY_STORAGE_ACCESS_KEY_ID="your-access-key"
RAILWAY_STORAGE_SECRET_ACCESS_KEY="your-secret-key"
RAILWAY_STORAGE_BUCKET_PUBLIC="slingshot-images-dev"
RAILWAY_STORAGE_BUCKET_RAW="slingshot-raw"
RAILWAY_STORAGE_PUBLIC_URL_BASE="https://your-storage-domain.com"
```

### Option B: Document in `railway-variables.md`

Use `scripts/migration/railway-variables.md` as a template and fill in your values.

## 🗄️ Step 2: Migrate Database

### Run the database migration:

```bash
npm run db:export:supabase-to-railway
```

Or directly:

```bash
source .env.local
bash scripts/db/export-supabase-to-railway.sh
```

This will:
- Export all tables and data from Supabase
- Import into Railway PostgreSQL
- Exclude Supabase-specific tables (auth, storage, realtime)

### Verify Database Migration:

```bash
# Test Railway database connection
RAILWAY_DATABASE_URL="postgresql://..." node lib/db/test-connection-simple.js
```

## 📦 Step 3: Migrate Storage Buckets

### Run the storage migration:

```bash
node scripts/migration/migrate-storage-to-railway.js
```

This will:
- List all files in Supabase buckets (`slingshot-images-dev` and `slingshot-raw`)
- Download each file from Supabase
- Upload to Railway S3-compatible storage
- Preserve file paths and metadata

### What Gets Migrated:

✅ **Included:**
- All files from `slingshot-images-dev` bucket
- All files from `slingshot-raw` bucket
- File paths and structure
- File content and metadata

❌ **Not Migrated:**
- Supabase storage metadata (if any)
- Access policies (will need to be reconfigured on Railway)

## 🔄 Step 4: Update Application Code

### Update Storage Client

The application currently uses Supabase storage. After migration, you can:

**Option A: Switch to Railway storage** (recommended for full migration)

Update imports:
```typescript
// Before
import { uploadPublicImage, getPublicImageUrl } from '@/lib/supabase/storage';

// After
import { uploadPublicImage, getPublicImageUrl } from '@/lib/railway/storage';
```

**Option B: Keep both** (for gradual migration)

Create a storage adapter that routes to the appropriate service based on environment variables.

### Update Database Image URLs

If your database stores full Supabase URLs, you may need to update them:

```sql
-- Example: Update product_images URLs
UPDATE product_images 
SET url = REPLACE(url, 'https://[PROJECT_REF].supabase.co', 'https://your-railway-storage.com')
WHERE url LIKE '%supabase.co%';
```

## ⚙️ Step 5: Update Railway Environment Variables

1. Go to Railway → Your Service → Variables
2. Update/add the following:

```bash
# Database
DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/railway"

# Storage (if using Railway storage)
RAILWAY_STORAGE_TYPE="s3"
RAILWAY_STORAGE_ENDPOINT="https://s3.amazonaws.com"
RAILWAY_STORAGE_REGION="us-east-1"
RAILWAY_STORAGE_ACCESS_KEY_ID="your-access-key"
RAILWAY_STORAGE_SECRET_ACCESS_KEY="your-secret-key"
RAILWAY_STORAGE_BUCKET_PUBLIC="slingshot-images-dev"
RAILWAY_STORAGE_BUCKET_RAW="slingshot-raw"
RAILWAY_STORAGE_PUBLIC_URL_BASE="https://your-storage-domain.com"

# Keep Supabase vars if still using Supabase Auth
NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT_REF].supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

## ✅ Step 6: Test the Migration

1. **Test Database:**
   - Verify all tables exist
   - Check data integrity
   - Test critical queries

2. **Test Storage:**
   - Verify files are accessible
   - Test image uploads
   - Check public URLs work

3. **Test Application:**
   - Run the app locally with Railway variables
   - Test product pages (images should load)
   - Test admin image uploads
   - Check all functionality

## 🔄 Step 7: Switch Production

Once everything is tested:

1. **Update Railway production variables** (as in Step 5)
2. **Redeploy** your Railway service
3. **Monitor** logs for any errors
4. **Verify** production functionality

## 📝 Migration Checklist

- [ ] Environment variables documented in `railway-variables.md` or `.env.local`
- [ ] Database migrated (Step 2)
- [ ] Database connection tested
- [ ] Storage buckets migrated (Step 3)
- [ ] Storage access tested
- [ ] Application code updated (if needed)
- [ ] Database URLs updated (if needed)
- [ ] Railway environment variables configured
- [ ] Local testing completed
- [ ] Production deployment tested
- [ ] Monitoring set up

## 🆘 Troubleshooting

### Database Migration Issues

**"command not found: pg_dump"**
- Install PostgreSQL client tools: `brew install postgresql@15`

**"Connection refused"**
- Verify connection strings are correct
- Check IP whitelisting (Supabase) or firewall rules

**"permission denied"**
- Ensure correct database credentials
- Railway Postgres should have full permissions automatically

### Storage Migration Issues

**"Missing Railway Storage configuration"**
- Verify all `RAILWAY_STORAGE_*` variables are set
- Check `.env.local` file

**"Failed to upload"**
- Verify S3 credentials are correct
- Check bucket names exist on Railway storage
- Verify endpoint URL is correct

**"Files not accessible"**
- Check `RAILWAY_STORAGE_PUBLIC_URL_BASE` is set correctly
- Verify bucket permissions (public read for public bucket)
- Test URL format matches your storage provider

### Application Issues

**"Images not loading"**
- Check storage URLs in database
- Verify public URL base is correct
- Test storage client connection

**"Upload fails"**
- Verify Railway storage credentials
- Check bucket permissions (write access)
- Review error logs

## 📚 Additional Resources

- [Railway PostgreSQL Documentation](https://docs.railway.app/databases/postgresql)
- [AWS S3 SDK Documentation](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/s3-examples.html)
- [MinIO Documentation](https://min.io/docs/)
- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)

## 🔒 Security Notes

- Never commit `.env.local` or `railway-variables.md` with real credentials
- Use Railway's environment variable management for production
- Rotate credentials after migration
- Keep Supabase as backup until migration is fully verified

