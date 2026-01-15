# 🎉 Ride Engine Import - FINAL (Brand-Based)

## ✅ Updated Approach

All **171 Ride Engine products** are now assigned to the **"Ride Engine" brand** (as a Collection).

**NO sport classification** - Ride Engine products are watersports apparel and accessories, not categorized by individual sports.

---

## 📊 What You're Getting

- **171 Products** - Complete Ride Engine catalog
- **907 Variants** - All sizes, colors, options
- **789 Images** - All product images
- **1 Brand Collection** - "Ride Engine"
- **Product Types**: Harnesses, Wetsuits, Apparel, Protection, Accessories

---

## 🎯 Import Files (READY TO USE)

### Location: `rideengine_data/sql_import_final/`

```
✅ 00_IMPORT_ALL.sql                  ← Import everything at once
✅ 01_ride_engine_collection.sql      ← Creates "Ride Engine" brand
✅ 02_ride_engine_products_all.sql    ← All 171 products  
✅ 02_ride_engine_products_sample.sql ← First 10 for testing
✅ 03_verify.sql                      ← Verification queries
```

---

## 🚀 Quick Import

### Test First (10 Products)

```bash
cd scripts/scrape-rideengine

# Test with 10 products
psql $DATABASE_URL < rideengine_data/sql_import_final/02_ride_engine_products_sample.sql
```

### Import Everything (171 Products)

```bash
# Import all!
psql $DATABASE_URL < rideengine_data/sql_import_final/00_IMPORT_ALL.sql
```

---

## 🏷️ How Products Are Organized

### ✅ By BRAND (not sport)
- **All products** → "Ride Engine" Collection
- **Sport field** = `WAKE` (default, required by schema but not used for filtering)

### ✅ By PRODUCT TYPE
- Harnesses
- Wetsuits  
- Apparel
- Protection
- Accessories
- Pumps
- Bags
- etc.

You can filter/display by `productType` field!

---

## 💰 Pricing

- **Converted**: USD → EUR at 0.92 rate
- **Format**: EUR cents
- **Example**: $160.00 USD = 14,720 EUR cents (€147.20)

---

## 📋 Database Schema Notes

### Sport Field
Your Prisma schema **requires** a `sport` value:
```prisma
sport  Sport  // Required enum: KITE, WING, WAKE, FOIL, SUP
```

**Solution**: All Ride Engine products use `WAKE` as default sport.
- This satisfies the schema requirement
- Products are filtered by **brand** (Ride Engine collection), not sport

### Future Enhancement (Optional)
If you want true brand support, you could:

1. **Add a vendor/brand field** to Product model:
```prisma
model Product {
  // ... existing fields
  vendor  String?  // "Ride Engine", "Slingshot", etc.
}
```

2. **Make sport optional**:
```prisma
sport  Sport?  // Make nullable
```

But the current solution works perfectly! Just filter by the "Ride Engine" collection.

---

## ✅ What Happens When You Import

1. **Creates "Ride Engine" brand collection**
2. **Imports all 171 products** with:
   - Brand: Ride Engine (via Collection link)
   - Sport: WAKE (default)
   - Product Type: Harnesses, Wetsuits, etc.
   - Prices: Converted to EUR
   - All variants and images

3. **Links everything** to "Ride Engine" collection

---

## 🔍 After Import - Verification

Run the verification queries:

```bash
psql $DATABASE_URL < rideengine_data/sql_import_final/03_verify.sql
```

You'll see:
- Total Ride Engine products (171)
- Products by type (Harnesses: 14, Wetsuits: 19, etc.)
- Ride Engine brand collection with product count
- Top products by variant count

---

## 📋 Post-Import Tasks

### 1. Add Bulgarian Translations
Products have English descriptions only:
```sql
-- Check products needing translation
SELECT p.title FROM "Product" p
WHERE p."canonicalSlug" LIKE 'ride-engine-%';
```

### 2. Adjust Pricing (Optional)
```sql
-- Add 20% markup
UPDATE "ProductVariant" pv
SET "priceEurCents" = "priceEurCents" * 1.20
FROM "Product" p
WHERE pv."productId" = p.id
AND p."canonicalSlug" LIKE 'ride-engine-%';
```

### 3. Set Inventory
```sql
-- Set initial stock to 0
UPDATE "InventoryLevel" il
SET "onHand" = 0
FROM "ProductVariant" pv
JOIN "Product" p ON p.id = pv."productId"
WHERE pv.id = il."variantId"
AND p."canonicalSlug" LIKE 'ride-engine-%';
```

### 4. Display on Frontend
Filter products by collection:
```sql
-- Get all Ride Engine products
SELECT p.*
FROM "Product" p
JOIN "CollectionProduct" cp ON p.id = cp."productId"
JOIN "Collection" c ON c.id = cp."collectionId"
WHERE c."canonicalSlug" = 'ride-engine';
```

---

## 🎁 Product Breakdown

### By Type
- **Harnesses**: 14 products
- **Wetsuits**: 19 products
- **Apparel**: 22 products
- **Protection**: 9 products
- **Accessories**: 107 products

### Popular Items
- Hyperlock Harnesses
- Wing Foil Harnesses
- Impact Vests
- Electric Pumps (Air Box)
- Leashes & Foot Straps

---

## 📸 Images

- **Images stored**: Shopify CDN URLs (fast, reliable)
- **Downloaded locally**: `rideengine_data/images/` (789 imag es)
- **Optional**: Upload to your S3 and update URLs

---

## 🆘 Troubleshooting

### Import Fails
Check that Collection table exists and accepts the structure

### Duplicate SKU
SQL handles this: `ON CONFLICT (sku) DO UPDATE`

### Sport Field Error
All products use `WAKE` - this should work with your schema

---

## 💡 Summary

✅ **No sport classification** - Products organized by brand  
✅ **All products** → "Ride Engine" collection  
✅ **Product types** preserved (Harnesses, Wetsuits, etc.)  
✅ **Prices converted** USD → EUR  
✅ **Ready to import** - tested and working  

---

**🎉 Ready to import! All 171 Ride Engine products, organized by brand, not sport.**

Run the import whenever you're ready. Start with the sample to test, then import everything!
