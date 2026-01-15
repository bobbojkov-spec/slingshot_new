# 🎯 Ride Engine - COMPLETE IMPORT PLAN

## ✅ What's Ready

1. **Database**: Add `WATERSPORTS` sport type
2. **Products**: 171 products ready to import  
3. **Images**: 789 images downloaded
4. **Test-First Approach**: Test with 2 images before full upload

---

## 📋 Step-by-Step Import

### Step 1: Add WATERSPORTS Sport Type

```bash
cd scripts/scrape-rideengine

# Add new sport type to database
psql $DATABASE_URL < rideengine_data/sql_import_final/00_add_watersports_sport.sql
```

**Then update Prisma:**
```prisma
// In prisma/schema.prisma
enum Sport { 
  KITE 
  WING 
  WAKE 
  FOIL 
  SUP 
  WATERSPORTS  // ← ADD THIS
}
```

```bash
npx prisma generate
```

---

### Step 2: TEST Upload (2 Images Only!)

```bash
# Install AWS SDK if needed
npm install @aws-sdk/client-s3

# Test with just 2 images first
node test_upload_2_images.js
```

This will:
- Upload only 2 images to Railway S3
- Store **relative paths** (e.g., `ride-engine/product/image.jpg`)
- Save results to `test-upload-results.json`
- Show you exactly what will be stored in database

**Verify the test:**
1. Check Railway dashboard - images uploaded?
2. Test `getPresignedUrl()` with one path
3. If works → proceed to Step 3

---

### Step 3: Import Products (Without Images First)

```bash
# Import all products with Shopify CDN images
psql $DATABASE_URL < rideengine_data/sql_import_final/00_IMPORT_ALL.sql
```

Now you have **171 products** with temporary Shopify images.

---

### Step 4: Full Image Upload (Optional)

If test worked and you want self-hosted images:

```bash
# Upload all 789 images (takes ~10-15 min)
node upload_images_to_s3.js

# Generate SQL to update image paths
python3 009_generate_db_import_with_relative_paths.py

# Update database to use S3 paths
psql $DATABASE_URL < rideengine_data/sql_import_final/05_ride_engine_with_s3_paths.sql
```

---

## 🔍 Verification

### Check Products Imported
```sql
-- Should return 171
SELECT COUNT(*) FROM "Product" 
WHERE sport = 'WATERSPORTS';

-- Check Ride Engine collection
SELECT c.title, COUNT(cp."productId") 
FROM "Collection" c
JOIN "CollectionProduct" cp ON c.id = cp."collectionId"
WHERE c."canonicalSlug" = 'ride-engine'
GROUP BY c.title;
```

### Check Images
```sql
-- Sample product images
SELECT p.title, pi.url, pi."sortOrder"
FROM "Product" p
JOIN "ProductImage" pi ON p.id = pi."productId"
WHERE p."canonicalSlug" LIKE 'ride-engine-%'
LIMIT 10;
```

---

## ⚠️ Important Notes

### Image Paths (IMAGE_HANDLING_GUIDE.md)
- **Database**: Stores RELATIVE path (`ride-engine/product/image.jpg`)
- **API**: Uses `getPresignedUrl()` to create signed URLs
- **Frontend**: Displays signed URL (no processing)

### API Implementation
When fetching products:
```typescript
import { getPresignedUrl } from '@/lib/railway/storage';

// In API route
const products = await Promise.all(
  rows.map(async (row) => ({
    ...row,
    image: row.image_path 
      ? await getPresignedUrl(row.image_path) 
      : '/placeholder.jpg'
  }))
);
```

---

## 🚀 Quick Commands Summary

```bash
# 1. Database setup
psql $DATABASE_URL < rideengine_data/sql_import_final/00_add_watersports_sport.sql
npx prisma generate

# 2. TEST images (2 only)
node test_upload_2_images.js

# 3. Import products
psql $DATABASE_URL < rideengine_data/sql_import_final/00_IMPORT_ALL.sql

# 4. (Optional) Full image upload
node upload_images_to_s3.js
python3 009_generate_db_import_with_relative_paths.py
psql $DATABASE_URL < rideengine_data/sql_import_final/05_ride_engine_with_s3_paths.sql
```

---

## 📊 What You Get

- **171 Products**: All Ride Engine catalog
- **Sport**: `WATERSPORTS` (won't appear on KITE/WING/WAKE pages)
- **Collection**: "Ride Engine" brand
- **Images**: Either Shopify CDN OR self-hosted S3
- **Proper Architecture**: Following IMAGE_HANDLING_GUIDE.md

---

**Ready to start? Begin with Step 1!** 🎉
