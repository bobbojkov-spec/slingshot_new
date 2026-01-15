#!/usr/bin/env python3
"""
Generate SQL with RELATIVE S3 paths (following IMAGE_HANDLING_GUIDE.md)
Database stores: "ride-engine/product/image.jpg"
API will use getPresignedUrl() to sign URLs
"""

import json
from pathlib import Path
import sys

# Load configuration
MAPPING_FILE = Path("rideengine_data/image_url_mapping.json")
PRODUCTS_FILE = Path("rideengine_data/import_ready/products.json")
SQL_OUTPUT = Path("rideengine_data/sql_import_final/05_ride_engine_with_s3_paths.sql")

def load_data():
    """Load URL mapping and products"""
    if not MAPPING_FILE.exists():
        print(f"❌ URL mapping not found: {MAPPING_FILE}")
        print("   Run: node upload_images_to_s3.js first!")
        return None, None
    
    with open(MAPPING_FILE, 'r') as f:
        url_mapping = json.load(f)
    
    with open(PRODUCTS_FILE, 'r') as f:
        products = json.load(f)
    
    return url_mapping, products

def create_image_lookup(url_mapping):
    """Create lookup: productHandle -> [relative_paths]"""
    lookup = {}
    for entry in url_mapping:
        handle = entry['productHandle']
        if handle not in lookup:
            lookup[handle] = []
        # Store RELATIVE path (not full URL!)
        lookup[handle].append({
            'path': entry['s3Path'],  # Relative: "ride-engine/product/image.jpg"
            'filename': entry['filename'],
            'sortOrder': len(lookup[handle]) + 1
        })
    return lookup

def generate_sql(products, image_lookup):
    """Generate SQL with relative S3 paths"""
    sql = []
    
    sql.append("-- ============================================================================")
    sql.append("-- RIDE ENGINE PRODUCTS WITH S3 IMAGES")
    sql.append("-- Following IMAGE_HANDLING_GUIDE.md architecture")
    sql.append("-- Paths are RELATIVE (e.g., 'ride-engine/product/image.jpg')")
    sql.append("-- API must use getPresignedUrl() to convert to signed URLs")
    sql.append("-- ============================================================================\n")
    
    sql.append("-- IMPORTANT: Import products first using 02_ride_engine_products_all.sql")
    sql.append("-- This script UPDATES the image paths to use S3 storage\n")
    
    for product in products:
        handle = product.get('handle')
        if handle not in image_lookup:
            continue
        
        images = image_lookup[handle]
        
        sql.append(f"\n-- Update images for: {product.get('title')}")
        sql.append("DO $$")
        sql.append("DECLARE v_product_id UUID;")
        sql.append("BEGIN")
        sql.append(f"  SELECT id INTO v_product_id FROM \"Product\"")
        sql.append(f"  WHERE \"canonicalSlug\" = 'ride-engine-{handle}';")
        sql.append("")
        sql.append("  IF v_product_id IS NOT NULL THEN")
        sql.append("    -- Delete existing Shopify images")
        sql.append('    DELETE FROM "ProductImage" WHERE "productId" = v_product_id;')
        sql.append("")
        
        for img in images:
            sql.append(f"    -- Add S3 image: {img['filename']}")
            sql.append('    INSERT INTO "ProductImage" (')
            sql.append('      id, "productId", "variantId", url, alt, "sortOrder"')
            sql.append("    ) VALUES (")
            sql.append("      gen_random_uuid(),")
            sql.append("      v_product_id,")
            sql.append("      NULL,")
            sql.append(f"      '{img['path']}',  -- RELATIVE path for server-side signing")
            sql.append(f"      '{product.get('title')}',")
            sql.append(f"      {img['sortOrder']}")
            sql.append("    );")
            sql.append("")
        
        sql.append("  END IF;")
        sql.append("END $$;")
    
    sql.append("\n-- Verify images were updated")
    sql.append('SELECT p.title, pi.url, pi."sortOrder"')
    sql.append('FROM "Product" p')
    sql.append('JOIN "ProductImage" pi ON p.id = pi."productId"')
    sql.append("WHERE p.\"canonicalSlug\" LIKE 'ride-engine-%'")
    sql.append('ORDER BY p.title, pi."sortOrder"')
    sql.append('LIMIT 10;')
    
    return '\n'.join(sql)

def main():
    print("="*60)
    print("  GENERATE SQL WITH RELATIVE S3 PATHS")
    print("  Following IMAGE_HANDLING_GUIDE.md")
    print("="*60)
    
    # Load data
    url_mapping, products = load_data()
    if not url_mapping or not products:
        sys.exit(1)
    
    print(f"\n📊 Data loaded:")
    print(f"   Images: {len(url_mapping)}")
    print(f"   Products: {len(products)}")
    
    # Create lookup
    image_lookup = create_image_lookup(url_mapping)
    print(f"   Products with images: {len(image_lookup)}")
    
    # Generate SQL
    print(f"\n🔨 Generating SQL...")
    sql = generate_sql(products, image_lookup)
    
    # Save
    SQL_OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    with open(SQL_OUTPUT, 'w') as f:
        f.write(sql)
    
    print(f"✅ Generated: {SQL_OUTPUT}")
    print(f"\n📝 Important Notes:")
    print(f"   1. Paths are RELATIVE (e.g., 'ride-engine/product/image.jpg')")
    print(f"   2. NO full URLs stored in database")
    print(f"   3. API MUST use getPresignedUrl() to sign URLs")
    print(f"\n🚀 To use:")
    print(f"   1. Import products: 02_ride_engine_products_all.sql")
    print(f"   2. Update images: {SQL_OUTPUT}")
    print(f"   3. In API: use getPresignedUrl(product.url)")

if __name__ == "__main__":
    main()
