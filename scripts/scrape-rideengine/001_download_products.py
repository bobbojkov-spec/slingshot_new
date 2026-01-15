#!/usr/bin/env python3
"""
Ride Engine Product Scraper - Step 1: Download all products
This script downloads all product data from rideengine.com using Shopify's JSON API
"""

import requests
import json
import os
from datetime import datetime
from pathlib import Path

# Configuration
BASE_URL = "https://rideengine.com"
PRODUCTS_ENDPOINT = f"{BASE_URL}/products.json"
OUTPUT_DIR = Path("rideengine_data")
RAW_DATA_DIR = OUTPUT_DIR / "raw"
LOGS_DIR = OUTPUT_DIR / "logs"

def setup_directories():
    """Create necessary directories for output"""
    RAW_DATA_DIR.mkdir(parents=True, exist_ok=True)
    LOGS_DIR.mkdir(parents=True, exist_ok=True)
    print(f"✓ Created directories: {OUTPUT_DIR}")

def fetch_all_products():
    """
    Fetch all products from Ride Engine using pagination
    Shopify allows max 250 products per page
    """
    all_products = []
    page = 1
    limit = 250
    
    print(f"\n🔍 Starting product download from {BASE_URL}...")
    
    while True:
        try:
            url = f"{PRODUCTS_ENDPOINT}?limit={limit}&page={page}"
            print(f"   Fetching page {page}... ", end="")
            
            response = requests.get(url, timeout=30)
            response.raise_for_status()
            
            data = response.json()
            products = data.get('products', [])
            
            if not products:
                print("(no more products)")
                break
            
            all_products.extend(products)
            print(f"✓ Got {len(products)} products")
            
            # If we got fewer products than the limit, we're done
            if len(products) < limit:
                break
            
            page += 1
            
        except requests.RequestException as e:
            print(f"\n❌ Error fetching page {page}: {e}")
            break
    
    return all_products

def save_products(products):
    """Save products to JSON file with metadata"""
    timestamp = datetime.now().isoformat()
    
    output_data = {
        "scraped_at": timestamp,
        "source": BASE_URL,
        "total_products": len(products),
        "products": products
    }
    
    # Save full data
    output_file = RAW_DATA_DIR / "all_products.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, indent=2, ensure_ascii=False)
    
    print(f"\n✓ Saved {len(products)} products to {output_file}")
    
    # Save a summary report
    summary_file = OUTPUT_DIR / "summary.txt"
    with open(summary_file, 'w', encoding='utf-8') as f:
        f.write(f"Ride Engine Product Scrape Summary\n")
        f.write(f"{'='*50}\n")
        f.write(f"Scraped at: {timestamp}\n")
        f.write(f"Total products: {len(products)}\n\n")
        f.write(f"Products:\n")
        for p in products:
            f.write(f"  - {p['title']} (ID: {p['id']})\n")
    
    print(f"✓ Saved summary to {summary_file}")
    
    return output_file

def analyze_products(products):
    """Analyze and print statistics about the products"""
    print(f"\n📊 Product Analysis:")
    print(f"   Total products: {len(products)}")
    
    # Collect all unique tags
    all_tags = set()
    all_vendors = set()
    all_types = set()
    
    total_variants = 0
    total_images = 0
    
    for product in products:
        tags = product.get('tags', [])
        if isinstance(tags, str):
            all_tags.update([t.strip() for t in tags.split(',')])
        elif isinstance(tags, list):
            all_tags.update(tags)
        
        all_vendors.add(product.get('vendor', 'Unknown'))
        all_types.add(product.get('product_type', 'Unknown'))
        
        total_variants += len(product.get('variants', []))
        total_images += len(product.get('images', []))
    
    print(f"   Total variants: {total_variants}")
    print(f"   Total images: {total_images}")
    print(f"   Unique tags: {len(all_tags)}")
    print(f"   Vendors: {', '.join(sorted(all_vendors))}")
    print(f"   Product types: {len(all_types)}")
    
    # Save detailed analysis
    analysis_file = OUTPUT_DIR / "analysis.json"
    analysis_data = {
        "total_products": len(products),
        "total_variants": total_variants,
        "total_images": total_images,
        "tags": sorted(list(all_tags)),
        "vendors": sorted(list(all_vendors)),
        "product_types": sorted(list(all_types))
    }
    
    with open(analysis_file, 'w', encoding='utf-8') as f:
        json.dump(analysis_data, f, indent=2, ensure_ascii=False)
    
    print(f"   ✓ Saved detailed analysis to {analysis_file}")

def main():
    """Main execution function"""
    print("="*60)
    print("  RIDE ENGINE PRODUCT SCRAPER - Step 1")
    print("="*60)
    
    # Setup
    setup_directories()
    
    # Fetch products
    products = fetch_all_products()
    
    if not products:
        print("\n❌ No products found!")
        return
    
    # Save products
    save_products(products)
    
    # Analyze
    analyze_products(products)
    
    print("\n" + "="*60)
    print("✅ STEP 1 COMPLETE!")
    print("="*60)
    print(f"\nNext steps:")
    print(f"  1. Run: python3 002_download_collections.py")
    print(f"  2. Run: python3 003_download_images.py")
    print(f"  3. Run: python3 004_prepare_import.py")

if __name__ == "__main__":
    main()
