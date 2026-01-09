// Test Railway Storage connections for both public and raw buckets
// Usage: node scripts/migration/test-railway-storage.js

const { S3Client, ListBucketsCommand, ListObjectsV2Command, PutObjectCommand, GetObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const { ensureEnv } = require('../../lib/env');

ensureEnv();

// Public bucket configuration
const storageType = process.env.RAILWAY_STORAGE_TYPE || 's3';
const storageEndpoint = process.env.RAILWAY_STORAGE_ENDPOINT;
const storageRegion = process.env.RAILWAY_STORAGE_REGION || 'us-east-1';
const storageAccessKey = process.env.RAILWAY_STORAGE_ACCESS_KEY;
const storageSecretKey = process.env.RAILWAY_STORAGE_SECRET_KEY;
const railwayBucketPublic = process.env.RAILWAY_STORAGE_BUCKET_PUBLIC;

// Raw bucket configuration
const rawStorageType = process.env.RAILWAY_STORAGE_RAW_TYPE || storageType;
const rawStorageEndpoint = process.env.RAILWAY_STORAGE_RAW_ENDPOINT || storageEndpoint;
const rawStorageRegion = process.env.RAILWAY_STORAGE_RAW_REGION || storageRegion;
const rawStorageAccessKey = process.env.RAILWAY_STORAGE_RAW_ACCESS_KEY;
const rawStorageSecretKey = process.env.RAILWAY_STORAGE_RAW_SECRET_KEY;
const railwayBucketRaw = process.env.RAILWAY_STORAGE_BUCKET_RAW;

console.log('🧪 Testing Railway Storage Connections\n');
console.log('='.repeat(60));

// Validate configuration
const errors = [];

if (!storageEndpoint || !storageAccessKey || !storageSecretKey) {
  errors.push('Missing public bucket configuration (RAILWAY_STORAGE_*)');
}

if (!rawStorageEndpoint || !rawStorageAccessKey || !rawStorageSecretKey) {
  errors.push('Missing raw bucket configuration (RAILWAY_STORAGE_RAW_*)');
}

if (!railwayBucketPublic) {
  errors.push('Missing RAILWAY_STORAGE_BUCKET_PUBLIC');
}

if (!railwayBucketRaw) {
  errors.push('Missing RAILWAY_STORAGE_BUCKET_RAW');
}

if (errors.length > 0) {
  console.error('❌ Configuration errors:');
  errors.forEach(err => console.error(`   - ${err}`));
  process.exit(1);
}

// Initialize clients
const publicClient = new S3Client({
  endpoint: storageEndpoint,
  region: storageRegion,
  credentials: {
    accessKeyId: storageAccessKey,
    secretAccessKey: storageSecretKey,
  },
  forcePathStyle: storageType === 'minio',
});

const rawClient = new S3Client({
  endpoint: rawStorageEndpoint,
  region: rawStorageRegion,
  credentials: {
    accessKeyId: rawStorageAccessKey,
    secretAccessKey: rawStorageSecretKey,
  },
  forcePathStyle: rawStorageType === 'minio',
});

// Test function
async function testBucket(client, bucketName, bucketType) {
  console.log(`\n📦 Testing ${bucketType} Bucket: ${bucketName}`);
  console.log('-'.repeat(60));

  try {
    // Test 1: List objects (this verifies read access)
    console.log('  1. Testing read access (list objects)...');
    const listCommand = new ListObjectsV2Command({
      Bucket: bucketName,
      MaxKeys: 5,
    });

    const listResponse = await client.send(listCommand);
    const fileCount = listResponse.KeyCount || 0;
    console.log(`     ✅ Read access OK (found ${fileCount} files)`);

    if (fileCount > 0 && listResponse.Contents) {
      console.log(`     Sample files:`);
      listResponse.Contents.slice(0, 3).forEach((item, idx) => {
        const sizeKB = ((item.Size || 0) / 1024).toFixed(2);
        console.log(`       ${idx + 1}. ${item.Key} (${sizeKB} KB)`);
      });
    }

    // Test 2: Write access (upload a test file)
    console.log('  2. Testing write access (upload test file)...');
    const testFileName = `test-connection-${Date.now()}.txt`;
    const testContent = Buffer.from(`Test file created at ${new Date().toISOString()}`);

    const putCommand = new PutObjectCommand({
      Bucket: bucketName,
      Key: testFileName,
      Body: testContent,
      ContentType: 'text/plain',
    });

    await client.send(putCommand);
    console.log(`     ✅ Write access OK (uploaded: ${testFileName})`);

    // Test 3: Verify the file exists
    console.log('  3. Testing file existence check...');
    const headCommand = new HeadObjectCommand({
      Bucket: bucketName,
      Key: testFileName,
    });

    const headResponse = await client.send(headCommand);
    console.log(`     ✅ File exists (size: ${headResponse.ContentLength} bytes)`);

    // Test 4: Read the file back
    console.log('  4. Testing file download...');
    const getCommand = new GetObjectCommand({
      Bucket: bucketName,
      Key: testFileName,
    });

    const getResponse = await client.send(getCommand);
    const chunks = [];
    for await (const chunk of getResponse.Body) {
      chunks.push(chunk);
    }
    const downloadedContent = Buffer.concat(chunks).toString();
    console.log(`     ✅ Download OK (content: "${downloadedContent.substring(0, 50)}...")`);

    // Cleanup: Delete test file
    console.log('  5. Cleaning up test file...');
    const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
    const deleteCommand = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: testFileName,
    });
    await client.send(deleteCommand);
    console.log(`     ✅ Test file deleted`);

    console.log(`\n✅ ${bucketType} bucket test PASSED\n`);
    return { success: true, bucket: bucketName, fileCount };

  } catch (error) {
    console.error(`\n❌ ${bucketType} bucket test FAILED`);
    console.error(`   Error: ${error.message}`);
    if (error.name) {
      console.error(`   Error name: ${error.name}`);
    }
    if (error.$metadata?.httpStatusCode) {
      console.error(`   HTTP Status: ${error.$metadata.httpStatusCode}`);
    }
    console.log('');
    return { success: false, bucket: bucketName, error: error.message };
  }
}

// Main test function
async function main() {
  console.log('Configuration:');
  console.log(`  Public Bucket: ${railwayBucketPublic}`);
  console.log(`  Public Endpoint: ${storageEndpoint}`);
  console.log(`  Raw Bucket: ${railwayBucketRaw}`);
  console.log(`  Raw Endpoint: ${rawStorageEndpoint}`);
  console.log('');

  const results = [];

  // Test public bucket
  const publicResult = await testBucket(publicClient, railwayBucketPublic, 'Public');
  results.push(publicResult);

  // Test raw bucket
  const rawResult = await testBucket(rawClient, railwayBucketRaw, 'Raw/Admin');
  results.push(rawResult);

  // Summary
  console.log('='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));

  results.forEach(result => {
    if (result.success) {
      console.log(`✅ ${result.bucket}: PASSED (${result.fileCount || 0} files found)`);
    } else {
      console.log(`❌ ${result.bucket}: FAILED - ${result.error}`);
    }
  });

  const allPassed = results.every(r => r.success);
  console.log('');

  if (allPassed) {
    console.log('🎉 All tests passed! Railway storage is ready for migration.');
    process.exit(0);
  } else {
    console.log('⚠️  Some tests failed. Please check the errors above.');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

