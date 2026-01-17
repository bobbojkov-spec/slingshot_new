#!/usr/bin/env node

/**
 * Rideendige Hero Media Scraper
 * 
 * Scrapes all hero images and videos from rideendige.com
 * and organizes them into folders by page source.
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

// Configuration
const BASE_URL = 'https://rideengine.com';
const OUTPUT_DIR = path.join(__dirname, 'rideengine-media');
const VISITED_URLS = new Set();
const MEDIA_MAP = {};

// Helper: Fetch HTML content
async function fetchHTML(url) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;

        protocol.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
            }
        }, (res) => {
            if (res.statusCode === 301 || res.statusCode === 302) {
                return fetchHTML(res.headers.location).then(resolve).catch(reject);
            }

            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}

// Helper: Download file
async function downloadFile(url, filepath) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;

        const file = fs.createWriteStream(filepath);
        protocol.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
            }
        }, (res) => {
            if (res.statusCode === 301 || res.statusCode === 302) {
                fs.unlinkSync(filepath);
                return downloadFile(res.headers.location, filepath).then(resolve).catch(reject);
            }

            res.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', (err) => {
            fs.unlinkSync(filepath);
            reject(err);
        });
    });
}

// Helper: Extract hero media from HTML
function extractHeroMedia(html, pageUrl) {
    const media = {
        images: [],
        videos: []
    };

    // Common hero section patterns
    const heroPatterns = [
        // Hero sections with images
        /<section[^>]*class="[^"]*hero[^"]*"[^>]*>[\s\S]*?<\/section>/gi,
        /<div[^>]*class="[^"]*hero[^"]*"[^>]*>[\s\S]*?<\/div>/gi,
        /<header[^>]*class="[^"]*hero[^"]*"[^>]*>[\s\S]*?<\/header>/gi,
        // Banner sections
        /<section[^>]*class="[^"]*banner[^"]*"[^>]*>[\s\S]*?<\/section>/gi,
        /<div[^>]*class="[^"]*banner[^"]*"[^>]*>[\s\S]*?<\/div>/gi,
    ];

    let heroSections = [];
    heroPatterns.forEach(pattern => {
        const matches = html.match(pattern);
        if (matches) heroSections.push(...matches);
    });

    // If no hero sections found, check first section/div
    if (heroSections.length === 0) {
        const firstSection = html.match(/<section[^>]*>[\s\S]*?<\/section>/i);
        if (firstSection) heroSections.push(firstSection[0]);
    }

    // Extract images from hero sections
    heroSections.forEach(section => {
        // Image tags
        const imgMatches = section.matchAll(/<img[^>]*src=["']([^"']+)["'][^>]*>/gi);
        for (const match of imgMatches) {
            let imgUrl = match[1];
            if (imgUrl && !imgUrl.includes('data:image')) {
                imgUrl = new URL(imgUrl, pageUrl).href;
                media.images.push(imgUrl);
            }
        }

        // Background images in style attributes
        const bgMatches = section.matchAll(/background-image:\s*url\(["']?([^"')]+)["']?\)/gi);
        for (const match of bgMatches) {
            let imgUrl = match[1];
            if (imgUrl && !imgUrl.includes('data:image')) {
                imgUrl = new URL(imgUrl, pageUrl).href;
                media.images.push(imgUrl);
            }
        }

        // Video tags
        const videoMatches = section.matchAll(/<video[^>]*>[\s\S]*?<\/video>/gi);
        for (const videoMatch of videoMatches) {
            const sourceMatches = videoMatch[0].matchAll(/<source[^>]*src=["']([^"']+)["'][^>]*>/gi);
            for (const source of sourceMatches) {
                let videoUrl = source[1];
                videoUrl = new URL(videoUrl, pageUrl).href;
                media.videos.push(videoUrl);
            }

            // Video src attribute
            const videoSrc = videoMatch[0].match(/src=["']([^"']+)["']/i);
            if (videoSrc) {
                let videoUrl = videoSrc[1];
                videoUrl = new URL(videoUrl, pageUrl).href;
                media.videos.push(videoUrl);
            }
        }
    });

    // Remove duplicates
    media.images = [...new Set(media.images)];
    media.videos = [...new Set(media.videos)];

    return media;
}

// Helper: Extract internal links
function extractLinks(html, baseUrl) {
    const links = new Set();
    const linkPattern = /<a[^>]*href=["']([^"']+)["'][^>]*>/gi;

    let match;
    while ((match = linkPattern.exec(html)) !== null) {
        try {
            const url = new URL(match[1], baseUrl);
            if (url.hostname === new URL(baseUrl).hostname) {
                // Remove hash and query params for cleaner URLs
                url.hash = '';
                links.add(url.href);
            }
        } catch (e) {
            // Invalid URL, skip
        }
    }

    return Array.from(links);
}

// Helper: Get page name from URL
function getPageName(url) {
    const urlObj = new URL(url);
    let pathname = urlObj.pathname;

    // Remove trailing slash
    pathname = pathname.replace(/\/$/, '');

    // Get last segment or use 'home' for root
    const segments = pathname.split('/').filter(s => s);
    return segments.length > 0 ? segments[segments.length - 1] : 'home';
}

// Main scraping function
async function scrapePage(url, depth = 0, maxDepth = 2) {
    if (VISITED_URLS.has(url) || depth > maxDepth) {
        return;
    }

    VISITED_URLS.add(url);
    console.log(`\n[${'='.repeat(depth)}] Scraping: ${url}`);

    try {
        const html = await fetchHTML(url);
        const media = extractHeroMedia(html, url);
        const pageName = getPageName(url);

        if (media.images.length > 0 || media.videos.length > 0) {
            MEDIA_MAP[pageName] = {
                url,
                images: media.images,
                videos: media.videos
            };

            console.log(`   Found ${media.images.length} images, ${media.videos.length} videos`);
        }

        // Extract and follow internal links
        if (depth < maxDepth) {
            const links = extractLinks(html, url);
            for (const link of links) {
                await scrapePage(link, depth + 1, maxDepth);
            }
        }
    } catch (error) {
        console.error(`   Error scraping ${url}:`, error.message);
    }
}

// Download all media
async function downloadMedia() {
    console.log('\n\n=== DOWNLOADING MEDIA ===\n');

    // Create output directory
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    for (const [pageName, data] of Object.entries(MEDIA_MAP)) {
        const pageDir = path.join(OUTPUT_DIR, pageName);
        if (!fs.existsSync(pageDir)) {
            fs.mkdirSync(pageDir, { recursive: true });
        }

        console.log(`\n[${pageName}] from ${data.url}`);

        // Download images
        for (let i = 0; i < data.images.length; i++) {
            const imgUrl = data.images[i];
            const ext = path.extname(new URL(imgUrl).pathname) || '.jpg';
            const filename = `hero-image-${i + 1}${ext}`;
            const filepath = path.join(pageDir, filename);

            try {
                console.log(`   Downloading: ${filename}`);
                await downloadFile(imgUrl, filepath);
            } catch (error) {
                console.error(`   Failed to download ${imgUrl}:`, error.message);
            }
        }

        // Download videos
        for (let i = 0; i < data.videos.length; i++) {
            const videoUrl = data.videos[i];
            const ext = path.extname(new URL(videoUrl).pathname) || '.mp4';
            const filename = `hero-video-${i + 1}${ext}`;
            const filepath = path.join(pageDir, filename);

            try {
                console.log(`   Downloading: ${filename}`);
                await downloadFile(videoUrl, filepath);
            } catch (error) {
                console.error(`   Failed to download ${videoUrl}:`, error.message);
            }
        }
    }
}

// Save mapping file
function saveMapping() {
    const mappingPath = path.join(OUTPUT_DIR, 'page-mapping.json');
    fs.writeFileSync(mappingPath, JSON.stringify(MEDIA_MAP, null, 2));
    console.log(`\n\nMapping saved to: ${mappingPath}`);
}

// Main execution
async function main() {
    console.log('=== RIDEENDIGE HERO MEDIA SCRAPER ===');
    console.log(`Base URL: ${BASE_URL}`);
    console.log(`Output Directory: ${OUTPUT_DIR}\n`);

    await scrapePage(BASE_URL);
    await downloadMedia();
    saveMapping();

    console.log('\n\n=== SUMMARY ===');
    console.log(`Total pages scraped: ${VISITED_URLS.size}`);
    console.log(`Pages with hero media: ${Object.keys(MEDIA_MAP).length}`);
    console.log(`\nMedia organized in: ${OUTPUT_DIR}`);
}

main().catch(console.error);
