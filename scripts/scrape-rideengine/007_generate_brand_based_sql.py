#!/usr/bin/env python3
"""
Ride Engine to Slingshot Prisma Database Import (Updated - No Sport Classification)
All products assigned to "Ride Engine" brand, using default sport value
"""

import json
from pathlib import Path
import re

# Configuration
OUTPUT_DIR = Path("rideengine_data")
IMPORT_DIR = OUTPUT_DIR / "import_ready"
SQL_OUTPUT_DIR = OUTPUT_DIR / "sql_import_final"

# Brand configuration
BRAND_NAME = "Ride Engine"
BRAND_SLUG = "ride-engine"

# Default sport (required by Prisma schema but not used for classification)
# WATERSPORTS = Multi-sport brands (Ride Engine) - Frontend filters this out
DEFAULT_SPORT = "WATERSPORTS"

# USD to EUR conversion rate
USD_TO_EUR = 0.92

def escape_sql(text):
    """Escape single quotes for SQL"""
    if text is None:
        return 'NULL'
    return f"'{str(text).replace(chr(39), chr(39)+chr(39))}'"

def load_import_data():
    """Load the prepared import data"""
    products_file = IMPORT_DIR / "products.json"
    with open(products_file, 'r', encoding='utf-8') as f:
        products = json.load(f)
    return products

def generate_collection_sql():
    """Generate SQL for Ride Engine brand collection"""
    sql = []
    
    sql.append("-- ============================================================================")
    sql.append("-- RIDE ENGINE BRAND COLLECTION")
    sql.append("-- All Ride Engine products will be linked to this collection")
    sql.append("-- ============================================================================\n")
    
    sql.append("-- Create Ride Engine Brand Collection")
    sql.append('INSERT INTO "Collection" (id, title, "canonicalSlug", description, "heroImageUrl", "createdAt", "updatedAt")')
    sql.append("VALUES (")
    sql.append("  gen_random_uuid(),")
    sql.append(f"  {escape_sql(BRAND_NAME)},")
    sql.append(f"  {escape_sql(BRAND_SLUG)},")
    sql.append(f"  {escape_sql('Ride Engine - Premium watersports apparel, harnesses, wetsuits, and accessories')},")
    sql.append("  NULL,")
    sql.append("  NOW(),")
    sql.append("  NOW()")
    sql.append(")")
    sql.append('ON CONFLICT ("canonicalSlug") DO NOTHING;\n')
    
    return "\n".join(sql)

def generate_products_sql(products, limit=None):
    """Generate SQL for products - all assigned to Ride Engine brand"""
    sql = []
    
    sql.append("-- ============================================================================")
    sql.append("-- RIDE ENGINE PRODUCTS")
    sql.append("-- All products use default WAKE sport (required by schema)")
    sql.append("-- Classification is by BRAND (Ride Engine) not by sport")
    sql.append("-- ============================================================================\n")
    
    products_to_import = products[:limit] if limit else products
    
    for idx, product in enumerate(products_to_import, 1):
        title = product['title']
        handle = product['handle']
        product_type = product.get('product_type', 'Accessories')
        description = product.get('description_html', '')
        
        # Create canonical slug
        slug = f"ride-engine-{handle}"
        
        # SEO
        seo_title = product.get('seo', {}).get('title', title)
        seo_desc = product.get('seo', {}).get('description', '')[:160]
        
        sql.append(f"-- Product {idx}: {title}")
        sql.append(f"-- Type: {product_type}")
        sql.append("DO $$")
        sql.append("DECLARE")
        sql.append("  v_product_id UUID;")
        sql.append("  v_collection_id UUID;")
        sql.append("BEGIN")
        
        # Insert product
        sql.append('  INSERT INTO "Product" (')
        sql.append('    id, title, subtitle, "canonicalSlug", sport, "productType",')
        sql.append('    status, "descriptionRich", "seoMetaTitle", "seoMetaDescription",')
        sql.append('    "createdAt", "updatedAt"')
        sql.append("  ) VALUES (")
        sql.append("    gen_random_uuid(),")
        sql.append(f"    {escape_sql(title)},")
        sql.append("    NULL,")
        sql.append(f"    {escape_sql(slug)},")
        sql.append(f"    '{DEFAULT_SPORT}',  -- Default sport (brand-based classification)")
        sql.append(f"    {escape_sql(product_type)},")
        sql.append(f"    '{product.get('status', 'active')}',")
        sql.append(f"    {escape_sql(description)},")
        sql.append(f"    {escape_sql(seo_title)},")
        sql.append(f"    {escape_sql(seo_desc)},")
        sql.append("    NOW(),")
        sql.append("    NOW()")
        sql.append("  )")
        sql.append('  ON CONFLICT ("canonicalSlug") DO UPDATE SET')
        sql.append('    title = EXCLUDED.title,')
        sql.append('    "descriptionRich" = EXCLUDED."descriptionRich",')
        sql.append('    "updatedAt" = NOW()')
        sql.append("  RETURNING id INTO v_product_id;")
        
        # Link to Ride Engine brand collection
        sql.append("\n  -- Link to Ride Engine brand collection")
        sql.append('  SELECT id INTO v_collection_id FROM "Collection" WHERE "canonicalSlug" = ' + escape_sql(BRAND_SLUG) + ";")
        sql.append('  IF v_collection_id IS NOT NULL THEN')
        sql.append('    INSERT INTO "CollectionProduct" ("collectionId", "productId", "sortOrder", pinned)')
        sql.append("    VALUES (v_collection_id, v_product_id, 0, false)")
        sql.append("    ON CONFLICT DO NOTHING;")
        sql.append('  END IF;')
        
        # Add variants
        for v_idx, variant in enumerate(product.get('variants', [])):
            sku = variant.get('sku', f"{handle}-{v_idx}")
            price_usd = variant.get('price', '0')
            compare_price_usd = variant.get('compare_at_price')
            
            # Convert to EUR cents
            try:
                price_eur_cents = int(float(price_usd) * USD_TO_EUR * 100)
            except:
                price_eur_cents = 0
            
            compare_eur_cents = 'NULL'
            if compare_price_usd:
                try:
                    compare_eur_cents = int(float(compare_price_usd) * USD_TO_EUR * 100)
                except:
                    pass
            
            barcode = variant.get('barcode', '')
            weight = variant.get('weight', 0)
            
            # Build option values JSON
            options = {}
            if variant.get('option1'):
                options['option1'] = variant['option1']
            if variant.get('option2'):
                options['option2'] = variant['option2']
            if variant.get('option3'):
                options['option3'] = variant['option3']
            
            options_json = json.dumps(options).replace("'", "''")
            
            sql.append(f"\n  -- Variant: {variant.get('title', 'Default')}")
            sql.append('  INSERT INTO "ProductVariant" (')
            sql.append('    id, "productId", sku, "optionValues", "priceEurCents", "compareAtEurCents",')
            sql.append('    "weightGrams", barcode, "lowStockThreshold", "createdAt", "updatedAt"')
            sql.append("  ) VALUES (")
            sql.append("    gen_random_uuid(),")
            sql.append("    v_product_id,")
            sql.append(f"    {escape_sql(sku)},")
            sql.append(f"    '{options_json}'::jsonb,")
            sql.append(f"    {price_eur_cents},")
            sql.append(f"    {compare_eur_cents},")
            sql.append(f"    {weight or 0},")
            sql.append(f"    {escape_sql(barcode)},")
            sql.append("    3,")
            sql.append("    NOW(),")
            sql.append("    NOW()")
            sql.append("  )")
            sql.append("  ON CONFLICT (sku) DO UPDATE SET")
            sql.append('    "priceEurCents" = EXCLUDED."priceEurCents",')
            sql.append('    "updatedAt" = NOW();')
        
        # Add images
        for img_idx, image in enumerate(product.get('images', [])):
            sql.append(f"\n  -- Image {img_idx + 1}")
            sql.append('  INSERT INTO "ProductImage" (')
            sql.append('    id, "productId", "variantId", url, alt, "sortOrder"')
            sql.append("  ) VALUES (")
            sql.append("    gen_random_uuid(),")
            sql.append("    v_product_id,")
            sql.append("    NULL,")
            sql.append(f"    {escape_sql(image.get('src', ''))},")
            sql.append(f"    {escape_sql(image.get('alt', title))},")
            sql.append(f"    {image.get('position', img_idx)}")
            sql.append("  )")
            sql.append("  ON CONFLICT DO NOTHING;")
        
        sql.append("END $$;\n")
    
    return "\n".join(sql)

def generate_verification_sql():
    """Generate verification queries"""
    sql = []
    
    sql.append("-- ============================================================================")
    sql.append("-- VERIFICATION QUERIES")
    sql.append("-- ============================================================================\n")
    
    sql.append("-- Count Ride Engine products")
    sql.append('SELECT COUNT(*) as total_ride_engine_products FROM "Product"')
    sql.append("WHERE \"canonicalSlug\" LIKE 'ride-engine-%';\n")
    
    sql.append("-- Products by type")
    sql.append('SELECT "productType", COUNT(*) as count FROM "Product"')
    sql.append("WHERE \"canonicalSlug\" LIKE 'ride-engine-%'")
    sql.append('GROUP BY "productType" ORDER BY count DESC;\n')
    
    sql.append("-- Ride Engine brand collection")
    sql.append('SELECT c.title, COUNT(cp."productId") as product_count')
    sql.append('FROM "Collection" c')
    sql.append('LEFT JOIN "CollectionProduct" cp ON c.id = cp."collectionId"')
    sql.append("WHERE c.\"canonicalSlug\" = 'ride-engine'")
    sql.append('GROUP BY c.id, c.title;\n')
    
    sql.append("-- Products with variants")
    sql.append('SELECT p.title, COUNT(v.id) as variant_count')
    sql.append('FROM "Product" p')
    sql.append('LEFT JOIN "ProductVariant" v ON p.id = v."productId"')
    sql.append("WHERE p.\"canonicalSlug\" LIKE 'ride-engine-%'")
    sql.append('GROUP BY p.id, p.title')
    sql.append('ORDER BY variant_count DESC')
    sql.append('LIMIT 10;')
    
    return "\n".join(sql)

def main():
    """Main execution"""
    print("="*60)
    print("  RIDE ENGINE IMPORT (BRAND-BASED)")
    print("  No sport classification - all assigned to brand")
    print("="*60)
    
    # Create output directory
    SQL_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    
    # Load data
    print("\n📂 Loading data...")
    products = load_import_data()
    print(f"   ✓ {len(products)} products")
    
    # Generate SQL files
    print("\n🔨 Generating brand-based SQL...")
    
    # 1. Collection
    collection_sql = generate_collection_sql()
    collection_file = SQL_OUTPUT_DIR / "01_ride_engine_collection.sql"
    with open(collection_file, 'w', encoding='utf-8') as f:
        f.write("-- Ride Engine Brand Collection\n")
        f.write("-- All products will be linked to this brand\n\n")
        f.write(collection_sql)
    print(f"   ✓ {collection_file}")
    
    # 2. All products
    products_sql = generate_products_sql(products)
    products_file = SQL_OUTPUT_DIR / "02_ride_engine_products_all.sql"
    with open(products_file, 'w', encoding='utf-8') as f:
        f.write("-- Ride Engine Products (All 171)\n")
        f.write("-- Brand-based classification (no sport differentiation)\n")
        f.write(f"-- USD to EUR rate: {USD_TO_EUR}\n")
        f.write(f"-- Default sport: {DEFAULT_SPORT} (required by schema)\n\n")
        f.write(products_sql)
    print(f"   ✓ {products_file}")
    
    # 3. Sample products
    sample_sql = generate_products_sql(products, limit=10)
    sample_file = SQL_OUTPUT_DIR / "02_ride_engine_products_sample.sql"
    with open(sample_file, 'w', encoding='utf-8') as f:
        f.write("-- Ride Engine Products (Sample - First 10)\n")
        f.write("-- Brand-based classification (no sport differentiation)\n")
        f.write(f"-- USD to EUR rate: {USD_TO_EUR}\n")
        f.write(f"-- Default sport: {DEFAULT_SPORT} (required by schema)\n\n")
        f.write(sample_sql)
    print(f"   ✓ {sample_file} (10 products for testing)")
    
    # 4. Verification
    verify_sql = generate_verification_sql()
    verify_file = SQL_OUTPUT_DIR / "03_verify.sql"
    with open(verify_file, 'w', encoding='utf-8') as f:
        f.write(verify_sql)
    print(f"   ✓ {verify_file}")
    
    # 5. Master script
    master_file = SQL_OUTPUT_DIR / "00_IMPORT_ALL.sql"
    with open(master_file, 'w', encoding='utf-8') as f:
        f.write("-- ============================================================================\n")
        f.write("-- RIDE ENGINE COMPLETE IMPORT (Brand-Based)\n")
        f.write("-- ============================================================================\n")
        f.write("-- All products assigned to 'Ride Engine' brand collection\n")
        f.write(f"-- Sport field set to {DEFAULT_SPORT} (schema requirement, not used for classification)\n")
        f.write("--\n")
        f.write("-- Usage: psql your_database < 00_IMPORT_ALL.sql\n\n")
        f.write("BEGIN;\n\n")
        f.write("\\i 01_ride_engine_collection.sql\n")
        f.write("\\i 02_ride_engine_products_all.sql\n")
        f.write("\\i 03_verify.sql\n\n")
        f.write("COMMIT;\n")
    print(f"   ✓ {master_file}")
    
    print("\n📊 Summary:")
    print(f"   Brand: {BRAND_NAME}")
    print(f"   Products: {len(products)}")
    print(f"   Variants: {sum(len(p.get('variants', [])) for p in products)}")
    print(f"   Images: {sum(len(p.get('images', [])) for p in products)}")
    print(f"   Default sport: {DEFAULT_SPORT} (schema requirement)")
    print(f"   USD→EUR rate: {USD_TO_EUR}")
    
    print("\n" + "="*60)
    print("✅ BRAND-BASED SQL GENERATED!")
    print("="*60)
    print(f"\n📁 Output: {SQL_OUTPUT_DIR}")
    print("\n🚀 To import:")
    print(f"   1. Test: psql your_db < {SQL_OUTPUT_DIR}/02_ride_engine_products_sample.sql")
    print(f"   2. Import all: psql your_db < {SQL_OUTPUT_DIR}/00_IMPORT_ALL.sql")
    print("\n💡 Note: All products linked to 'Ride Engine' brand collection")
    print("   Sport field = WAKE (required by schema, not used for classification)")

if __name__ == "__main__":
    main()
