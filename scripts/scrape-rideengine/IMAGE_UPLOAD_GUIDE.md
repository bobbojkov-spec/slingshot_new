# Ride Engine Images - Upload to S3

## Overview

You have **789 product images** downloaded in `rideengine_data/images/`. 

You can either:
1. **Keep Shopify CDN URLs** (easiest, already in SQL)
2. **Upload to your S3** and use self-hosted URLs

---

## Option 1: Keep Shopify CDN (Easiest)

The current SQL already uses Shopify CDN URLs. Just import as-is:

```bash
psql $DATABASE_URL < rideengine_data/sql_import_final/00_IMPORT_ALL.sql
```

**Pros:**
- ✅ No upload needed
- ✅ Fast CDN
- ✅ Works immediately

**Cons:**
- ❌ Depends on Shopify
- ❌ URLs might change

---

## Option 2: Upload to Your S3

### Prerequisites

Make sure `.env.local` has:
```env
S3_ENDPOINT=https://storage.railway.app
S3_REGION=auto
S3_BUCKET_PUBLIC=your-bucket-name
S3_ACCESS_KEY_ID_PUBLIC=your-key
S3_SECRET_ACCESS_KEY_PUBLIC=your-secret
```

### Upload Steps

```bash
cd scripts/scrape-rideengine

# 1. Install AWS SDK (if not already)
npm install @aws-sdk/client-s3

# 2. Upload all images
node upload_images_to_s3.js
```

This will:
- Upload all 789 images to S3
- Organize them as: `ride-engine/{product-handle}/{image.jpg}`
- Create `rideengine_data/image_url_mapping.json` with all URLs

### Update SQL with S3 URLs

After upload, generate SQL with S3 URLs:

```bash
# Generate SQL update script
python3 008_generate_s3_sql.py
```

Then import:

```bash
# 1. Import products (with Shopify URLs first)
psql $DATABASE_URL < rideengine_data/sql_import_final/00_IMPORT_ALL.sql

# 2. Update to S3 URLs
psql $DATABASE_URL < rideengine_data/sql_import_final/04_update_to_s3_urls.sql
```

---

## S3 Structure

Images will be organized as:

```
ride-engine/
├── hyperlock-design-upgrade-kit/
│   ├── 00_image.jpg
│   └── 01_image.jpg
├── offshore-pack-harness/
│   ├── 00_image.jpg
│   ├── 01_image.jpg
│   └── 02_image.jpg
└── ...
```

**URLs will be:**
```
https://storage.railway.app/your-bucket/ride-engine/product-handle/image.jpg
```

---

## Which Option to Choose?

### Use Shopify CDN if:
- You want to import quickly
- You're okay with external dependency
- You want to test first

### Use Your S3 if:
- You want full control
- You have S3 configured
- You want data sovereignty

---

## Quick Commands

### Shopify CDN (Current - No Upload Needed)
```bash
psql $DATABASE_URL < rideengine_data/sql_import_final/00_IMPORT_ALL.sql
```

### Your S3 (Upload First)
```bash
# Upload
node upload_images_to_s3.js

# Generate update SQL
python3 008_generate_s3_sql.py

# Import
psql $DATABASE_URL < rideengine_data/sql_import_final/00_IMPORT_ALL.sql
psql $DATABASE_URL < rideengine_data/sql_import_final/04_update_to_s3_urls.sql
```

---

## Verify Upload

After uploading, check a sample URL:
```bash
# From image_url_mapping.json
curl -I "https://storage.railway.app/your-bucket/ride-engine/product-handle/image.jpg"
```

Should return HTTP 200 OK.

---

**Recommendation: Start with Shopify CDN, upload to S3 later if needed**
