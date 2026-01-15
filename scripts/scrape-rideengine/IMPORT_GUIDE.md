# 🎉 Ride Engine Data Import - Complete Package

## ✅ What's Been Accomplished

Successfully scraped and prepared all Ride Engine product data for import into your Slingshot database!

### 📊 Data Collected

- **171 Products** - Complete product catalog
- **907 Variants** - All size/color variations
- **789 Images** - All product images downloaded
- **33 Categories** - Full category hierarchy
- **64 Tags** - For product filtering

---

## 📁 Directory Structure

```
rideengine_data/
├── raw/                                  # Raw scraped data
│   ├── all_products.json                 # All 171 products (Shopify format)
│   ├── all_collections.json              # All 33 collections
│   └── collections/                      # Individual collection files
│
├── images/                               # Downloaded product images
│   ├── hyperlock-design-upgrade-kit/
│   ├── offshore-pack-harness/
│   └── ... (171 product folders)
│
├── import_ready/                         # Cleaned JSON data
│   ├── products.json                     # Normalized product data
│   ├── categories.json                   # Category hierarchy  
│   └── import_summary.json               # Statistics
│
└── sql_import_prisma/                    # ⭐ READY TO IMPORT
    ├── 00_IMPORT_ALL.sql                 # Master import script
    ├── 01_ride_engine_collection.sql     # Brand collection
    ├── 02_ride_engine_products_all.sql   # All 171 products
    ├── 02_ride_engine_products_sample.sql # First 10 (for testing)
    └── 03_verify.sql                     # Verification queries
```

---

## 🎯 Import to Your Database

### Option 1: Test with Sample (Recommended First)

Test with just 10 products to verify everything works:

```bash
# Get your DATABASE_URL from .env
psql $DATABASE_URL < rideengine_data/sql_import_prisma/02_ride_engine_products_sample.sql
```

### Option 2: Import Everything

Once sample import works, import all 171 products:

```bash
psql $DATABASE_URL < rideengine_data/sql_import_prisma/00_IMPORT_ALL.sql
```

### Option 3: Import via Database Client

You can also copy-paste the SQL files into:
- pgAdmin
- DBeaver
- TablePlus
- Supabase SQL Editor
- Railway Database Console

---

## 🗺️ Data Mapping to Your Schema

### Products → `Product` Table

| Ride Engine | Your Database (`Product`) | Notes |
|-------------|---------------------------|-------|
| `title` | `title` | Product name |
| `handle` | `canonicalSlug` | Prefixed with `ride-engine-` |
| `product_type` | `productType` | Harnesses, Wetsuits, etc. |
| `description_html` | `descriptionRich` | Full HTML description |
| Auto-determined | `sport` | KITE, WING, FOIL, WAKE, or SUP |
| `published_at` | `status` | active/draft |
| `seo.title` | `seoMetaTitle` | SEO optimization |
| `seo.description` | `seoMetaDescription` | Meta description |

### Variants → `ProductVariant` Table

| Ride Engine | Your Database | Conversion |
|-------------|---------------|------------|
| `sku` | `sku` | Unique identifier |
| `price` (USD) | `priceEurCents` | **×0.92×100** |
| `compare_at_price` | `compareAtEurCents` | Sale pricing |
| `weight` | `weightGrams` | Product weight |
| `barcode` | `barcode` | EAN/UPC codes |
| `option1/2/3` | `optionValues` (JSON) | Size, Color, etc. |

### Images → `ProductImage` Table

| Ride Engine | Your Database | Notes |
|-------------|---------------|-------|
| `src` | `url` | Shopify CDN URL |
| `alt` | `alt` | Alt text |
| `position` | `sortOrder` | Display order |
| First image | Sets primary | First = primary |

### Collection → `Collection` Table

Creates "Ride Engine" brand collection that all products link to via `CollectionProduct`.

---

## 💰 Price Conversion

**Important**: All prices converted from USD to EUR!

- **Conversion Rate**: 0.92 EUR/USD (hardcoded)
- **Formula**: `EUR cents = USD price × 0.92 × 100`
- **Example**: $160.00 USD → 14,720 EUR cents (€147.20)

⚠️ **Update prices** if you need different rates or want to add markup!

---

## 🏷️ Sport Classification

Products automatically classified by tags:

```
WING  → Products tagged: wing, wingfoil, wingharness
KITE  → Products tagged: kite, kitesurf
FOIL  → Products tagged: foil
WAKE  → Products tagged: wake, wakeboard
SUP   → Products tagged: sup, paddle
```

Default: Harnesses → KITE, Others → WAKE

---

## 📸 Image Handling

### Current Setup
Images reference **Shopify CDN URLs** (fastest to import)

### Alternative: Self-Hosted Images

If you want to host images yourself:

1. **Images already downloaded** to `rideengine_data/images/`
2. **Upload to your S3** bucket (or storage)
3. **Update SQL** to reference your URLs
4. **Or run post-import script** to update URLs

```sql
-- Example: Update all Ride Engine image URLs
UPDATE "ProductImage" 
SET url = REPLACE(url, 
  'https://cdn.shopify.com/s/files/1/0279/1230/6822/', 
  'https://your-bucket.s3.amazonaws.com/ride-engine/'
)
WHERE url LIKE '%cdn.shopify.com%';
```

---

## ✅ Post-Import Checklist

After importing, you should:

### 1. Verify Import
```sql
-- Run verification queries
\i rideengine_data/sql_import_prisma/03_verify.sql
```

### 2. Adjust Pricing
- Review converted EUR prices
- Add your markup if needed
- Set competitive pricing

### 3. Update Stock
```sql
-- Set initial stock levels
UPDATE "InventoryLevel" il
SET "onHand" = 0, reserved = 0
FROM "ProductVariant" pv
JOIN "Product" p ON p.id = pv."productId"
WHERE pv.id = il."variantId"
AND p."canonicalSlug" LIKE 'ride-engine-%';
```

### 4. Add Translations
Products have English descriptions. Add Bulgarian via your translation system:

```sql
-- Check products needing Bulgarian translations
SELECT p.id, p.title 
FROM "Product" p
LEFT JOIN product_translations pt 
  ON p.id = pt.product_id AND pt.language_code = 'bg'
WHERE p."canonicalSlug" LIKE 'ride-engine-%'
AND pt.id IS NULL;
```

### 5. Organize Categories
Link products to your existing categories or create new ones:
- Harnesses
- Wetsuits  
- Protection
- Accessories
- Apparel

### 6. Upload Images (Optional)
If self-hosting images:
1. Use the images in `rideengine_data/images/`
2. Upload to your S3 bucket
3. Update `ProductImage` URLs

---

## 🔧 Troubleshooting

### Import Fails

**Problem**: Foreign key constraint errors

**Solution**: Ensure `Collection` exists first
```sql
SELECT * FROM "Collection" WHERE "canonicalSlug" = 'ride-engine';
```

### Duplicate SKUs

**Problem**: SKU already exists

**Solution**: SQL uses `ON CONFLICT (sku) DO UPDATE`, so duplicates will update existing variants

### Price Issues

**Problem**: Prices seem wrong

**Solution**: Check conversion rate in `006_generate_prisma_sql.py` (line 12: `USD_TO_EUR = 0.92`)

---

## 📊 Product Breakdown

### By Category
- **Harnesses**: 14 products (Hyperlock, Wing Foil, etc.)
- **Wetsuits**: 19 products (Men's, Women's, Accessories)
- **Apparel**: 22 products (T-shirts, Jackets, etc.)
- **Protection**: 9 products (Impact Vests, Helmets)
- **Accessories**: 107 products (Pumps, Leashes, Bags, etc.)

### By Sport (Auto-Classified)
- **WING**: ~30 products
- **KITE**: ~50 products
- **WAKE**: ~70 products
- **FOIL**: ~15 products
- **SUP**: ~6 products

---

## 🚀 Next Steps

1. ✅ **Test import** with sample SQL
2. ✅ **Verify data** looks correct
3. ✅ **Import all products** when ready
4. 📝 **Add Bulgarian translations**
5. 💰 **Adjust pricing** for your market
6. 📸 **Manage images** (keep CDN or self-host)
7. 📦 **Set inventory levels**
8. 🎨 **Organize categories**
9. 🌐 **Publish products** on your site

---

## 📞 Support

Questions about the import?Check:
- `import_ready/import_summary.json` - Data statistics
- `analysis.json` - Product analysis
- SQL files have inline comments
- Each script has detailed output

**Database Schema**: See your `prisma/schema.prisma`

---

## 🎁 Bonus Files

Also generated for reference:
- `category_tree.json` - Ride Engine's category hierarchy
- `summary.txt` - Human-readable product list
- `images_summary.json` - Image download statistics

---

## 🔐 Important Notes

- **Brand**: All products clearly identified as "Ride Engine"
- **Slugs**: Prefixed with `ride-engine-` to avoid conflicts
- **Status**: All products set to `active`
- **Timestamps**: Set to NOW() on import
- **UUIDs**: Generated fresh on import

---

**🎉 You're all set! Import when ready and enjoy your expanded catalog!**
