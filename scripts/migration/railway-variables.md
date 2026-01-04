# Railway Environment Variables

This file documents all environment variables needed for Railway deployment, separated by environment (Production and Development).

## 🚂 How Railway Environments Work

### Environment Structure
Railway uses **environments** to separate different deployment stages:
- **Production**: Your live, customer-facing application
- **Development**: Your testing/staging environment

### Key Concepts:
1. **Each environment is isolated** - Variables in "development" don't affect "production" and vice versa
2. **Services are linked to environments** - When you deploy a service, it uses variables from its assigned environment
3. **Variables sync automatically** - When you update a variable in Railway's dashboard, it's immediately available to your running services (no restart needed for most cases)

### How to Verify Variables Are Syncing:

1. **Check Railway Dashboard:**
   - Go to your project → Select environment (Production or Development)
   - Click "Variables" tab
   - You'll see all variables for that environment

2. **Verify in Running Service:**
   - Go to your service → "Deployments" tab
   - Click on a deployment → "View Logs"
   - Check if your app logs show the correct values (be careful not to log secrets!)

3. **Test Environment-Specific Behavior:**
   - Set a test variable like `ENV_NAME="production"` or `ENV_NAME="development"`
   - Add logging in your app: `console.log('Environment:', process.env.ENV_NAME)`
   - Deploy to both environments and verify logs show different values

4. **Railway CLI (Alternative):**
   ```bash
   # Install Railway CLI
   npm i -g @railway/cli
   
   # Login
   railway login
   
   # List variables for an environment
   railway variables --environment production
   railway variables --environment development
   ```

### Important Notes:
- ⚠️ **Variables are NOT automatically synced between environments** - You must set them separately
- ⚠️ **Changing a variable requires a redeploy** for Next.js to pick it up (Railway auto-redeploys on variable changes)
- ✅ **Service-level variables override environment variables** (if you set a variable on a service, it takes precedence)

---

## 📋 Required Environment Variables

### Database Variables

#### Production Environment
```bash
# Railway Database Connection (Production)
DATABASE_URL="postgresql://postgres:[PROD_PASSWORD]@[PROD_HOST]:5432/railway"

# Optional: Railway-specific URLs (if different from DATABASE_URL)
RAILWAY_DATABASE_PUBLIC_URL="postgresql://postgres:[PROD_PASSWORD]@[PROD_PUBLIC_HOST]:[PORT]/railway"
RAILWAY_DATABASE_URL="postgresql://postgres:[PROD_PASSWORD]@postgres.railway.internal:5432/railway"
```

#### Development Environment
```bash
# Railway Database Connection (Development)
DATABASE_URL="postgresql://postgres:[DEV_PASSWORD]@[DEV_HOST]:5432/railway"

# Optional: Railway-specific URLs (if different from DATABASE_URL)
RAILWAY_DATABASE_PUBLIC_URL="postgresql://postgres:[DEV_PASSWORD]@[DEV_PUBLIC_HOST]:[PORT]/railway"
RAILWAY_DATABASE_URL="postgresql://postgres:[DEV_PASSWORD]@postgres.railway.internal:5432/railway"
```

---

### Supabase Variables (for migration/fallback)

#### Production Environment
```bash
# Supabase (Production - keep until migration complete)
NEXT_PUBLIC_SUPABASE_URL="https://[PROD_PROJECT_REF].supabase.co"
SUPABASE_SERVICE_ROLE_KEY="[PROD_SERVICE_ROLE_KEY]"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[PROD_ANON_KEY]"

# Supabase Storage Buckets (Production)
SUPABASE_BUCKET_PUBLIC="slingshot-images-prod"
SUPABASE_BUCKET_RAW="slingshot-raw-prod"
```

#### Development Environment
```bash
# Supabase (Development - keep until migration complete)
NEXT_PUBLIC_SUPABASE_URL="https://[DEV_PROJECT_REF].supabase.co"
SUPABASE_SERVICE_ROLE_KEY="[DEV_SERVICE_ROLE_KEY]"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[DEV_ANON_KEY]"

# Supabase Storage Buckets (Development)
SUPABASE_BUCKET_PUBLIC="slingshot-images-dev"
SUPABASE_BUCKET_RAW="slingshot-raw"
```

---

### Railway Storage Variables (S3-Compatible)

#### Production Environment - Public Bucket
```bash
# Railway S3-Compatible Storage - PUBLIC BUCKET (Production)
RAILWAY_STORAGE_TYPE="s3"
RAILWAY_STORAGE_ENDPOINT="https://storage.railway.app"
RAILWAY_STORAGE_REGION="auto"
RAILWAY_STORAGE_ACCESS_KEY_ID="[PROD_PUBLIC_ACCESS_KEY]"
RAILWAY_STORAGE_SECRET_ACCESS_KEY="[PROD_PUBLIC_SECRET_KEY]"
RAILWAY_STORAGE_BUCKET_PUBLIC="[PROD_PUBLIC_BUCKET_NAME]"
RAILWAY_STORAGE_PUBLIC_URL_BASE="https://[PROD_STORAGE_DOMAIN].com"
```

#### Development Environment - Public Bucket
```bash
# Railway S3-Compatible Storage - PUBLIC BUCKET (Development)
RAILWAY_STORAGE_TYPE="s3"
RAILWAY_STORAGE_ENDPOINT="https://storage.railway.app"
RAILWAY_STORAGE_REGION="auto"
RAILWAY_STORAGE_ACCESS_KEY_ID="[DEV_PUBLIC_ACCESS_KEY]"
RAILWAY_STORAGE_SECRET_ACCESS_KEY="[DEV_PUBLIC_SECRET_KEY]"
RAILWAY_STORAGE_BUCKET_PUBLIC="[DEV_PUBLIC_BUCKET_NAME]"
RAILWAY_STORAGE_PUBLIC_URL_BASE="https://[DEV_STORAGE_DOMAIN].com"
```

#### Production Environment - Raw/Admin Bucket
```bash
# Railway S3-Compatible Storage - RAW/ADMIN BUCKET (Production)
# For admin-only files: raw images, cropped images, admin uploads, private assets
RAILWAY_STORAGE_RAW_TYPE="s3"
RAILWAY_STORAGE_RAW_ENDPOINT="https://storage.railway.app"
RAILWAY_STORAGE_RAW_REGION="auto"
RAILWAY_STORAGE_RAW_ACCESS_KEY_ID="[PROD_RAW_ACCESS_KEY]"
RAILWAY_STORAGE_RAW_SECRET_ACCESS_KEY="[PROD_RAW_SECRET_KEY]"
RAILWAY_STORAGE_BUCKET_RAW="[PROD_RAW_BUCKET_NAME]"
```

#### Development Environment - Raw/Admin Bucket
```bash
# Railway S3-Compatible Storage - RAW/ADMIN BUCKET (Development)
# For admin-only files: raw images, cropped images, admin uploads, private assets
RAILWAY_STORAGE_RAW_TYPE="s3"
RAILWAY_STORAGE_RAW_ENDPOINT="https://storage.railway.app"
RAILWAY_STORAGE_RAW_REGION="auto"
RAILWAY_STORAGE_RAW_ACCESS_KEY_ID="[DEV_RAW_ACCESS_KEY]"
RAILWAY_STORAGE_RAW_SECRET_ACCESS_KEY="[DEV_RAW_SECRET_KEY]"
RAILWAY_STORAGE_BUCKET_RAW="[DEV_RAW_BUCKET_NAME]"
```

---

### Application URLs

#### Production Environment
```bash
# Site URLs (Production)
SITE_URL="https://your-production-domain.com"
NEXT_PUBLIC_SITE_URL="https://your-production-domain.com"
```

#### Development Environment
```bash
# Site URLs (Development)
SITE_URL="https://your-dev-domain.railway.app"
NEXT_PUBLIC_SITE_URL="https://your-dev-domain.railway.app"
```

---

### Email Configuration

#### Production Environment
```bash
# Resend API (Production)
RESEND_API_KEY="[PROD_RESEND_API_KEY]"
RESEND_FROM_EMAIL="noreply@your-production-domain.com"

# OR SMTP (Production)
SMTP_HOST="smtp.your-provider.com"
SMTP_PORT="587"
SMTP_USER="[PROD_SMTP_USER]"
SMTP_PASS="[PROD_SMTP_PASSWORD]"
SMTP_SECURE="false"
SMTP_FROM="noreply@your-production-domain.com"
```

#### Development Environment
```bash
# Resend API (Development)
RESEND_API_KEY="[DEV_RESEND_API_KEY]"
RESEND_FROM_EMAIL="noreply@your-dev-domain.com"

# OR SMTP (Development)
SMTP_HOST="smtp.your-provider.com"
SMTP_PORT="587"
SMTP_USER="[DEV_SMTP_USER]"
SMTP_PASS="[DEV_SMTP_PASSWORD]"
SMTP_SECURE="false"
SMTP_FROM="noreply@your-dev-domain.com"
```

---

### Admin/Development Flags

#### Production Environment
```bash
# Admin Login (Production - should be false)
EXPOSE_LOGIN_CODE="false"
```

#### Development Environment
```bash
# Admin Login (Development - can be true for testing)
EXPOSE_LOGIN_CODE="true"
```

---

## 🔄 Migration Status

### Production Environment
- [ ] Database migrated
- [ ] Storage buckets migrated
- [ ] Environment variables set in Railway Production
- [ ] Application tested with Railway services
- [ ] Supabase services deprecated (after verification)

### Development Environment
- [ ] Database migrated
- [ ] Storage buckets migrated
- [ ] Environment variables set in Railway Development
- [ ] Application tested with Railway services
- [ ] Supabase services deprecated (after verification)

---

## 📝 Notes

### Setting Variables in Railway Dashboard:

1. **Go to Railway Dashboard:**
   - Navigate to your project
   - Click on the environment dropdown (top right) → Select "Production" or "Development"

2. **Add Variables:**
   - Click "Variables" tab
   - Click "New Variable"
   - Enter variable name and value
   - Click "Add"

3. **Verify Variables:**
   - Check that variables appear in the list
   - Deploy your service and check logs to confirm values are loaded

### Best Practices:

- ✅ **Use different databases** for production and development
- ✅ **Use different storage buckets** for production and development
- ✅ **Never commit secrets** to git (use Railway's variable system)
- ✅ **Test in development** before deploying to production
- ✅ **Keep Supabase variables** until migration is fully verified
- ⚠️ **Double-check environment** before making changes (Railway shows current environment at top)

### Troubleshooting:

- **Variables not updating?** → Redeploy your service (Railway auto-redeploys on variable changes)
- **Wrong values in app?** → Check which environment your service is linked to
- **Can't see variables?** → Make sure you're viewing the correct environment (check dropdown)
- **Service using wrong env?** → Check service settings → Environment assignment

---

## 🔐 Security Reminders

- ⚠️ Keep this file secure - don't commit actual secrets
- ⚠️ Use Railway's variable system for all sensitive data
- ⚠️ Rotate keys regularly
- ⚠️ Use different keys for production and development
- ⚠️ Never log sensitive variables in application logs
