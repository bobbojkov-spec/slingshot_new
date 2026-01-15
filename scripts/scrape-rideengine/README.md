# Ride Engine Data Scraper

Complete Python scraper suite for downloading all product data, categories, and images from **rideengine.com**.

## 📋 Overview

This collection of scripts utilizes Shopify's public JSON API to extract:
- ✅ All product data (names, descriptions, variants, prices, SKUs)
- ✅ Complete category/collection structure
- ✅ All product images with metadata
- ✅ Cleaned data ready for database import

## 🚀 Quick Start

### Prerequisites

```bash
# Install required Python package
pip install requests
```

### Run Everything at Once

```bash
cd scripts/scrape-rideengine
python3 run_all.py
```

Or run individual steps:

```bash
# Step 1: Download all products
python3 001_download_products.py

# Step 2: Download collections/categories
python3 002_download_collections.py

# Step 3: Download all images
python3 003_download_images.py

# Step 4: Prepare data for import
python3 004_prepare_import.py
```

## 📂 Output Structure

After running, you'll have this structure:

```
rideengine_data/
├── raw/
│   ├── all_products.json          # All products (raw Shopify format)
│   ├── all_collections.json       # All collections/categories
│   └── collections/               # Individual collection files
│       ├── harnesses.json
│       ├── wetsuits.json
│       └── ...
├── images/
│   ├── hyperlock-harness/         # Images organized by product
│   │   ├── 00_image.jpg
│   │   ├── 01_image.jpg
│   │   └── images_metadata.json
│   └── ...
├── import_ready/
│   ├── categories.json            # Clean category hierarchy
│   ├── products.json              # Clean product data
│   ├── import_example.sql         # SQL examples
│   └── import_summary.json        # Import statistics
├── category_tree.json             # Hierarchical category structure
├── analysis.json                  # Data analysis (tags, types, etc.)
└── summary.txt                    # Human-readable summary
```

## 📊 What Gets Scraped

### Products
- Product ID, title, handle (URL slug)
- Full HTML description
- Vendor, product type
- Tags (for filtering)
- Published/created/updated dates
- All variants (sizes, colors, etc.)
- Price, compare price, SKU, barcode
- Inventory quantity
- Weight and dimensions

### Collections/Categories
- Main categories (Harnesses, Wetsuits, etc.)
- Subcategories (Men's, Women's, etc.)
- Products in each category

### Images
- All product images in original quality
- Image metadata (dimensions, alt text, position)
- Local file paths for database reference

## 🔍 Script Details

### 001_download_products.py
Downloads all products using Shopify's `/products.json` endpoint with pagination support.

**Output:**
- `raw/all_products.json` - Complete product data
- `analysis.json` - Statistics about products, tags, vendors
- `summary.txt` - Human-readable summary

### 002_download_collections.py
Fetches all collections (categories) and builds a hierarchical structure.

**Output:**
- `raw/all_collections.json` - All collection data
- `raw/collections/*.json` - Individual collection files
- `category_tree.json` - Hierarchical category structure

### 003_download_images.py
Downloads all product images and organizes them by product handle.

**Features:**
- Respectful rate limiting (100ms delay between downloads)
- Skips already downloaded images
- Saves metadata for each image
- Progress tracking

**Output:**
- `images/{product-handle}/` - Product image folders
- `images/{product-handle}/images_metadata.json` - Image metadata
- `images_summary.json` - Download statistics

### 004_prepare_import.py
Transforms raw Shopify data into clean, database-ready format.

**Features:**
- Cleans HTML from descriptions
- Creates category hierarchy
- Maps products to categories
- Generates SQL examples
- Creates import-ready JSON files

**Output:**
- `import_ready/categories.json` - Clean category data
- `import_ready/products.json` - Clean product data
- `import_ready/import_example.sql` - SQL import examples
- `import_ready/import_summary.json` - Import statistics

## 💾 Database Import

The `import_ready/` folder contains clean JSON files ready for import:

### Categories Structure
```json
{
  "id": 1,
  "name": "Harnesses",
  "slug": "harnesses",
  "parent_id": null,
  "level": 1,
  "sort_order": 1
}
```

### Products Structure
```json
{
  "shopify_id": 123456789,
  "title": "Hyperlock Elite Harness",
  "handle": "hyperlock-elite-harness",
  "vendor": "Ride Engine",
  "product_type": "Harness",
  "description_html": "<p>Original HTML</p>",
  "description_text": "Clean text version",
  "tags": ["Kitesurf", "Wing Foil"],
  "collections": ["harnesses", "hyperlock-system"],
  "variants": [...],
  "images": [...],
  "seo": {
    "title": "...",
    "description": "..."
  }
}
```

## ⚙️ Configuration

You can modify these settings at the top of each script:

- `DELAY_BETWEEN_DOWNLOADS` - Delay between image downloads (default: 0.1s)
- `OUTPUT_DIR` - Where to save all data (default: `rideengine_data`)

## 🎯 Next Steps: Database Migration

After running the scripts:

1. **Review the data** in `import_ready/`
2. **Adapt the SQL** in `import_example.sql` to match your database schema
3. **Map categories** to your existing category structure (or create new ones)
4. **Import products** using the clean JSON files
5. **Upload images** to your storage (S3, local, etc.)
6. **Update image paths** in your database to point to your storage

## 📝 Notes

### Shopify API Advantages
- ✅ No authentication required for public data
- ✅ Clean, structured JSON format
- ✅ No need for HTML parsing
- ✅ Reliable and consistent

### Best Practices
- Run during off-peak hours to be respectful
- The scripts include rate limiting
- Images are downloaded once and cached
- All data is versioned with timestamps

### Data Freshness
To update the data, simply run the scripts again. They will:
- Re-download product data (products change frequently)
- Skip already downloaded images (saves bandwidth)
- Update all JSON files with latest data

## 🔗 API Endpoints Used

- `/products.json?limit=250` - All products
- `/collections/{handle}/products.json` - Products by category

## 📞 Support

If you encounter issues:
1. Check that `requests` is installed: `pip install requests`
2. Verify internet connection to rideengine.com
3. Check the logs in `rideengine_data/logs/` (if created)
4. Ensure you have write permissions in the script directory

## 📜 License

Internal use for official Ride Engine distributors in Bulgaria.
