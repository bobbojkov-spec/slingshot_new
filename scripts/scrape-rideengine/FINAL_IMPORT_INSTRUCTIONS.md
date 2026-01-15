# 🎉 Ride Engine Import - FINAL SOLUTION

## ✅ Complete Solution

All **171 Ride Engine products** use a NEW sport type: **`WATERSPORTS`**

This keeps them **separate from your Slingshot sport pages** (KITE, WING, WAKE, etc.)

---

## 🚀 Import Steps

### Step 1: Add WATERSPORTS to Database

```bash
cd scripts/scrape-rideengine

# Add WATERSPORTS to Sport enum
psql $DATABASE_URL < rideengine_data/sql_import_final/00_add_watersports_sport.sql
```

### Step 2: Update Prisma Schema

Edit `prisma/schema.prisma`:

```prisma
enum Sport { 
  KITE 
  WING 
  WAKE 
  FOIL 
  SUP 
  WATERSPORTS  // ← ADD THIS LINE
}
```

Then regenerate Prisma client:
```bash
npx prisma generate
```

### Step 3: Test Import (10 Products)

```bash
# Test with 10 products first
psql $DATABASE_URL < rideengine_data/sql_import_final/02_ride_engine_products_sample.sql
```

### Step 4: Import All (171 Products)

```bash
# Import all Ride Engine products
psql $DATABASE_URL < rideengine_data/sql_import_final/00_IMPORT_ALL.sql
```

---

## 🎯 How It Works

### Products Organization
- **Sport**: `WATERSPORTS` (separate from Slingshot sports)
- **Collection**: "Ride Engine" brand
- **Product Type**: Harnesses, Wetsuits, Apparel, etc.

### Frontend Filtering

**Sport Pages (KITE, WING, WAKE, etc.)**
```typescript
// Exclude WATERSPORTS from sport-specific pages
const kiteProducts = products.filter(p => p.sport === 'KITE');
const wakeProducts = products.filter(p => p.sport === 'WAKE');
// WATERSPORTS products won't appear here ✅
```

**Ride Engine Brand Page**
```typescript
// Show all Ride Engine products via Collection
const rideEngineProducts = products.filter(p => 
  p.collections.some(c => c.slug === 'ride-engine')
);
```

---

## 📊 What You Get

- **171 Products** - Complete Ride Engine catalog
- **Sport**: `WATERSPORTS` (won't appear on KITE/WING/WAKE pages)
- **Collection**: "Ride Engine" (brand organization)
- **Product Types**: Harnesses, Wetsuits, Apparel, Protection, Accessories

---

## ✅ Verification

After import, check:

```sql
-- Count Ride Engine products
SELECT COUNT(*) FROM "Product" 
WHERE sport = 'WATERSPORTS';
-- Should return: 171

-- Verify they're in Ride Engine collection
SELECT c.title, COUNT(cp."productId") 
FROM "Collection" c
JOIN "CollectionProduct" cp ON c.id = cp."collectionId"
WHERE c."canonicalSlug" = 'ride-engine'
GROUP BY c.title;
-- Should show: Ride Engine | 171
```

---

## 🎨 Frontend Implementation

### Filter Out WATERSPORTS from Sport Pages

```typescript
// app/[sport]/page.tsx
const validSports = ['KITE', 'WING', 'WAKE', 'FOIL', 'SUP'];

export default function SportPage({ params }: { params: { sport: string } }) {
  const sport = params.sport.toUpperCase();
  
  // Don't show WATERSPORTS products on sport pages
  if (sport === 'WATERSPORTS') {
    return redirect('/brands/ride-engine');
  }
  
  const products = getProductsBySport(sport);
  // ...
}
```

### Create Ride Engine Brand Page

```typescript
// app/brands/ride-engine/page.tsx
export default function RideEnginePage() {
  const products = getProductsByCollection('ride-engine');
  // All 171 Ride Engine products
  return <BrandPage products={products} brand="Ride Engine" />;
}
```

---

## 📋 Summary

✅ **Separate Sport Type**: `WATERSPORTS` for multi-sport brands  
✅ **Won't Appear** on KITE/WING/WAKE pages  
✅ **Brand Collection**: "Ride Engine" for organization  
✅ **Frontend**: Filter out `WATERSPORTS` from sport pages  
✅ **Ready to Import**: All SQL files updated  

---

## 🚀 Quick Command Reference

```bash
# 1. Add WATERSPORTS to database
psql $DATABASE_URL < rideengine_data/sql_import_final/00_add_watersports_sport.sql

# 2. Update Prisma schema (manually add WATERSPORTS to enum)
# 3. Regenerate Prisma client
npx prisma generate

# 4. Test import
psql $DATABASE_URL < rideengine_data/sql_import_final/02_ride_engine_products_sample.sql

# 5. Import all
psql $DATABASE_URL < rideengine_data/sql_import_final/00_IMPORT_ALL.sql
```

---

**🎉 Perfect solution! Ride Engine products completely separate from Slingshot sport categories.**
