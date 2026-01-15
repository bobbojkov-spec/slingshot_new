#!/usr/bin/env python3
"""
Ride Engine Database Import - Step 5: Import data into Slingshot database
This script imports the scraped Ride Engine data into your PostgreSQL database
"""

import json
import os
from pathlib import Path
from datetime import datetime
import re

# Configuration
OUTPUT_DIR = Path("rideengine_data")
IMPORT_DIR = OUTPUT_DIR / "import_ready"
SQL_OUTPUT_DIR = OUTPUT_DIR / "sql_import"

# Brand configuration
BRAND_NAME = "Ride Engine"
BRAND_SLUG = "ride-engine"
BRAND_VENDOR = "Ride Engine"

def sanitize_slug(text):
    """Create a URL-safe slug"""
    text = text.lower()
    text = re.sub(r'[^a-z0-9]+', '-', text)
    text = text.strip('-')
    return text

def escape_sql_string(text):
    """Escape single quotes for SQL"""
    if text is None:
        return 'NULL'
    return f"'{str(text).replace(chr(39), chr(39)+chr(39))}'"

def load_import_data():
    """Load the prepared import data"""
    products_file = IMPORT_DIR / "products.json"
    categories_file = IMPORT_DIR / "categories.json"
    
    data = {}
    
    if products_file.exists():
        with open(products_file, 'r', encoding='utf-8') as f:
            data['products'] = json.load(f)
    
    if categories_file.exists():
        with open(categories_file, 'r', encoding='utf-8') as f:
            data['categories'] = json.load(f)
    
    return data

def map_ride_engine_to_sport(product_tags, product_type):
    """
    Map Ride Engine products to your Sport enum (KITE, WING, WAKE, FOIL, SUP)
    """
    tags_lower = [tag.lower() for tag in product_tags]
    type_lower = product_type.lower()
    
    # Check tags and product type
    if any(tag in tags_lower for tag in ['wing', 'wingfoil', 'wingharness']):
        return 'WING'
    elif any(tag in tags_lower for tag in ['kite', 'kitesurf']):
        return 'KITE'
    elif any(tag in tags_lower for tag in ['foil', 'wing foil']):
        return 'FOIL'
    elif any(tag in tags_lower for tag in ['wake', 'wakeboard']):
        return 'WAKE'
    elif any(tag in tags_lower for tag in ['sup', 'paddle']):
        return 'SUP'
    
    # Default fallback based on product type
    if 'harness' in type_lower:
        return 'KITE'  # Most harnesses are kite
    elif 'wetsuit' in type_lower:
        return 'WAKE'  # Generic water sports
    else:
        return 'WAKE'  # Default to WAKE for misc items

def generate_brand_collections_sql():
    """Generate SQL to create a Ride Engine brand collection"""
    sql = []
    
    sql.append("-- ============================================================================")
    sql.append("-- RIDE ENGINE BRAND COLLECTION")
    sql.append("-- ============================================================================\n")
    
    sql.append("-- Create Ride Engine brand as a collection")
    sql.append("INSERT INTO \"Collection\" (id, title, \"canonicalSlug\", description, \"heroImageUrl\", \"createdAt\", \"updatedAt\")")
    sql.append("VALUES (")
    sql.append("  gen_random_uuid(),")
    sql.append(f"  {escape_sql_string(BRAND_NAME)},")
    sql.append(f"  {escape_sql_string(BRAND_SLUG)},")
    sql.append(f"  {escape_sql_string('Official Ride Engine products - premium watersports equipment')},")
    sql.append("  NULL,")
    sql.append("  NOW(),")
    sql.append("  NOW()")
    sql.append(")")
    sql.append("ON CONFLICT (\"canonicalSlug\") DO NOTHING;\n")
    
    return "\n".join(sql)

def generate_categories_sql(categories_data):
    """Generate SQL for importing categories"""
    sql = []
    
    sql.append("-- ============================================================================")
    sql.append("-- RIDE ENGINE CATEGORIES")
    sql.append("-- ============================================================================\n")
    
    # Map category IDs to UUIDs (we'll use a simple mapping)
    category_uuid_map = {}
    
    for cat in categories_data:
        cat_id = cat['id']
        cat_slug = cat['slug']
        cat_name = cat['name']
        parent_id = cat.get('parent_id')
        level = cat['level']
        sort_order = cat['sort_order']
        
        # Generate a deterministic UUID based on slug (or use gen_random_uuid() in SQL)
        uuid_var = f"category_{cat_id}_uuid"
        category_uuid_map[cat_id] = uuid_var
        
        # For parent categories
        if parent_id is None:
            sql.append(f"-- Main Category: {cat_name}")
            sql.append(f"DO $$")
            sql.append(f"DECLARE {uuid_var} UUID;")
            sql.append(f"BEGIN")
            sql.append(f"  INSERT INTO categories (id, handle, name, slug, status, visible, sort_order, parent_id)")
            sql.append(f"  VALUES (")
            sql.append(f"    gen_random_uuid(),")
            sql.append(f"    {escape_sql_string(cat_slug)},")
            sql.append(f"    {escape_sql_string(cat_name)},")
            sql.append(f"    {escape_sql_string(cat_slug)},")
            sql.append(f"    'active',")
            sql.append(f"    true,")
            sql.append(f"    {sort_order},")
            sql.append(f"    NULL")
            sql.append(f"  )")
            sql.append(f"  ON CONFLICT (slug) DO UPDATE SET")
            sql.append(f"    name = EXCLUDED.name,")
            sql.append(f"    sort_order = EXCLUDED.sort_order")
            sql.append(f"  RETURNING id INTO {uuid_var};")
            sql.append(f"END $$;\n")
        else:
            # For subcategories
            parent_slug = next((c['slug'] for c in categories_data if c['id'] == parent_id), None)
            sql.append(f"-- Subcategory: {cat_name}")
            sql.append(f"INSERT INTO categories (id, handle, name, slug, status, visible, sort_order, parent_id)")
            sql.append(f"SELECT")
            sql.append(f"  gen_random_uuid(),")
            sql.append(f"  {escape_sql_string(cat_slug)},")
            sql.append(f"  {escape_sql_string(cat_name)},")
            sql.append(f"  {escape_sql_string(cat_slug)},")
            sql.append(f"  'active',")
            sql.append(f"  true,")
            sql.append(f"  {sort_order},")
            sql.append(f"  c.id")
            sql.append(f"FROM categories c")
            sql.append(f"WHERE c.slug = {escape_sql_string(parent_slug)}")
            sql.append(f"ON CONFLICT (slug) DO UPDATE SET")
            sql.append(f"  name = EXCLUDED.name,")
            sql.append(f"  sort_order = EXCLUDED.sort_order;\n")
    
    # Add category translations (English)
    sql.append("\n-- ============================================================================")
    sql.append("-- CATEGORY TRANSLATIONS (English)")
    sql.append("-- ============================================================================\n")
    
    for cat in categories_data:
        sql.append(f"INSERT INTO category_translations (id, category_id, language_code, name, slug)")
        sql.append(f"SELECT")
        sql.append(f"  gen_random_uuid(),")
        sql.append(f"  c.id,")
        sql.append(f"  'en',")
        sql.append(f"  {escape_sql_string(cat['name'])},")
        sql.append(f"  {escape_sql_string(cat['slug'])}")
        sql.append(f"FROM categories c")
        sql.append(f"WHERE c.slug = {escape_sql_string(cat['slug'])}")
        sql.append(f"ON CONFLICT (category_id, language_code) DO UPDATE SET")
        sql.append(f"  name = EXCLUDED.name,")
        sql.append(f"  slug = EXCLUDED.slug;\n")
    
    return "\n".join(sql)

def generate_products_sql(products_data, limit=None):
    """Generate SQL for importing products"""
    sql = []
    
    sql.append("-- ============================================================================")
    sql.append("-- RIDE ENGINE PRODUCTS")
    sql.append("-- ============================================================================\n")
    
    products_to_import = products_data[:limit] if limit else products_data
    
    for idx, product in enumerate(products_to_import, 1):
        title = product['title']
        handle = product['handle']
        vendor = product.get('vendor', BRAND_VENDOR)
        product_type = product.get('product_type', 'Accessories')
        description = product.get('description_html', '')
        tags = product.get('tags', [])
        
        # Determine sport
        sport = map_ride_engine_to_sport(tags, product_type)
        
        # Create slug (handle can be used as canonicalSlug)
        slug = f"ride-engine-{handle}"
        
        # SEO data
        seo_title = product.get('seo', {}).get('title', title)
        seo_description = product.get('seo', {}).get('description', '')
        
        sql.append(f"-- Product {idx}: {title}")
        sql.append(f"DO $$")
        sql.append(f"DECLARE product_uuid UUID;")
        sql.append(f"BEGIN")
        sql.append(f"  INSERT INTO products (")
        sql.append(f"    id, title, subtitle, canonical_slug, sport, product_type,")
        sql.append(f"    status, description_rich, seo_meta_title, seo_meta_description,")
        sql.append(f"    created_at, updated_at")
        sql.append(f"  )")
        sql.append(f"  VALUES (")
        sql.append(f"    gen_random_uuid(),")
        sql.append(f"    {escape_sql_string(title)},")
        sql.append(f"    NULL,")
        sql.append(f"    {escape_sql_string(slug)},")
        sql.append(f"    '{sport}',")
        sql.append(f"    {escape_sql_string(product_type)},")
        sql.append(f"    '{product.get('status', 'active')}',")
        sql.append(f"    {escape_sql_string(description)},")
        sql.append(f"    {escape_sql_string(seo_title)},")
        sql.append(f"    {escape_sql_string(seo_description)},")
        sql.append(f"    NOW(),")
        sql.append(f"    NOW()")
        sql.append(f"  )")
        sql.append(f"  ON CONFLICT (canonical_slug) DO UPDATE SET")
        sql.append(f"    title = EXCLUDED.title,")
        sql.append(f"    description_rich = EXCLUDED.description_rich,")
        sql.append(f"    updated_at = NOW()")
        sql.append(f"  RETURNING id INTO product_uuid;")
        
        # Add product translations (English)
        sql.append(f"\n  -- English translation")
        sql.append(f"  INSERT INTO product_translations (")
        sql.append(f"    id, product_id, language_code, title, description_html,")
        sql.append(f"    seo_title, seo_description, tags")
        sql.append(f"  )")
        sql.append(f"  VALUES (")
        sql.append(f"    gen_random_uuid(),")
        sql.append(f"    product_uuid,")
        sql.append(f"    'en',")
        sql.append(f"    {escape_sql_string(title)},")
        sql.append(f"    {escape_sql_string(description)},")
        sql.append(f"    {escape_sql_string(seo_title)},")
        sql.append(f"    {escape_sql_string(seo_description)},")
        sql.append(f"    ARRAY{str(tags)}")
        sql.append(f"  )")
        sql.append(f"  ON CONFLICT (product_id, language_code) DO UPDATE SET")
        sql.append(f"    title = EXCLUDED.title,")
        sql.append(f"    description_html = EXCLUDED.description_html;")
        
        # Link to Ride Engine brand collection
        sql.append(f"\n  -- Link to Ride Engine brand collection")
        sql.append(f"  INSERT INTO product_categories (product_id, category_id, sort_order)")
        sql.append(f"  SELECT product_uuid, c.id, 0")
        sql.append(f"  FROM categories c")
        sql.append(f"  WHERE c.slug = {escape_sql_string(BRAND_SLUG)}")
        sql.append(f"  ON CONFLICT DO NOTHING;")
        
        # Link to specific categories based on collections
        for collection_handle in product.get('collections', []):
            sql.append(f"\n  -- Link to {collection_handle} category")
            sql.append(f"  INSERT INTO product_categories (product_id, category_id, sort_order)")
            sql.append(f"  SELECT product_uuid, c.id, 0")
            sql.append(f"  FROM categories c")
            sql.append(f"  WHERE c.slug = {escape_sql_string(collection_handle)}")
            sql.append(f"  ON CONFLICT DO NOTHING;")
        
        # Add variants
        for v_idx, variant in enumerate(product.get('variants', [])):
            sku = variant.get('sku', f"{handle}-{v_idx}")
            price = variant.get('price', '0')
            compare_price = variant.get('compare_at_price')
            
            # Convert price to cents
            try:
                price_cents = int(float(price) * 100)
            except:
                price_cents = 0
            
            try:
                compare_cents = int(float(compare_price) * 100) if compare_price else 'NULL'
            except:
                compare_cents = 'NULL'
            
            barcode = variant.get('barcode', '')
            weight = variant.get('weight', 0)
            
            sql.append(f"\n  -- Variant: {variant.get('title', 'Default')}")
            sql.append(f"  INSERT INTO product_variants (")
            sql.append(f"    id, product_id, sku, price_eur_cents, compare_price_eur_cents,")
            sql.append(f"    weight_grams, barcode, stock_quantity, is_available")
            sql.append(f"  )")
            sql.append(f"  VALUES (")
            sql.append(f"    gen_random_uuid(),")
            sql.append(f"    product_uuid,")
            sql.append(f"    {escape_sql_string(sku)},")
            sql.append(f"    {price_cents},")
            sql.append(f"    {compare_cents},")
            sql.append(f"    {weight or 0},")
            sql.append(f"    {escape_sql_string(barcode)},")
            sql.append(f"    {variant.get('inventory_quantity', 0)},")
            sql.append(f"    true")
            sql.append(f"  )")
            sql.append(f"  ON CONFLICT (sku) DO UPDATE SET")
            sql.append(f"    price_eur_cents = EXCLUDED.price_eur_cents,")
            sql.append(f"    stock_quantity = EXCLUDED.stock_quantity;")
        
        # Add images
        for img_idx, image in enumerate(product.get('images', [])):
            sql.append(f"\n  -- Image {img_idx + 1}")
            sql.append(f"  INSERT INTO product_images (")
            sql.append(f"    id, product_id, url, alt_text, sort_order, is_primary")
            sql.append(f"  )")
            sql.append(f"  VALUES (")
            sql.append(f"    gen_random_uuid(),")
            sql.append(f"    product_uuid,")
            sql.append(f"    {escape_sql_string(image.get('src', ''))},")
            sql.append(f"    {escape_sql_string(image.get('alt', title))},")
            sql.append(f"    {image.get('position', img_idx)},")
            sql.append(f"    {str(img_idx == 0).lower()}")
            sql.append(f"  )")
            sql.append(f"  ON CONFLICT DO NOTHING;")
        
        sql.append(f"END $$;\n")
    
    return "\n".join(sql)

def generate_summary_sql():
    """Generate a summary query"""
    sql = []
    
    sql.append("-- ============================================================================")
    sql.append("-- IMPORT VERIFICATION")
    sql.append("-- ============================================================================\n")
    
    sql.append("-- Count Ride Engine products")
    sql.append("SELECT COUNT(*) as ride_engine_products")
    sql.append("FROM products")
    sql.append("WHERE canonical_slug LIKE 'ride-engine-%';\n")
    
    sql.append("-- Count categories")
    sql.append("SELECT COUNT(*) as total_categories FROM categories;\n")
    
    sql.append("-- Products by category")
    sql.append("SELECT c.name, COUNT(pc.product_id) as product_count")
    sql.append("FROM categories c")
    sql.append("LEFT JOIN product_categories pc ON c.id = pc.category_id")
    sql.append("GROUP BY c.id, c.name")
    sql.append("ORDER BY product_count DESC")
    sql.append("LIMIT 20;")
    
    return "\n".join(sql)

def main():
    """Main execution function"""
    print("="*60)
    print("  RIDE ENGINE DATABASE IMPORT - Step 5")
    print("="*60)
    
    # Create SQL output directory
    SQL_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    
    # Load data
    print("\n📂 Loading import data...")
    data = load_import_data()
    
    if not data.get('products'):
        print("❌ No products found! Run previous scripts first.")
        return
    
    print(f"   ✓ Loaded {len(data['products'])} products")
    print(f"   ✓ Loaded {len(data.get('categories', []))} categories")
    
    # Generate SQL files
    print("\n🔨 Generating SQL import scripts...")
    
    # 1. Brand collection
    brand_sql = generate_brand_collections_sql()
    brand_file = SQL_OUTPUT_DIR / "01_ride_engine_brand.sql"
    with open(brand_file, 'w', encoding='utf-8') as f:
        f.write(brand_sql)
    print(f"   ✓ {brand_file}")
    
    # 2. Categories
    if data.get('categories'):
        categories_sql = generate_categories_sql(data['categories'])
        categories_file = SQL_OUTPUT_DIR / "02_ride_engine_categories.sql"
        with open(categories_file, 'w', encoding='utf-8') as f:
            f.write(categories_sql)
        print(f"   ✓ {categories_file}")
    
    # 3. Products (all)
    products_sql = generate_products_sql(data['products'])
    products_file = SQL_OUTPUT_DIR / "03_ride_engine_products_all.sql"
    with open(products_file, 'w', encoding='utf-8') as f:
        f.write(products_sql)
    print(f"   ✓ {products_file}")
    
    # 4. Products (sample - first 10 for testing)
    products_sample_sql = generate_products_sql(data['products'], limit=10)
    products_sample_file = SQL_OUTPUT_DIR / "03_ride_engine_products_sample.sql"
    with open(products_sample_file, 'w', encoding='utf-8') as f:
        f.write(products_sample_sql)
    print(f"   ✓ {products_sample_file} (first 10 products for testing)")
    
    # 5. Summary queries
    summary_sql = generate_summary_sql()
    summary_file = SQL_OUTPUT_DIR / "04_verify_import.sql"
    with open(summary_file, 'w', encoding='utf-8') as f:
        f.write(summary_sql)
    print(f"   ✓ {summary_file}")
    
    # Create master import script
    master_file = SQL_OUTPUT_DIR / "00_IMPORT_ALL.sql"
    with open(master_file, 'w', encoding='utf-8') as f:
        f.write("-- ============================================================================\n")
        f.write("-- RIDE ENGINE COMPLETE IMPORT\n")
        f.write("-- ============================================================================\n\n")
        f.write("-- USAGE:\n")
        f.write("-- psql -d your_database < 00_IMPORT_ALL.sql\n\n")
        f.write("BEGIN;\n\n")
        f.write("\\i 01_ride_engine_brand.sql\n")
        f.write("\\i 02_ride_engine_categories.sql\n")
        f.write("\\i 03_ride_engine_products_all.sql\n")
        f.write("\\i 04_verify_import.sql\n\n")
        f.write("COMMIT;\n")
    print(f"   ✓ {master_file} (imports all)")
    
    print("\n📊 Summary:")
    print(f"   Products to import: {len(data['products'])}")
    print(f"   Categories to import: {len(data.get('categories', []))}")
    print(f"   Total variants: {sum(len(p.get('variants', [])) for p in data['products'])}")
    print(f"   Total images: {sum(len(p.get('images', [])) for p in data['products'])}")
    
    print("\n" + "="*60)
    print("✅ STEP 5 COMPLETE!")
    print("="*60)
    print(f"\n📁 SQL files generated in: {SQL_OUTPUT_DIR}")
    print("\n🚀 Next steps:")
    print("   1. Review the SQL files")
    print("   2. Test with sample: psql -d your_db < 03_ride_engine_products_sample.sql")
    print("   3 Import all: psql -d your_db < 00_IMPORT_ALL.sql")
    print("   4. Or execute via your preferred SQL client")

if __name__ == "__main__":
    main()
