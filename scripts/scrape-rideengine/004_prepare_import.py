#!/usr/bin/env python3
"""
Ride Engine Data Preparation - Step 4: Prepare data for database import
This script transforms the scraped data into a format ready for database import
"""

import json
from pathlib import Path
from datetime import datetime
import re

# Configuration
OUTPUT_DIR = Path("rideengine_data")
RAW_DATA_DIR = OUTPUT_DIR / "raw"
IMPORT_DIR = OUTPUT_DIR / "import_ready"

def load_data():
    """Load all previously scraped data"""
    products_file = RAW_DATA_DIR / "all_products.json"
    collections_file = RAW_DATA_DIR / "all_collections.json"
    category_tree_file = OUTPUT_DIR / "category_tree.json"
    
    data = {}
    
    # Load products
    if products_file.exists():
        with open(products_file, 'r', encoding='utf-8') as f:
            data['products'] = json.load(f).get('products', [])
    
    # Load collections
    if collections_file.exists():
        with open(collections_file, 'r', encoding='utf-8') as f:
            data['collections'] = json.load(f).get('collections', [])
    
    # Load category tree
    if category_tree_file.exists():
        with open(category_tree_file, 'r', encoding='utf-8') as f:
            data['category_tree'] = json.load(f)
    
    return data

def clean_html(html_text):
    """Remove HTML tags and clean text"""
    if not html_text:
        return ""
    
    # Remove HTML tags
    clean = re.sub(r'<[^>]+>', '', html_text)
    # Clean up whitespace
    clean = re.sub(r'\s+', ' ', clean).strip()
    return clean

def prepare_categories(category_tree):
    """Prepare categories for database import"""
    categories = []
    category_id = 1
    
    for main_cat_name, main_cat_data in category_tree.items():
        # Add main category
        main_category = {
            "id": category_id,
            "name": main_cat_name,
            "slug": main_cat_data['handle'],
            "parent_id": None,
            "level": 1,
            "sort_order": category_id
        }
        categories.append(main_category)
        main_cat_id = category_id
        category_id += 1
        
        # Add subcategories
        for idx, subcat in enumerate(main_cat_data.get('subcategories', [])):
            subcategory = {
                "id": category_id,
                "name": subcat['name'],
                "slug": subcat['handle'],
                "parent_id": main_cat_id,
                "level": 2,
                "sort_order": idx + 1
            }
            categories.append(subcategory)
            category_id += 1
    
    return categories

def prepare_products(products, collections_data):
    """Prepare products for database import"""
    prepared_products = []
    
    # Create a mapping of product handles to collection handles
    product_to_collections = {}
    for collection in collections_data:
        for product in collection.get('products', []):
            handle = product.get('handle')
            if handle not in product_to_collections:
                product_to_collections[handle] = []
            product_to_collections[handle].append(collection['handle'])
    
    for product in products:
        handle = product.get('handle', '')
        
        # Extract main data
        prepared_product = {
            "shopify_id": product.get('id'),
            "title": product.get('title', ''),
            "handle": handle,
            "vendor": product.get('vendor', 'Ride Engine'),
            "product_type": product.get('product_type', ''),
            "description_html": product.get('body_html', ''),
            "description_text": clean_html(product.get('body_html', '')),
            "tags": product.get('tags', '').split(',') if isinstance(product.get('tags'), str) else product.get('tags', []),
            "published_at": product.get('published_at'),
            "created_at": product.get('created_at'),
            "updated_at": product.get('updated_at'),
            "status": "active" if product.get('published_at') else "draft",
            "collections": product_to_collections.get(handle, []),
            "variants": [],
            "images": [],
            "seo": {
                "title": product.get('title', ''),
                "description": clean_html(product.get('body_html', ''))[:160] if product.get('body_html') else ''
            }
        }
        
        # Extract variants
        for variant in product.get('variants', []):
            prepared_variant = {
                "shopify_id": variant.get('id'),
                "title": variant.get('title', ''),
                "price": variant.get('price', '0'),
                "compare_at_price": variant.get('compare_at_price'),
                "sku": variant.get('sku', ''),
                "barcode": variant.get('barcode', ''),
                "inventory_quantity": variant.get('inventory_quantity', 0),
                "weight": variant.get('weight'),
                "weight_unit": variant.get('weight_unit', 'kg'),
                "requires_shipping": variant.get('requires_shipping', True),
                "taxable": variant.get('taxable', True),
                "option1": variant.get('option1'),
                "option2": variant.get('option2'),
                "option3": variant.get('option3'),
            }
            prepared_product['variants'].append(prepared_variant)
        
        # Extract images
        for img in product.get('images', []):
            prepared_image = {
                "shopify_id": img.get('id'),
                "src": img.get('src', ''),
                "width": img.get('width'),
                "height": img.get('height'),
                "alt": img.get('alt', prepared_product['title']),
                "position": img.get('position', 1),
                "local_path": f"rideengine_data/images/{handle}/{img.get('src', '').split('/')[-1].split('?')[0]}"
            }
            prepared_product['images'].append(prepared_image)
        
        prepared_products.append(prepared_product)
    
    return prepared_products

def create_database_sql(categories, products):
    """Create SQL statements for database import (example for PostgreSQL)"""
    
    sql_statements = []
    
    # Categories INSERT statements
    sql_statements.append("-- Categories")
    sql_statements.append("INSERT INTO categories (id, name, slug, parent_id, level, sort_order) VALUES")
    
    category_values = []
    for cat in categories:
        parent_id = f"{cat['parent_id']}" if cat['parent_id'] is not None else "NULL"
        category_values.append(
            f"({cat['id']}, '{cat['name']}', '{cat['slug']}', {parent_id}, {cat['level']}, {cat['sort_order']})"
        )
    
    sql_statements.append(",\n".join(category_values) + ";\n")
    
    # Products - simplified example
    sql_statements.append("\n-- Products (example - adjust to your schema)")
    sql_statements.append("-- Note: You'll need to adjust this based on your actual database schema")
    
    for product in products[:5]:  # Just show first 5 as examples
        sql_statements.append(f"""
-- Product: {product['title']}
INSERT INTO products (shopify_id, title, handle, vendor, product_type, description, status)
VALUES (
    {product['shopify_id']},
    '{product['title'].replace("'", "''")}',
    '{product['handle']}',
    '{product['vendor']}',
    '{product['product_type']}',
    '{product['description_text'][:200].replace("'", "''")}...',
    '{product['status']}'
);
""")
    
    return "\n".join(sql_statements)

def main():
    """Main execution function"""
    print("="*60)
    print("  RIDE ENGINE DATA PREPARATION - Step 4")
    print("="*60)
    
    # Create import directory
    IMPORT_DIR.mkdir(parents=True, exist_ok=True)
    
    # Load all data
    print("\n📂 Loading scraped data...")
    data = load_data()
    
    if 'products' not in data or not data['products']:
        print("❌ No products found! Run previous scripts first.")
        return
    
    print(f"   ✓ Loaded {len(data['products'])} products")
    
    # Prepare categories
    print("\n🏗️  Preparing categories...")
    categories = prepare_categories(data.get('category_tree', {}))
    print(f"   ✓ Prepared {len(categories)} categories")
    
    # Save categories
    categories_file = IMPORT_DIR / "categories.json"
    with open(categories_file, 'w', encoding='utf-8') as f:
        json.dump(categories, f, indent=2, ensure_ascii=False)
    print(f"   ✓ Saved to {categories_file}")
    
    # Prepare products
    print("\n📦 Preparing products...")
    prepared_products = prepare_products(
        data['products'],
        data.get('collections', [])
    )
    print(f"   ✓ Prepared {len(prepared_products)} products")
    
    # Save products
    products_file = IMPORT_DIR / "products.json"
    with open(products_file, 'w', encoding='utf-8') as f:
        json.dump(prepared_products, f, indent=2, ensure_ascii=False)
    print(f"   ✓ Saved to {products_file}")
    
    # Create SQL example
    print("\n💾 Creating SQL examples...")
    sql_file = IMPORT_DIR / "import_example.sql"
    sql_content = create_database_sql(categories, prepared_products)
    with open(sql_file, 'w', encoding='utf-8') as f:
        f.write(sql_content)
    print(f"   ✓ Saved to {sql_file}")
    
    # Create import summary
    summary = {
        "prepared_at": datetime.now().isoformat(),
        "source": "Ride Engine (rideengine.com)",
        "total_categories": len(categories),
        "total_products": len(prepared_products),
        "total_variants": sum(len(p['variants']) for p in prepared_products),
        "total_images": sum(len(p['images']) for p in prepared_products),
        "files": {
            "categories": str(categories_file),
            "products": str(products_file),
            "sql_example": str(sql_file)
        }
    }
    
    summary_file = IMPORT_DIR / "import_summary.json"
    with open(summary_file, 'w', encoding='utf-8') as f:
        json.dump(summary, f, indent=2, ensure_ascii=False)
    
    print("\n📊 Import Summary:")
    print(f"   Categories: {summary['total_categories']}")
    print(f"   Products: {summary['total_products']}")
    print(f"   Variants: {summary['total_variants']}")
    print(f"   Images: {summary['total_images']}")
    
    print("\n📁 Files ready for import:")
    print(f"   {categories_file}")
    print(f"   {products_file}")
    print(f"   {sql_file}")
    
    print("\n" + "="*60)
    print("✅ STEP 4 COMPLETE!")
    print("="*60)
    print("\n🎯 All data is ready for database import!")
    print(f"   Import directory: {IMPORT_DIR}")

if __name__ == "__main__":
    main()
