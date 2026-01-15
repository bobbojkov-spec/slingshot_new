#!/usr/bin/env python3
"""
Ride Engine Collections Scraper - Step 2: Download all collections/categories
This script downloads collection data to understand the category structure
"""

import requests
import json
from pathlib import Path
from datetime import datetime

# Configuration
BASE_URL = "https://rideengine.com"
OUTPUT_DIR = Path("rideengine_data")
RAW_DATA_DIR = OUTPUT_DIR / "raw"

# Known collections from the website structure
KNOWN_COLLECTIONS = [
    "harnesses",
    "hyperlock-system",
    "wing-foil-harnesses",
    "spreader-bars",
    "harness-parts-accessories",
    "performance-pwc",
    "pwc-collars-pontoons",
    "performance-sleds",
    "inflation-accessories",
    "e-inflation",
    "manual-pumps",
    "leashes",
    "foot-straps",
    "vehicle-accessories",
    "protection",
    "impact-vests",
    "helmets",
    "hand-knee-protection",
    "bags",
    "wheeled-travel-bags",
    "board-bags",
    "day-protection",
    "wetsuits",
    "mens-wetsuits",
    "womens-wetsuits",
    "wetsuit-accessories",
    "apparel",
    "robes-ponchos",
    "technical-jackets",
    "water-wear",
    "hoodies",
    "t-shirts",
    "hats"
]

def fetch_collection(collection_handle):
    """Fetch a single collection's data"""
    url = f"{BASE_URL}/collections/{collection_handle}/products.json?limit=250"
    
    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        data = response.json()
        return {
            "handle": collection_handle,
            "url": f"{BASE_URL}/collections/{collection_handle}",
            "product_count": len(data.get('products', [])),
            "products": data.get('products', [])
        }
    except requests.RequestException as e:
        print(f"   ⚠️  Failed to fetch {collection_handle}: {e}")
        return None

def fetch_all_collections():
    """Fetch all known collections"""
    print(f"\n🔍 Fetching collections from {BASE_URL}...")
    
    collections_data = []
    
    for collection_handle in KNOWN_COLLECTIONS:
        print(f"   Fetching '{collection_handle}'... ", end="")
        
        collection_data = fetch_collection(collection_handle)
        
        if collection_data:
            collections_data.append(collection_data)
            print(f"✓ {collection_data['product_count']} products")
        else:
            print("✗ Failed")
    
    return collections_data

def save_collections(collections):
    """Save collections data to files"""
    timestamp = datetime.now().isoformat()
    
    # Save all collections in one file
    output_data = {
        "scraped_at": timestamp,
        "source": BASE_URL,
        "total_collections": len(collections),
        "collections": collections
    }
    
    output_file = RAW_DATA_DIR / "all_collections.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, indent=2, ensure_ascii=False)
    
    print(f"\n✓ Saved {len(collections)} collections to {output_file}")
    
    # Also save individual collection files
    collections_dir = RAW_DATA_DIR / "collections"
    collections_dir.mkdir(exist_ok=True)
    
    for collection in collections:
        coll_file = collections_dir / f"{collection['handle']}.json"
        with open(coll_file, 'w', encoding='utf-8') as f:
            json.dump(collection, f, indent=2, ensure_ascii=False)
    
    print(f"✓ Saved individual collections to {collections_dir}")

def build_category_tree(collections):
    """Build a hierarchical category structure"""
    
    # Define the category hierarchy based on the website
    category_tree = {
        "Harnesses": {
            "handle": "harnesses",
            "subcategories": [
                {"name": "Hyperlock System", "handle": "hyperlock-system"},
                {"name": "Wing Foil Harnesses", "handle": "wing-foil-harnesses"},
                {"name": "Spreader Bars", "handle": "spreader-bars"},
                {"name": "Parts & Accessories", "handle": "harness-parts-accessories"}
            ]
        },
        "Performance PWC": {
            "handle": "performance-pwc",
            "subcategories": [
                {"name": "PWC Collars & Pontoons", "handle": "pwc-collars-pontoons"},
                {"name": "Performance Sleds", "handle": "performance-sleds"}
            ]
        },
        "Inflation & Accessories": {
            "handle": "inflation-accessories",
            "subcategories": [
                {"name": "E-Inflation (Air Box)", "handle": "e-inflation"},
                {"name": "Manual Pumps", "handle": "manual-pumps"},
                {"name": "Leashes", "handle": "leashes"},
                {"name": "Foot Straps", "handle": "foot-straps"},
                {"name": "Vehicle Accessories", "handle": "vehicle-accessories"}
            ]
        },
        "Protection": {
            "handle": "protection",
            "subcategories": [
                {"name": "Impact Vests", "handle": "impact-vests"},
                {"name": "Helmets", "handle": "helmets"},
                {"name": "Hand/Knee Protection", "handle": "hand-knee-protection"}
            ]
        },
        "Bags": {
            "handle": "bags",
            "subcategories": [
                {"name": "Wheeled Travel", "handle": "wheeled-travel-bags"},
                {"name": "Board Bags", "handle": "board-bags"},
                {"name": "Day Protection", "handle": "day-protection"}
            ]
        },
        "Wetsuits": {
            "handle": "wetsuits",
            "subcategories": [
                {"name": "Men's", "handle": "mens-wetsuits"},
                {"name": "Women's", "handle": "womens-wetsuits"},
                {"name": "Wetsuit Accessories", "handle": "wetsuit-accessories"}
            ]
        },
        "Apparel": {
            "handle": "apparel",
            "subcategories": [
                {"name": "Robes & Ponchos", "handle": "robes-ponchos"},
                {"name": "Technical Jackets", "handle": "technical-jackets"},
                {"name": "Water Wear", "handle": "water-wear"},
                {"name": "Hoodies", "handle": "hoodies"},
                {"name": "T-Shirts", "handle": "t-shirts"},
                {"name": "Hats", "handle": "hats"}
            ]
        }
    }
    
    # Save the category tree
    tree_file = OUTPUT_DIR / "category_tree.json"
    with open(tree_file, 'w', encoding='utf-8') as f:
        json.dump(category_tree, f, indent=2, ensure_ascii=False)
    
    print(f"✓ Saved category tree to {tree_file}")
    
    return category_tree

def main():
    """Main execution function"""
    print("="*60)
    print("  RIDE ENGINE COLLECTIONS SCRAPER - Step 2")
    print("="*60)
    
    # Fetch collections
    collections = fetch_all_collections()
    
    if not collections:
        print("\n❌ No collections found!")
        return
    
    # Save collections
    save_collections(collections)
    
    # Build category tree
    build_category_tree(collections)
    
    # Print summary
    print(f"\n📊 Collections Summary:")
    total_products = sum(c['product_count'] for c in collections)
    print(f"   Total collections: {len(collections)}")
    print(f"   Total products (with duplicates): {total_products}")
    
    print("\n" + "="*60)
    print("✅ STEP 2 COMPLETE!")
    print("="*60)
    print(f"\nNext: Run python3 003_download_images.py")

if __name__ == "__main__":
    main()
