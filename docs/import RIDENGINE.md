https://rideengine.com/

I need to create scripts and download all the information  from this brand.

and import it OUR database. 

so lets first take what they have. and then think about migration and adaptation. ( its different brand. we can differentiate with that)


1. Website Structure & Categories
Based on the official site, you should structure your database and navigation as follows:

Harnesses: Hyperlock System, Wing Foil Harnesses, Spreader Bars, Parts & Accessories.

Performance PWC: PWC Collars and Pontoons, Performance Sleds.

Inflation & Accessories: E-Inflation (Air Box), Manual Pumps, Leashes, Foot Straps, Vehicle Accessories.

Protection: Impact Vests (Defender, Empax, Pali, Space Mob), Helmets, Hand/Knee Protection.

Bags: Wheeled Travel, Board Bags, Day Protection.

Wetsuits: Men’s, Women’s, Wetsuit Accessories.

Apparel: Robes & Ponchos, Technical Jackets, Water Wear, Hoodies, T-Shirts, Hats.

2. Technical Implementation (The "Scraping" Script)
Ride Engine uses Shopify as its backend engine. This is excellent news for your project because Shopify stores usually have a public JSON endpoint that allows you to download product data without complex web scraping.

Step 1: Download Product Data (JSON)
Instead of scraping HTML, you can append .json to the collections URL to get clean data (IDs, Tags, Variants, Descriptions, and Image URLs).

Main Products Feed: https://rideengine.com/products.json?limit=250

Category Specific: https://rideengine.com/collections/harnesses/products.json

Step 2: Python Script Example
You can use a script like this to fetch the data and images:

Python
import requests
import json
import os

# Base URL for the Shopify store
BASE_URL = "https://rideengine.com/products.json?limit=250"

def download_ride_engine_data():
    response = requests.get(BASE_URL)
    products = response.json()['products']
    
    for product in products:
        title = product['title']
        product_id = product['id']
        tags = product['tags']
        handle = product['handle'] # The URL slug
        
        print(f"Processing: {title} (ID: {product_id})")
        
        # Create a folder for images
        if not os.path.exists(f'images/{handle}'):
            os.makedirs(f'images/{handle}')
            
        # Download all images for this product
        for i, img in enumerate(product['images']):
            img_url = img['src']
            img_data = requests.get(img_url).content
            with open(f'images/{handle}/image_{i}.jpg', 'wb') as f:
                f.write(img_data)
                
    # Save the full metadata to a file for your database import
    with open('ride_engine_data.json', 'w') as f:
        json.dump(products, f, indent=4)

download_ride_engine_data()
3. Recommended Workflow for Distributors
Since you are official distributors, I recommend a more professional approach than pure scraping:

Request the CSV/API Export: Contact the EU headquarters (7-Nation Europe GmbH in Kiel, Germany). As official distributors, they can provide the Official CSV Product Feed. This will include dealer-specific info like EAN codes and weights which aren't always visible on the retail site.

Image Assets: The retail site often uses compressed WebP/JPG images. The "Dealer Portal" usually has high-resolution TIFF or PNG files for print and high-end web displays.

Stock Sync: Since you are building a new shop, you may want to ask for an inventory API so your Bulgarian shop doesn't show "In Stock" for items that are sold out at the central warehouse.

4. Database Mapping
When importing to your database, ensure you map these specific fields:

Handle: Use this for your URL (e.g., yoursite.bg/products/hyperlock-harness).

Body_HTML: This contains the rich text descriptions and tech specs.

Variants: Ride Engine products often have sizes (S, M, L, XL). Make sure your database supports "Product Variations."

Tags: These are used for filtering (e.g., "Kitesurf", "Wingfoil", "Carbon").