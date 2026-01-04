#!/usr/bin/env node
const { S3Client, ListObjectsV2Command, GetObjectCommand, PutObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const ENV = {
  OLD_BUCKET_NAME: process.env.OLD_BUCKET_NAME,
  OLD_BUCKET_KEY: process.env.OLD_BUCKET_KEY,
  OLD_BUCKET_SECRET: process.env.OLD_BUCKET_SECRET,
  OLD_BUCKET_REGION: process.env.OLD_BUCKET_REGION,
  OLD_BUCKET_ENDPOINT: process.env.OLD_BUCKET_ENDPOINT,
  BUCKET_NAME: process.env.BUCKET_NAME,
  BUCKET_KEY: process.env.BUCKET_KEY,
  BUCKET_SECRET: process.env.BUCKET_SECRET,
  BUCKET_REGION: process.env.BUCKET_REGION,
  BUCKET_ENDPOINT: process.env.BUCKET_ENDPOINT,
};

const requiredKeys = [
  'OLD_BUCKET_NAME',
  'OLD_BUCKET_KEY',
  'OLD_BUCKET_SECRET',
  'OLD_BUCKET_REGION',
  'OLD_BUCKET_ENDPOINT',
  'BUCKET_NAME',
  'BUCKET_KEY',
  'BUCKET_SECRET',
  'BUCKET_REGION',
  'BUCKET_ENDPOINT',
];

const missing = requiredKeys.filter((key) => !ENV[key]);
if (missing.length > 0) {
  console.error(`Missing required env vars: ${missing.join(', ')}`);
  process.exit(1);
}

const dryRun = process.argv.includes('--dry-run');

const srcClient = new S3Client({
  region: ENV.OLD_BUCKET_REGION,
  endpoint: ENV.OLD_BUCKET_ENDPOINT,
  credentials: {
    accessKeyId: ENV.OLD_BUCKET_KEY,
    secretAccessKey: ENV.OLD_BUCKET_SECRET,
  },
  forcePathStyle: true,
});

const destClient = new S3Client({
  region: ENV.BUCKET_REGION,
  endpoint: ENV.BUCKET_ENDPOINT,
  credentials: {
    accessKeyId: ENV.BUCKET_KEY,
    secretAccessKey: ENV.BUCKET_SECRET,
  },
  forcePathStyle: true,
});

async function listAllKeys(client, bucket) {
  const results = [];
  let continuationToken;
  do {
    const command = new ListObjectsV2Command({
      Bucket: bucket,
      ContinuationToken: continuationToken,
    });
    const response = await client.send(command);
    (response.Contents || []).forEach((item) => {
      if (item.Key) {
        results.push({
          key: item.Key,
          size: item.Size ?? 0,
          lastModified: item.LastModified,
        });
      }
    });
    continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
  } while (continuationToken);
  return results;
}

async function objectExists(client, bucket, key) {
  try {
    await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return true;
  } catch (error) {
    if (error?.$metadata?.httpStatusCode === 404 || error?.name === 'NotFound' || error?.Code === 'NotFound') {
      return false;
    }
    throw error;
  }
}

async function streamToBuffer(body) {
  const chunks = [];
  for await (const chunk of body) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

async function copyObject(key) {
  const exists = await objectExists(destClient, ENV.BUCKET_NAME, key);
  if (exists) {
    console.log(`SKIP  (exists): ${key}`);
    return { status: 'skipped' };
  }

  console.log(`${dryRun ? 'DRY-RUN Copy' : 'COPY'}: ${key}`);

  if (dryRun) {
    return { status: 'dry-run' };
  }

  const response = await srcClient.send(new GetObjectCommand({ Bucket: ENV.OLD_BUCKET_NAME, Key: key }));
  if (!response.Body) {
    throw new Error(`Empty body for ${key}`);
  }
  const buffer = await streamToBuffer(response.Body);
  const contentType = response.ContentType || 'application/octet-stream';

  await destClient.send(
    new PutObjectCommand({
      Bucket: ENV.BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }),
  );

  return { status: 'copied' };
}

async function main() {
  console.log('🔧 Bucket migration: OLD bucket → DEV bucket (Railway)');
  console.log(`   Source (read-only): ${ENV.OLD_BUCKET_NAME} @ ${ENV.OLD_BUCKET_ENDPOINT}`);
  console.log(`   Destination (write): ${ENV.BUCKET_NAME} @ ${ENV.BUCKET_ENDPOINT}`);
  console.log(dryRun ? '   Running in DRY-RUN mode (no writes).' : '');
  console.log('');

  const files = await listAllKeys(srcClient, ENV.OLD_BUCKET_NAME);
  if (files.length === 0) {
    console.log('✅ No files found in old bucket.');
    return;
  }

  console.log(`🗂 Found ${files.length} files to evaluate.`);
  let copied = 0;
  let skipped = 0;
  let drySkipped = 0;
  const errors = [];

  for (const file of files) {
    try {
      const result = await copyObject(file.key);
      if (result.status === 'copied') copied += 1;
      if (result.status === 'skipped') skipped += 1;
      if (result.status === 'dry-run') drySkipped += 1;
    } catch (error) {
      errors.push({ file: file.key, error: error.message || error });
      console.error(`   ❌ Error: ${file.key} → ${error.message || error}`);
    }
  }

  console.log('\n📊 SUMMARY');
  console.log(`   Files evaluated: ${files.length}`);
  console.log(`   Copied: ${copied}`);
  console.log(`   Already existed (skipped): ${skipped}`);
  if (dryRun) console.log(`   Dry-run (no writes): ${drySkipped}`);
  if (errors.length > 0) {
    console.log('   Errors:');
    errors.forEach((entry) => {
      console.log(`     - ${entry.file}: ${entry.error}`);
    });
  }

  console.log('\nNEXT STEPS:');
  console.log('   1. If running dry-run, rerun without the --dry-run flag.');
  console.log('   2. Verify the DEV bucket contains the expected files before pointing prod traffic.');
  console.log('   3. Keep OLD bucket env vars until you confirm the migration, then remove them.');
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal:', error);
    process.exit(1);
  });
}

