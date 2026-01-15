#!/usr/bin/env python3
"""
Ride Engine to Slingshot Prisma Database Import
Generates SQL that matches the actual Prisma schema
"""

import json
from pathlib import Path
from datetime import datetime
import re

# Configuration
OUTPUT_DIR = Path("rideengine_data")
IMPORT_DIR = OUTPUT_DIR / "import_ready"
SQL_OUTPUT_DIR = OUTPUT_DIR / "sql_import_prisma"

# Brand configuration
BRAND_NAME = "Ride Engine"
BRAND_SLUG = "ride-engine"

# USD to EUR conversion rate (update as needed)
USD_TO_EUR = 0.92

def escape_sql(text):
    """Escape single quotes for SQL"""
    if text is None:
        return 'NULL'
    return f"'{str(text).replace(chr(39), chr(39)+chr(39))}'"

def load_import_data():
    """Load the prepared import data"""
    products_file = IMPORT_DIR / "products.json"
    categories_file = IMPORT_DIR / "categories.json"
    
    with open(products_file, 'r', encoding='utf-8') as f:
        products = json.load(f)
    
    with open(categories_file, 'r', encoding='utf-8') as f:
        categories = json.load(f)
    
    return products, categories

def map_to_sport(tags, product_type):
    """Map Ride Engine products to Sport enum"""
    tags_lower = [tag.lower() for tag in tags]
    type_lower = product_type.lower()
    
    if any(t in tags_lower for t in ['wing', 'wingfoil', 'wingharness']):
        return 'WING'
    elif any(t in tags_lower for t in ['kite', 'kitesurf']):
        return 'KITE'
    elif any(t in tags_lower for t in ['foil']):
        return 'FOIL'
    elif any(t in tags_lower for t in ['wake', 'wakeboard']):
        return 'WAKE'
    elif any(t in tags_lower for t in ['sup', 'paddle']):
        return 'SUP'
    
    # Default based on type
    if 'harness' in type_lower:
        return 'KITE'
    else:
        return 'WAKE'

def generate_collection_sql():
    """Generate SQL for Ride Engine brand collection"""
    sql = []
    
    sql.append("-- Create Ride Engine Brand Collection")
    sql.append('INSERT INTO "Collection" (id, title, "canonicalSlug", description, "heroImageUrl", "createdAt", "updatedAt")')
    sql.append("VALUES (")
    sql.append("  gen_random_uuid(),")
    sql.append(f"  {escape_sql(BRAND_NAME)},")
    sql.append(f"  {escape_sql(BRAND_SLUG)},")
    sql.append(f"  {escape_sql('Premium watersports equipment from Ride Engine')},")
    sql.append("  NULL,")
    sql.append("  NOW(),")
    sql.append("  NOW()")
    sql.append(")")
    sql.append('ON CONFLICT ("canonicalSlug") DO NOTHING;\n')
    
    return "\n".join(sql)

def generate_products_sql(products, limit=None):
    """Generate SQL for products matching Prisma schema"""
    sql = []
    
    sql.append("-- ============================================================================")
    sql.append("-- RIDE ENGINE PRODUCTS (Prisma Schema Compatible)")
    sql.append("-- ============================================================================\n")
    
    products_to_import = products[:limit] if limit else products
    
    for idx, product in enumerate(products_to_import, 1):
        title = product['title']
        handle = product['handle']
        product_type = product.get('product_type', 'Accessories')
        description = product.get('description_html', '')
        tags = product.get('tags', [])
        
        # Determine sport
        sport = map_to_sport(tags, product_type)
        
        # Create canonical slug
        slug = f"ride-engine-{handle}"
        
        # SEO
        seo_title = product.get('seo', {}).get('title', title)
        seo_desc = product.get('seo', {}).get('description', '')[:160]
        
        sql.append(f"-- Product {idx}: {title}")
        sql.append("DO $$")
        sql.append("DECLARE")
        sql.append("  v_product_id UUID;")
        sql.append("  v_collection_id UUID;")
        sql.append("  v_variant_id UUID;")
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
        sql.append(f"    '{sport}',")
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
        
        # Link to Ride Engine collection
        sql.append("\n  -- Link to Ride Engine collection")
        sql.append('  SELECT id INTO v_collection_id FROM "Collection" WHERE "canonicalSlug" = ' + escape_sql(BRAND_SLUG) + ";")
        sql.append('  INSERT INTO "CollectionProduct" ("collectionId", "productId", "sortOrder", pinned)')
        sql.append("  VALUES (v_collection_id, v_product_id, 0, false)")
        sql.append("  ON CONFLICT DO NOTHING;")
        
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
    sql.append('SELECT COUNT(*) as ride_engine_products FROM "Product"')
    sql.append("WHERE \"canonicalSlug\" LIKE 'ride-engine-%';\n")
    
    sql.append("-- Count by sport")
    sql.append('SELECT sport, COUNT(*) as count FROM "Product"')
    sql.append("WHERE \"canonicalSlug\" LIKE 'ride-engine-%'")
    sql.append("GROUP BY sport ORDER BY count DESC;\n")
    
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
    print("  RIDE ENGINE PRISMA IMPORT GENERATOR")
    print("="*60)
    
    # Create output directory
    SQL_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    
    # Load data
    print("\n📂 Loading data...")
    products, categories = load_import_data()
    print(f"   ✓ {len(products)} products")
    print(f"   ✓ {len(categories)} categories")
    
    # Generate SQL files
    print("\n🔨 Generating Prisma-compatible SQL...")
    
    # 1. Collection
    collection_sql = generate_collection_sql()
    collection_file = SQL_OUTPUT_DIR / "01_ride_engine_collection.sql"
    with open(collection_file, 'w', encoding='utf-8') as f:
        f.write("-- Ride Engine Collection\n")
        f.write("-- Compatible with Prisma schema\n\n")
        f.write(collection_sql)
    print(f"   ✓ {collection_file}")
    
    # 2. All products
    products_sql = generate_products_sql(products)
    products_file = SQL_OUTPUT_DIR / "02_ride_engine_products_all.sql"
    with open(products_file, 'w', encoding='utf-8') as f:
        f.write("-- Ride Engine Products (All)\n")
        f.write("-- Compatible with Prisma schema\n")
        f.write(f"-- USD to EUR rate: {USD_TO_EUR}\n\n")
        f.write(products_sql)
    print(f"   ✓ {products_file}")
    
    # 3. Sample products
    sample_sql = generate_products_sql(products, limit=10)
    sample_file = SQL_OUTPUT_DIR / "02_ride_engine_products_sample.sql"
    with open(sample_file, 'w', encoding='utf-8') as f:
        f.write("-- Ride Engine Products (Sample - First 10)\n")
        f.write("-- Compatible with Prisma schema\n")
        f.write(f"-- USD to EUR rate: {USD_TO_EUR}\n\n")
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
        f.write("-- RIDE ENGINE COMPLETE IMPORT (Prisma Compatible)\n")
        f.write("-- ============================================================================\n\n")
        f.write("-- Connect to your database and run:\n")
        f.write("-- psql postgresql://user:pass@host/db < 00_IMPORT_ALL.sql\n\n")
        f.write("BEGIN;\n\n")
        f.write("\\i 01_ride_engine_collection.sql\n")
        f.write("\\i 02_ride_engine_products_all.sql\n")
        f.write("\\i 03_verify.sql\n\n")
        f.write("COMMIT;\n")
    print(f"   ✓ {master_file}")
    
    print("\n📊 Summary:")
    print(f"   Products: {len(products)}")
    print(f"   Variants: {sum(len(p.get('variants', [])) for p in products)}")
    print(f"   Images: {sum(len(p.get('images', [])) for p in products)}")
    print(f"   USD→EUR rate: {USD_TO_EUR}")
    
    print("\n" + "="*60)
    print("✅ PRISMA-COMPATIBLE SQL GENERATED!")
    print("="*60)
    print(f"\n📁 Output: {SQL_OUTPUT_DIR}")
    print("\n🚀 To import:")
    print(f"   1. Test first: psql your_db < {SQL_OUTPUT_DIR}/02_ride_engine_products_sample.sql")
    print(f"   2. Import all: psql your_db < {SQL_OUTPUT_DIR}/00_IMPORT_ALL.sql")

if __name__ == "__main__":
    main()
