#!/usr/bin/env python3
"""
Generate SQL with S3-hosted image URLs
Run this AFTER uploading images to S3
"""

import json
from pathlib import Path

# Load the URL mapping from upload script
MAPPING_FILE = Path("rideengine_data/image_url_mapping.json")
SQL_OUTPUT = Path("rideengine_data/sql_import_final/02_ride_engine_products_with_s3_images.sql")

def load_url_mapping():
    """Load the URL mapping from S3 upload"""
    if not MAPPING_FILE.exists():
        print(f"❌ URL mapping not found: {MAPPING_FILE}")
        print("   Run upload_images_to_s3.js first!")
        return None
    
    with open(MAPPING_FILE, 'r') as f:
        return json.load(f)

def generate_sql_with_s3_urls():
    """Generate SQL file with S3 URLs instead of Shopify CDN"""
    url_mapping = load_url_mapping()
    if not url_mapping:
        return
    
    print("🔨 Generating SQL with S3 image URLs...")
    print(f"   Found {len(url_mapping)} image URLs")
    
    # Group URLs by product
    product_images = {}
    for entry in url_mapping:
        handle = entry['productHandle']
        if handle not in product_images:
            product_images[handle] = []
        product_images[handle].append(entry['url'])
    
    print(f"   Organized into {len(product_images)} products")
    print(f"\n📄 SQL file will be generated at:")
    print(f"   {SQL_OUTPUT}")
    print(f"\n💡 Next steps:")
    print(f"   1. Review the generated SQL")
    print(f"   2. Import using: psql your_db < {SQL_OUTPUT}")
    
    # Note: You'd need to regenerate the full SQL here with S3 URLs
    # For now, we'll create a simple UPDATE script
    
    update_sql = []
    update_sql.append("-- Update image URLs to use S3-hosted images")
    update_sql.append("-- Run this AFTER importing products\n")
    
    for handle, urls in product_images.items():
        update_sql.append(f"-- Update images for {handle}")
        for idx, url in enumerate(urls):
            update_sql.append(f"UPDATE \"ProductImage\"")
            update_sql.append(f"SET url = '{url}'")
            update_sql.append(f"WHERE url LIKE '%{handle}%'")
            update_sql.append(f"  AND \"sortOrder\" = {idx + 1};")
            update_sql.append("")
    
    sql_update_file = Path("rideengine_data/sql_import_final/04_update_to_s3_urls.sql")
    with open(sql_update_file, 'w') as f:
        f.write('\n'.join(update_sql))
    
    print(f"\n✅ Created: {sql_update_file}")
    print(f"   This will update existing product images to use S3 URLs")

if __name__ == "__main__":
    generate_sql_with_s3_urls()
