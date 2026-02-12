# Scraping & Migration Scripts

These scripts use Puppeteer for web scraping and are separated from the main application to avoid bloating the build with Chrome/Chromium downloads.

## Setup

```bash
cd scripts
npm install
```

This installs Puppeteer and its dependencies in the scripts folder only.

## Available Scripts

### Scraping Scripts

```bash
# Scrape Ride Engine products
npm run scrape:rideengine

# Scrape SKU and subtitle data
npm run scrape:sku

# Scrape product specifications
npm run scrape:specs

# Scrape hero video URLs
npm run scrape:heroes

# Crawl product metadata
npm run scrape:metadata

# Fix video URLs
npm run fix:videos

# Find real video sources
npm run find:videos
```

### Direct Execution with tsx

```bash
npx tsx scrape_rideengine_v2.ts
npx tsx crawl_metadata.ts
```

## Why Separate Package?

Puppeteer downloads a ~100MB Chrome binary during installation, which:
- Slows down deployment builds by 20+ minutes
- Is not needed for the main Next.js application
- Is only used for one-time scraping/migration tasks

The main app's `package.json` does not include Puppeteer, keeping builds fast.
