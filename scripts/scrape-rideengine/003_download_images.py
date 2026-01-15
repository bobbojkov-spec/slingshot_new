#!/usr/bin/env python3
"""
Ride Engine Image Downloader - Step 3: Download all product images
This script downloads all product images and organizes them by product
"""

import requests
import json
from pathlib import Path
from datetime import datetime
from urllib.parse import urlparse
import time

# Configuration
OUTPUT_DIR = Path("rideengine_data")
RAW_DATA_DIR = OUTPUT_DIR / "raw"
IMAGES_DIR = OUTPUT_DIR / "images"
DELAY_BETWEEN_DOWNLOADS = 0.1  # seconds to avoid hammering the server

def load_products():
    """Load products from previously downloaded data"""
    products_file = RAW_DATA_DIR / "all_products.json"
    
    if not products_file.exists():
        print(f"❌ Products file not found: {products_file}")
        print(f"   Please run 001_download_products.py first!")
        return None
    
    with open(products_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
        return data.get('products', [])

def sanitize_filename(filename):
    """Sanitize filename to remove invalid characters"""
    return "".join(c if c.isalnum() or c in ('-', '_', '.') else '_' for c in filename)

def download_image(url, output_path):
    """Download a single image"""
    try:
        response = requests.get(url, timeout=30, stream=True)
        response.raise_for_status()
        
        with open(output_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        
        return True
    except Exception as e:
        print(f"\n      ⚠️  Failed to download {url}: {e}")
        return False

def download_product_images(product):
    """Download all images for a single product"""
    handle = product.get('handle', 'unknown')
    title = product.get('title', 'Unknown Product')
    images = product.get('images', [])
    
    if not images:
        return 0
    
    # Create product directory
    product_dir = IMAGES_DIR / sanitize_filename(handle)
    product_dir.mkdir(parents=True, exist_ok=True)
    
    # Track downloaded images
    downloaded = 0
    image_metadata = []
    
    for i, image in enumerate(images):
        src = image.get('src', '')
        if not src:
            continue
        
        # Parse URL to get file extension
        parsed_url = urlparse(src)
        path_parts = parsed_url.path.split('/')
        original_filename = path_parts[-1] if path_parts else f'image_{i}.jpg'
        
        # Remove URL parameters from filename
        clean_filename = original_filename.split('?')[0]
        
        # Create output filename
        output_filename = f"{i:02d}_{clean_filename}"
        output_path = product_dir / output_filename
        
        # Skip if already downloaded
        if output_path.exists():
            downloaded += 1
            continue
        
        # Download image
        if download_image(src, output_path):
            downloaded += 1
            
            # Save metadata
            image_metadata.append({
                "index": i,
                "filename": output_filename,
                "original_url": src,
                "width": image.get('width'),
                "height": image.get('height'),
                "alt": image.get('alt', title),
                "position": image.get('position', i + 1)
            })
            
            # Delay to be respectful
            time.sleep(DELAY_BETWEEN_DOWNLOADS)
    
    # Save image metadata for this product
    if image_metadata:
        metadata_file = product_dir / "images_metadata.json"
        with open(metadata_file, 'w', encoding='utf-8') as f:
            json.dump({
                "product_handle": handle,
                "product_title": title,
                "images": image_metadata
            }, f, indent=2, ensure_ascii=False)
    
    return downloaded

def main():
    """Main execution function"""
    print("="*60)
    print("  RIDE ENGINE IMAGE DOWNLOADER - Step 3")
    print("="*60)
    
    # Load products
    products = load_products()
    if not products:
        return
    
    print(f"\n📦 Loaded {len(products)} products")
    
    # Create images directory
    IMAGES_DIR.mkdir(parents=True, exist_ok=True)
    
    # Download images for each product
    print(f"\n⬇️  Downloading images...")
    
    total_images = 0
    total_products_with_images = 0
    
    for idx, product in enumerate(products, 1):
        title = product.get('title', 'Unknown')
        image_count = len(product.get('images', []))
        
        if image_count == 0:
            continue
        
        print(f"   [{idx}/{len(products)}] {title} ({image_count} images)... ", end="", flush=True)
        
        downloaded = download_product_images(product)
        total_images += downloaded
        total_products_with_images += 1
        
        print(f"✓ {downloaded}")
    
    # Create summary
    summary = {
        "downloaded_at": datetime.now().isoformat(),
        "total_products": len(products),
        "products_with_images": total_products_with_images,
        "total_images_downloaded": total_images,
        "images_directory": str(IMAGES_DIR)
    }
    
    summary_file = OUTPUT_DIR / "images_summary.json"
    with open(summary_file, 'w', encoding='utf-8') as f:
        json.dump(summary, f, indent=2, ensure_ascii=False)
    
    print(f"\n📊 Download Summary:")
    print(f"   Products processed: {len(products)}")
    print(f"   Products with images: {total_products_with_images}")
    print(f"   Total images downloaded: {total_images}")
    print(f"   Images saved to: {IMAGES_DIR}")
    
    print("\n" + "="*60)
    print("✅ STEP 3 COMPLETE!")
    print("="*60)
    print(f"\nNext: Run python3 004_prepare_import.py")

if __name__ == "__main__":
    main()
