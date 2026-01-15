#!/usr/bin/env node
/**
 * TEST: Upload just 2 Ride Engine images to Railway S3
 * Based on existing scripts/migrate-first-two-images.js pattern
 * Following IMAGE_HANDLING_GUIDE.md - stores RELATIVE paths only
 */

const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env.local') });

// Configuration
const IMAGES_DIR = path.join(__dirname, 'rideengine_data/images');
const S3_BASE_PATH = 'ride-engine'; // Base path in S3
const TEST_LIMIT = 2; // Only upload 2 images for testing

// S3 Client Setup (matching your existing .env.local)
function getS3Client() {
    const endpoint = process.env.RAILWAY_STORAGE_ENDPOINT || process.env.S3_ENDPOINT || 'https://storage.railway.app';
    const region = process.env.RAILWAY_STORAGE_REGION || process.env.S3_REGION || 'auto';
    const accessKeyId = process.env.RAILWAY_STORAGE_ACCESS_KEY_ID || process.env.S3_ACCESS_KEY_ID_PUBLIC;
    const secretAccessKey = process.env.RAILWAY_STORAGE_SECRET_ACCESS_KEY || process.env.S3_SECRET_ACCESS_KEY_PUBLIC;

    if (!accessKeyId || !secretAccessKey) {
        throw new Error(
            'S3 credentials not found.\n' +
            'Please set RAILWAY_STORAGE_ACCESS_KEY_ID and RAILWAY_STORAGE_SECRET_ACCESS_KEY in .env.local'
        );
    }

    console.log('✅ S3 credentials loaded');
    return new S3Client({
        endpoint,
        region,
        credentials: { accessKeyId, secretAccessKey },
        forcePathStyle: true,
    });
}

function getBucketName() {
    const bucket = process.env.RAILWAY_STORAGE_BUCKET_PUBLIC || process.env.S3_BUCKET_PUBLIC;
    if (!bucket) {
        throw new Error('RAILWAY_STORAGE_BUCKET_PUBLIC not set in .env.local');
    }
    return bucket;
}

// Upload single file with ALL versions (original, large, medium, thumb)
async function uploadFile(client, bucket, localPath, s3Path, productHandle, filename) {
    const sharp = require('sharp');
    const fileBuffer = await fs.readFile(localPath);

    // Get original metadata
    const metadata = await sharp(fileBuffer).metadata();
    const originalWidth = metadata.width || 0;
    const originalHeight = metadata.height || 0;

    const ext = path.extname(localPath).toLowerCase();
    const contentTypes = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.webp': 'image/webp',
    };
    const contentType = contentTypes[ext] || 'image/jpeg';

    const results = {
        productHandle,
        filename,
        versions: {}
    };

    // Following processor-railway.ts pattern
    const IMAGE_SIZES = {
        large: { width: 1920, height: 1920 },
        medium: { shortSide: 500 },
        thumb: { width: 300, height: 300 }
    };

    // 1. Upload ORIGINAL
    const originalS3Path = `ride-engine/${productHandle}/original/${filename}`;
    await client.send(new PutObjectCommand({
        Bucket: bucket,
        Key: originalS3Path,
        Body: fileBuffer,
        ContentType: contentType,
        CacheControl: 'public, max-age=31536000, immutable',
    }));
    results.versions.original = {
        path: originalS3Path,
        width: originalWidth,
        height: originalHeight,
        size: fileBuffer.length
    };

    // 2. Upload LARGE (1920px max)
    if (originalWidth > IMAGE_SIZES.large.width || originalHeight > IMAGE_SIZES.large.height) {
        const largeBuffer = await sharp(fileBuffer)
            .resize(IMAGE_SIZES.large.width, IMAGE_SIZES.large.height, {
                fit: 'inside',
                withoutEnlargement: true,
            })
            .toBuffer();

        const largeFilename = filename.replace(/\.(jpg|jpeg|png|webp)$/i, '_large$&');
        const largeS3Path = `ride-engine/${productHandle}/large/${largeFilename}`;

        await client.send(new PutObjectCommand({
            Bucket: bucket,
            Key: largeS3Path,
            Body: largeBuffer,
            ContentType: contentType,
            CacheControl: 'public, max-age=31536000, immutable',
        }));

        results.versions.large = {
            path: largeS3Path,
            size: largeBuffer.length
        };
    }

    // 3. Upload MEDIUM (500px short side)
    if (originalWidth > IMAGE_SIZES.medium.shortSide || originalHeight > IMAGE_SIZES.medium.shortSide) {
        const mediumBuffer = await sharp(fileBuffer)
            .resize(IMAGE_SIZES.medium.shortSide, IMAGE_SIZES.medium.shortSide, {
                fit: 'inside',
                withoutEnlargement: true,
            })
            .toBuffer();

        const mediumFilename = filename.replace(/\.(jpg|jpeg|png|webp)$/i, '_medium$&');
        const mediumS3Path = `ride-engine/${productHandle}/medium/${mediumFilename}`;

        await client.send(new PutObjectCommand({
            Bucket: bucket,
            Key: mediumS3Path,
            Body: mediumBuffer,
            ContentType: contentType,
            CacheControl: 'public, max-age=31536000, immutable',
        }));

        results.versions.medium = {
            path: mediumS3Path,
            size: mediumBuffer.length
        };
    }

    // 4. Upload THUMB (300x300 cover)
    if (originalWidth > IMAGE_SIZES.thumb.width || originalHeight > IMAGE_SIZES.thumb.height) {
        const thumbBuffer = await sharp(fileBuffer)
            .resize(IMAGE_SIZES.thumb.width, IMAGE_SIZES.thumb.height, {
                fit: 'cover',
                position: 'center',
            })
            .toBuffer();

        const thumbFilename = filename.replace(/\.(jpg|jpeg|png|webp)$/i, '_thumb$&');
        const thumbS3Path = `ride-engine/${productHandle}/thumb/${thumbFilename}`;

        await client.send(new PutObjectCommand({
            Bucket: bucket,
            Key: thumbS3Path,
            Body: thumbBuffer,
            ContentType: contentType,
            CacheControl: 'public, max-age=31536000, immutable',
        }));

        results.versions.thumb = {
            path: thumbS3Path,
            size: thumbBuffer.length
        };
    }

    return results;
}

// Test upload
async function testUpload() {
    console.log('='.repeat(60));
    console.log('  RIDE ENGINE IMAGE UPLOAD TEST');
    console.log('  Testing with first 2 images only');
    console.log('='.repeat(60));

    const client = getS3Client();
    const bucket = getBucketName();

    console.log(`\n📦 S3 Configuration:`);
    console.log(`   Bucket: ${bucket}`);
    console.log(`   Endpoint: ${process.env.S3_ENDPOINT || 'https://storage.railway.app'}`);
    console.log(`   Base path: ${S3_BASE_PATH}/`);

    // Find first product with images
    const productDirs = await fs.readdir(IMAGES_DIR);
    let uploadedCount = 0;
    const results = [];

    for (const productHandle of productDirs) {
        if (uploadedCount >= TEST_LIMIT) break;

        const productPath = path.join(IMAGES_DIR, productHandle);
        const stat = await fs.stat(productPath);
        if (!stat.isDirectory()) continue;

        const files = await fs.readdir(productPath);
        const imageFiles = files.filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f));

        if (imageFiles.length === 0) continue;

        console.log(`\n📁 Testing with: ${productHandle}`);

        // Upload first image from this product
        const filename = imageFiles[0];
        const localPath = path.join(productPath, filename);
        const s3Path = `${S3_BASE_PATH}/${productHandle}/${filename}`;

        try {
            console.log(`   Uploading: ${filename} (creating 4 versions)`);
            console.log(`   Local: ${localPath}`);

            const uploadResult = await uploadFile(client, bucket, localPath, s3Path, productHandle, filename);
            uploadedCount++;

            results.push({
                productHandle,
                filename,
                original: uploadResult.versions.original.path,  // Store ORIGINAL path in database
                large: uploadResult.versions.large?.path,
                medium: uploadResult.versions.medium?.path,
                thumb: uploadResult.versions.thumb?.path,
                localPath: path.relative(process.cwd(), localPath),
                originalSize: uploadResult.versions.original.size,
                dimensions: {
                    width: uploadResult.versions.original.width,
                    height: uploadResult.versions.original.height
                }
            });

            console.log(`   ✅ Success!`);
            console.log(`      Original: ${uploadResult.versions.original.path}`);
            console.log(`      Large: ${uploadResult.versions.large?.path || 'N/A'}`);
            console.log(`      Medium: ${uploadResult.versions.medium?.path || 'N/A'}`);
            console.log(`      Thumb: ${uploadResult.versions.thumb?.path || 'N/A'}`);
        } catch (error) {
            console.error(`   ❌ Failed: ${error.message}`);
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ TEST COMPLETE');
    console.log('='.repeat(60));
    console.log(`\n📊 Results:`);
    console.log(`   Uploaded: ${uploadedCount} images`);
    console.log(`\n📝 Details:`);
    results.forEach((r, i) => {
        console.log(`\n   ${i + 1}. ${r.filename}`);
        console.log(`      Product: ${r.productHandle}`);
        console.log(`      Size: ${(r.originalSize / 1024).toFixed(1)} KB`);
        console.log(`      Dimensions: ${r.dimensions.width}x${r.dimensions.height}px`);
        console.log(`      DB paths (store in ProductImage table):`);
        console.log(`        → Original: ${r.original}`);
        if (r.large) console.log(`        → Large: ${r.large}`);
        if (r.medium) console.log(`        → Medium: ${r.medium}`);
        if (r.thumb) console.log(`        → Thumb: ${r.thumb}`);
    });

    console.log(`\n\n💡 Next steps:`);
    console.log(`   1. Verify these images are accessible (check Railway dashboard)`);
    console.log(`   2. Test getPresignedUrl() with one of these paths`);
    console.log(`   3. If successful, run full upload: node upload_images_to_s3.js`);

    // Save test results
    const testResultsFile = path.join(__dirname, 'rideengine_data/test-upload-results.json');
    await fs.writeFile(testResultsFile, JSON.stringify(results, null, 2));
    console.log(`\n   📄 Results saved: ${testResultsFile}`);

    return results;
}

// Run test
if (require.main === module) {
    testUpload()
        .then(() => {
            console.log('\n🎉 Test completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Test failed:', error.message);
            console.error('\nFull error:', error);
            process.exit(1);
        });
}

module.exports = { testUpload };
