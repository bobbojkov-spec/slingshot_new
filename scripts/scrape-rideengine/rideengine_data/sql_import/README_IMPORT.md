# Ride Engine Database Import Guide

## Overview

This guide explains how to import the scraped Ride Engine data into your Slingshot database.

## ⚠️ Important: Schema Adjustments Required

The generated SQL files need manual adjustments to match your exact database schema. Here's what needs to be fixed:

### Table Name Mismatches

Your actual schema uses different table names than the generated SQL. I'll create a corrected version.

### Required Schema Extensions

Based on the Ride Engine data, you may want to extend your database with:

1. **Brand/Vendor Support** - Add a vendor field if not present
2. **Multi-Language Support** - Currently supported via your translation tables
3. **Product Tags** - Add tags support for filtering

## Steps to Import

###1. Review Your Current Schema

Check which tables you need:
- `products` (✓ exists)
- `product_variants` (✓ exists) 
- `product_images` (✓ exists)
- `categories` (✓ exists)
- `product_translations` (✓ exists)
- `category_translations` (✓ exists)

### 2. Schema Adjustments Needed

I'll create a corrected SQL file that matches your exact schema from `prisma/schema.prisma`.

### 3. Data Mapping

| Ride Engine Field | Your Database Field |
|-------------------|---------------------|
| `shopify_id` | Custom field (can store in JSON or add column) |
| `title` | `title` |
| `handle` | `canonicalSlug` |
| `product_type` | `productType` |
| `description_html` | `descriptionRich` |
| `sku` | `sku` |
| `price` (USD) | `priceEurCents` (needs conversion) |
| `weight` | `weightGrams` |

### 4. Sport Mapping

Ride Engine products auto-mapped to your Sport enum:
- Wing/Wing Foil products → `WING`
- Kite products → `KITE`  
- Foil products → `FOIL`
- Wake products → `WAKE`
- SUP products → `SUP`

## Files Generated

```
rideengine_data/sql_import/
├── 00_IMPORT_ALL.sql                    # Master import script
├── 01_ride_engine_brand.sql             # Create brand collection
├── 02_ride_engine_categories.sql        # Import categories
├── 03_ride_engine_products_all.sql      # All 171 products
├── 03_ride_engine_products_sample.sql   # First 10 for testing
└── 04_verify_import.sql                 # Verification queries
```

## Next Steps

I'll create a corrected version that properly matches your `Prisma` schema.

## Price Conversion

⚠️ **Important**: Ride Engine prices are in USD. You'll need to convert to EUR:
- Current rate: ~0.92 EUR/USD (check current rate)
- Formula: `EUR cents = USD price * 100 * 0.92`

## Images

Images are referenced by URL from Shopify CDN. You have two options:

1. **Keep external URLs** - Images stay on Shopify CDN (fastest to implement)
2. **Download and re-host** - Use the downloaded images in `rideengine_data/images/`

## Manual Steps After Import

1. Set appropriate pricing (convert USD → EUR)
2. Update stock quantities
3. Add Bulgarian translations
4. Associate with your existing categories if needed
5. Upload images to your S3 bucket (optional)
6. Update image URLs to point to your storage
