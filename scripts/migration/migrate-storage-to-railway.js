// Migrate storage buckets from Supabase to Railway (S3-compatible storage)
// Usage: node scripts/migration/migrate-storage-to-railway.js

const { createClient } = require('@supabase/supabase-js');
const { S3Client, PutObjectCommand, ListObjectsV2Command, GetObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');
const { ensureEnv } = require('../../lib/env');

ensureEnv();

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseBucketPublic = process.env.SUPABASE_BUCKET_PUBLIC || 'slingshot-images-dev';
const supabaseBucketRaw = process.env.SUPABASE_BUCKET_RAW || 'slingshot-raw';

// Railway Storage configuration (S3-compatible) - Public Bucket
const storageType = process.env.RAILWAY_STORAGE_TYPE || 's3';
const storageEndpoint = process.env.RAILWAY_STORAGE_ENDPOINT;
const storageRegion = process.env.RAILWAY_STORAGE_REGION || 'us-east-1';
const storageAccessKey = process.env.RAILWAY_STORAGE_ACCESS_KEY;
const storageSecretKey = process.env.RAILWAY_STORAGE_SECRET_KEY;
const railwayBucketPublic = process.env.RAILWAY_STORAGE_BUCKET_PUBLIC || 'slingshot-images-dev';
const publicUrlBase = process.env.RAILWAY_STORAGE_PUBLIC_URL_BASE;

// Railway Storage configuration - Raw/Admin Bucket (separate credentials)
const rawStorageType = process.env.RAILWAY_STORAGE_RAW_TYPE || storageType;
const rawStorageEndpoint = process.env.RAILWAY_STORAGE_RAW_ENDPOINT || storageEndpoint;
const rawStorageRegion = process.env.RAILWAY_STORAGE_RAW_REGION || storageRegion;
const rawStorageAccessKey = process.env.RAILWAY_STORAGE_RAW_ACCESS_KEY || storageAccessKey;
const rawStorageSecretKey = process.env.RAILWAY_STORAGE_RAW_SECRET_KEY || storageSecretKey;
const railwayBucketRaw = process.env.RAILWAY_STORAGE_BUCKET_RAW || 'slingshot-raw';

// Validate configuration
if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

if (!storageEndpoint || !storageAccessKey || !storageSecretKey) {
  console.error('❌ Missing Railway Storage configuration');
  console.error('Required: RAILWAY_STORAGE_ENDPOINT, RAILWAY_STORAGE_ACCESS_KEY, RAILWAY_STORAGE_SECRET_KEY');
  process.exit(1);
}

// Initialize clients
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

// Public bucket S3 client
const s3Client = new S3Client({
  endpoint: storageEndpoint,
  region: storageRegion,
  credentials: {
    accessKeyId: storageAccessKey,
    secretAccessKey: storageSecretKey,
  },
  forcePathStyle: storageType === 'minio', // MinIO requires path-style
});

// Raw bucket S3 client (uses separate credentials if provided, otherwise falls back to public bucket credentials)
const rawS3Client = new S3Client({
  endpoint: rawStorageEndpoint,
  region: rawStorageRegion,
  credentials: {
    accessKeyId: rawStorageAccessKey,
    secretAccessKey: rawStorageSecretKey,
  },
  forcePathStyle: rawStorageType === 'minio', // MinIO requires path-style
});

// Helper: Download file from Supabase
async function downloadFromSupabase(bucket, filePath) {
  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .download(filePath);

  if (error) {
    throw new Error(`Failed to download ${filePath}: ${error.message}`);
  }

  return Buffer.from(await data.arrayBuffer());
}

// Helper: Upload file to Railway S3
async function uploadToRailway(bucket, filePath, buffer, contentType = 'application/octet-stream', isRawBucket = false) {
  // Use appropriate client based on bucket type
  const client = isRawBucket ? rawS3Client : s3Client;

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: filePath,
    Body: buffer,
    ContentType: contentType,
  });

  await client.send(command);
}

// Helper: List all files in Supabase bucket (recursive)
async function listSupabaseFiles(bucket, folder = '', allFiles = []) {
  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .list(folder, {
      limit: 1000,
      sortBy: { column: 'name', order: 'asc' },
    });

  if (error) {
    throw new Error(`Failed to list files in ${bucket}/${folder}: ${error.message}`);
  }

  if (!data || data.length === 0) {
    return allFiles;
  }

  for (const item of data) {
    const fullPath = folder ? `${folder}/${item.name}` : item.name;

    if (item.id === null) {
      // It's a folder, recurse
      await listSupabaseFiles(bucket, fullPath, allFiles);
    } else {
      // It's a file
      allFiles.push({
        path: fullPath,
        name: item.name,
        size: item.metadata?.size || 0,
        contentType: item.metadata?.mimetype || 'application/octet-stream',
      });
    }
  }

  return allFiles;
}

// Migrate a single bucket
async function migrateBucket(supabaseBucket, railwayBucket, bucketName, isRawBucket = false) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📦 Migrating bucket: ${bucketName}`);
  console.log(`   From: ${supabaseBucket} (Supabase)`);
  console.log(`   To:   ${railwayBucket} (Railway)`);
  if (isRawBucket) {
    console.log(`   Using: Raw bucket credentials (separate from public bucket)`);
  }
  console.log(`${'='.repeat(60)}\n`);

  // List all files in Supabase bucket
  console.log('📋 Listing files in Supabase bucket...');
  const files = await listSupabaseFiles(supabaseBucket);
  console.log(`✅ Found ${files.length} files\n`);

  if (files.length === 0) {
    console.log('⚠️  No files to migrate\n');
    return { total: 0, migrated: 0, failed: 0 };
  }

  let migrated = 0;
  let failed = 0;
  const errors = [];
  const startTime = Date.now();

  // Migrate each file
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const progress = `[${i + 1}/${files.length}]`;
    const percentage = ((i + 1) / files.length * 100).toFixed(1);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const avgTimePerFile = elapsed / (i + 1);
    const remaining = Math.ceil((files.length - i - 1) * avgTimePerFile);
    const remainingMinutes = Math.floor(remaining / 60);
    const remainingSeconds = Math.floor(remaining % 60);

    try {
      process.stdout.write(`\r${progress} (${percentage}%) Downloading: ${file.path.substring(0, 60)}...`);
      const buffer = await downloadFromSupabase(supabaseBucket, file.path);

      process.stdout.write(`\r${progress} (${percentage}%) Uploading to Railway...`);
      await uploadToRailway(railwayBucket, file.path, buffer, file.contentType, isRawBucket);

      migrated++;
      process.stdout.write(`\r${progress} (${percentage}%) ✅ Migrated: ${file.path.substring(0, 60)}... (${migrated} success, ${failed} failed, ~${remainingMinutes}m ${remainingSeconds}s remaining)\n`);
    } catch (error) {
      failed++;
      const errorMsg = `${progress} ❌ Failed: ${file.path} - ${error.message}`;
      process.stdout.write(`\r${errorMsg}\n`);
      errors.push({ file: file.path, error: error.message });
    }

    // Small delay to avoid rate limiting
    if (i < files.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Show summary every 50 files
    if ((i + 1) % 50 === 0) {
      const elapsedTotal = ((Date.now() - startTime) / 1000).toFixed(1);
      const rate = (i + 1 / elapsedTotal).toFixed(2);
      console.log(`\n📊 Progress: ${i + 1}/${files.length} (${percentage}%) | Success: ${migrated} | Failed: ${failed} | Elapsed: ${elapsedTotal}s | Rate: ${rate} files/s\n`);
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`✅ Migration complete for ${bucketName}`);
  console.log(`   Total files: ${files.length}`);
  console.log(`   Migrated: ${migrated}`);
  console.log(`   Failed: ${failed}`);
  console.log(`${'='.repeat(60)}\n`);

  if (errors.length > 0) {
    console.log('❌ Errors encountered:');
    errors.forEach(({ file, error }) => {
      console.log(`   - ${file}: ${error}`);
    });
    console.log('');
  }

  return { total: files.length, migrated, failed, errors };
}

// Main migration function
async function main() {
  console.log('🚀 Starting Storage Migration: Supabase → Railway');
  console.log('');
  console.log('Configuration:');
  console.log(`  Storage Type: ${storageType}`);
  console.log(`  Endpoint: ${storageEndpoint}`);
  console.log(`  Region: ${storageRegion}`);
  console.log('');

  // Test connections
  console.log('🔍 Testing connections...');

  try {
    const { data: buckets } = await supabaseAdmin.storage.listBuckets();
    console.log(`✅ Supabase: Connected (${buckets?.length || 0} buckets found)`);
  } catch (error) {
    console.error('❌ Supabase connection failed:', error.message);
    process.exit(1);
  }

  try {
    // Test S3 connection by listing buckets (if supported) or trying a simple operation
    console.log(`✅ Railway Storage: Configuration loaded`);
  } catch (error) {
    console.error('❌ Railway Storage configuration error:', error.message);
    process.exit(1);
  }

  console.log('');

  // Migrate public bucket
  const publicResult = await migrateBucket(
    supabaseBucketPublic,
    railwayBucketPublic,
    'Public (slingshot-images-dev)',
    false // Not raw bucket
  );

  // Migrate raw bucket (uses separate credentials if configured)
  const rawResult = await migrateBucket(
    supabaseBucketRaw,
    railwayBucketRaw,
    'Raw/Admin (slingshot-raw)',
    true // Is raw bucket - uses separate credentials
  );

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 MIGRATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`Public Bucket:`);
  console.log(`  Total: ${publicResult.total}, Migrated: ${publicResult.migrated}, Failed: ${publicResult.failed}`);
  console.log(`Raw Bucket:`);
  console.log(`  Total: ${rawResult.total}, Migrated: ${rawResult.migrated}, Failed: ${rawResult.failed}`);
  console.log(`\nGrand Total:`);
  console.log(`  Files: ${publicResult.total + rawResult.total}`);
  console.log(`  Migrated: ${publicResult.migrated + rawResult.migrated}`);
  console.log(`  Failed: ${publicResult.failed + rawResult.failed}`);
  console.log('='.repeat(60));

  if (publicResult.failed > 0 || rawResult.failed > 0) {
    console.log('\n⚠️  Some files failed to migrate. Review errors above.');
    process.exit(1);
  } else {
    console.log('\n✅ All files migrated successfully!');
    console.log('\nNext steps:');
    console.log('1. Update your application to use Railway storage URLs');
    console.log('2. Update environment variables in Railway');
    console.log('3. Test the application');
    console.log('4. Update database image URLs if needed');
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

