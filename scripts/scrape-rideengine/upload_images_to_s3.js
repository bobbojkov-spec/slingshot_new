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

// Full upload
async function uploadAllImages() {
    console.log('='.repeat(60));
    console.log('  RIDE ENGINE IMAGE UPLOADER - FULL UPLOAD');
    console.log('  Uploading ALL images with 4 versions each');
    console.log('='.repeat(60));

    const client = getS3Client();
    const bucket = getBucketName();

    console.log(`\n📦 S3 Configuration:`);
    console.log(`   Bucket: ${bucket}`);
    console.log(`   Endpoint: ${process.env.RAILWAY_STORAGE_ENDPOINT || 'https://storage.railway.app'}`);
    console.log(`   Base path: ${S3_BASE_PATH}/`);

    // Find all product directories
    const productDirs = await fs.readdir(IMAGES_DIR);
    console.log(`\n📁 Found ${productDirs.length} product folders`);

    let productIndex = 0;
    let totalImagesUploaded = 0;
    let totalVersionsCreated = 0;
    const results = [];

    for (const productHandle of productDirs) {
        const productPath = path.join(IMAGES_DIR, productHandle);
        const stat = await fs.stat(productPath);
        if (!stat.isDirectory()) continue;

        const files = await fs.readdir(productPath);
        const imageFiles = files.filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f));

        if (imageFiles.length === 0) continue;

        productIndex++;
        console.log(`\n[${productIndex}/${productDirs.length}] ${productHandle} (${imageFiles.length} images)`);

        // Upload ALL images from this product
        for (const filename of imageFiles) {
            const localPath = path.join(productPath, filename);
            const s3Path = `${S3_BASE_PATH}/${productHandle}/${filename}`;

            try {
                const uploadResult = await uploadFile(client, bucket, localPath, s3Path, productHandle, filename);
                totalImagesUploaded++;
                totalVersionsCreated += Object.keys(uploadResult.versions).length;

                results.push({
                    productHandle,
                    filename,
                    original: uploadResult.versions.original.path,
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

                process.stdout.write('.');
            } catch (error) {
                console.error(`\n   ❌ Failed: ${filename} - ${error.message}`);
            }
        }
    }


    // Save results
    const resultsFile = path.join(__dirname, 'rideengine_data/image_url_mapping.json');
    await fs.writeFile(resultsFile, JSON.stringify(results, null, 2));

    console.log('\n' + '='.repeat(60));
    console.log('✅ UPLOAD COMPLETE!');
    console.log('='.repeat(60));
    console.log(`\n📊 Summary:`);
    console.log(`   Images uploaded: ${totalImagesUploaded}`);
    console.log(`   Total versions created: ${totalVersionsCreated}`);
    console.log(`   Products processed: ${productIndex}`);
    console.log(`\n📄 Results saved: ${resultsFile}`);

    console.log(`\n💡 Next step: Generate SQL for database import`);
    console.log(`   Run: python3 009_generate_db_import_with_relative_paths.py`);

    return results;
}

// Run if executed directly
if (require.main === module) {
    uploadAllImages()
        .then(() => {
            console.log('\n🎉 All images uploaded successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Upload failed:', error.message);
            console.error(error);
            process.exit(1);
        });
}

module.exports = { uploadAllImages };
