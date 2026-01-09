#!/usr/bin/env node

/**
 * Migrate Supabase-hosted product images into the Railway-backed editor.
 *
 * Usage:
 *   node scripts/migrate-supabase-product-images.js --product <productId>
 *   node scripts/migrate-supabase-product-images.js --all
 */

const { randomUUID } = require('crypto');
const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const sharp = require('sharp');
const { ensureEnv } = require('../lib/env.js');
const { Pool } = require('pg');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const http = require('http');
const https = require('https');

ensureEnv();

const storageType = process.env.RAILWAY_STORAGE_TYPE || 's3';
const normalizeEnvValue = (value) => {
  if (!value) return undefined;
  if (value.startsWith('$')) return undefined;
  return value;
};

const storageEndpoint =
  normalizeEnvValue(process.env.RAILWAY_STORAGE_ENDPOINT) ||
  normalizeEnvValue(process.env.IMAGE_STORAGE_ENDPOINT);
const storageRegion =
  normalizeEnvValue(process.env.RAILWAY_STORAGE_REGION) ||
  normalizeEnvValue(process.env.IMAGE_STORAGE_REGION) ||
  'us-east-1';
const storageAccessKey =
  normalizeEnvValue(process.env.RAILWAY_STORAGE_ACCESS_KEY_ID) ||
  normalizeEnvValue(process.env.IMAGE_STORAGE_ACCESS_KEY);
const storageSecretKey =
  normalizeEnvValue(process.env.RAILWAY_STORAGE_SECRET_KEY) ||
  normalizeEnvValue(process.env.IMAGE_STORAGE_SECRET_KEY);
const publicUrlBase =
  normalizeEnvValue(process.env.RAILWAY_STORAGE_PUBLIC_URL_BASE) ||
  normalizeEnvValue(process.env.IMAGE_STORAGE_PUBLIC_URL_BASE) ||
  '';

const STORAGE_BUCKETS = {
  PUBLIC:
    process.env.RAILWAY_STORAGE_BUCKET_PUBLIC ||
    process.env.IMAGE_STORAGE_BUCKET ||
    'slingshot-images-dev',
};

let s3Client = null;

function getS3Client() {
  if (!s3Client) {
    if (!storageEndpoint || !storageAccessKey || !storageSecretKey) {
      throw new Error('Railway Storage not configured. Missing RAILWAY_STORAGE_* variables.');
    }
    s3Client = new S3Client({
      endpoint: storageEndpoint,
      region: storageRegion,
      credentials: {
        accessKeyId: storageAccessKey,
        secretAccessKey: storageSecretKey,
      },
      forcePathStyle: storageType === 'minio',
    });
  }
  return s3Client;
}

function getPublicImageUrl(filePath, bucket = STORAGE_BUCKETS.PUBLIC) {
  if (publicUrlBase) {
    return `${publicUrlBase}/${bucket}/${filePath}`;
  }
  if (storageType === 'minio' || storageType === 'r2') {
    const endpoint = storageEndpoint || `https://${storageRegion}.amazonaws.com`;
    return `${endpoint}/${bucket}/${filePath}`;
  }
  const endpoint = storageEndpoint || `https://s3.${storageRegion}.amazonaws.com`;
  return `${endpoint}/${bucket}/${filePath}`;
}

async function uploadPublicImage(filePath, buffer, options = {}) {
  const bucket = options.bucket || STORAGE_BUCKETS.PUBLIC;
  const client = getS3Client();
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: filePath,
    Body: buffer,
    ContentType: options.contentType || 'image/jpeg',
  });
  await client.send(command);
  return {
    path: filePath,
    publicUrl: getPublicImageUrl(filePath, bucket),
  };
}

const RAILWAY_PROVIDER = 'railway';
const VARIANTS = [
  { size: 'thumb', resizeOptions: { height: 200 }, quality: 80 },
  { size: 'small', resizeOptions: { height: 300 }, quality: 80 },
  { size: 'big', resizeOptions: { width: 900, height: 900, fit: 'inside' }, quality: 85 },
];

const parseArgs = () => {
  const rawArgs = process.argv.slice(2);
  const result = {};
  for (let i = 0; i < rawArgs.length; i++) {
    const arg = rawArgs[i];
    if (!arg.startsWith('--')) {
      continue;
    }
    const [key, value] = arg.slice(2).split('=');
    if (value !== undefined) {
      result[key] = value;
    } else {
      const next = rawArgs[i + 1];
      if (next && !next.startsWith('--')) {
        result[key] = next;
        i += 1;
      } else {
        result[key] = true;
      }
    }
  }
  return result;
};

ensureEnv();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.DATABASE_URL?.includes('railway') ||
      process.env.DATABASE_URL?.includes('rlwy.net')
      ? { rejectUnauthorized: false }
      : undefined,
});

const query = async (text, params) => {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log('Executed query', { text, duration, rows: res.rowCount });
  return res;
};

const ensureTable = async () => {
  // We assume product_images table exists and has necessary columns based on admin route queries.
  // If not, we might fail, but let's assume schema drift where DB has them.
  // We can try to add them if missing, but let's stick to updating what we can.
  /*
   We expect these columns from admin route:
   original_path, thumb_path, medium_path
  */
  try {
    await query(`ALTER TABLE product_images ADD COLUMN IF NOT EXISTS original_path TEXT`);
    await query(`ALTER TABLE product_images ADD COLUMN IF NOT EXISTS thumb_path TEXT`);
    await query(`ALTER TABLE product_images ADD COLUMN IF NOT EXISTS medium_path TEXT`);
    await query(`ALTER TABLE product_images ADD COLUMN IF NOT EXISTS storage_provider TEXT DEFAULT 'supabase'`);
  } catch (e) {
    console.log('Error altering table, maybe columns exist', e.message);
  }
};

const normalizeUrl = (value) => {
  if (!value) return null;
  if (typeof value !== 'string') {
    try {
      const parsed = JSON.parse(value);
      return parsed?.publicUrl || parsed?.url || null;
    } catch {
      return null;
    }
  }
  return value;
};

const downloadImage = (url, downloadDir, fileName) =>
  new Promise((resolve, reject) => {
    const destPath = path.join(downloadDir, fileName);
    const lib = url.startsWith('https') ? https : http;
    const request = lib.get(url, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        request.abort();
        downloadImage(res.headers.location, downloadDir, fileName)
          .then(resolve)
          .catch(reject);
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error(`Failed to download ${url} (${res.statusCode})`));
        return;
      }
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', async () => {
        const buffer = Buffer.concat(chunks);
        try {
          await fs.writeFile(destPath, buffer);
          resolve(buffer);
        } catch (err) {
          reject(err);
        }
      });
    });
    request.on('error', reject);
  });

const resizeBuffers = async (buffer) => {
  const big = await sharp(buffer)
    .jpeg({ quality: 95 })
    .toBuffer();
  return { base: big };
};

const uploadVariants = async ({ baseBuffer, productId, bundleId, fileName }) => {
  const timestamp = Date.now();
  const uploads = [];
  for (const variant of VARIANTS) {
    const transformed = await sharp(baseBuffer)
      .resize(variant.resizeOptions)
      .jpeg({ quality: variant.quality })
      .toBuffer();

    const storagePath = `product-images/${productId}/${bundleId}/${variant.size}/${timestamp}-${fileName}`;
    const uploaded = await uploadPublicImage(storagePath, transformed, {
      contentType: 'image/jpeg',
      upsert: true,
    });

    uploads.push({
      size: variant.size,
      url: uploaded.publicUrl,
      path: uploaded.path,
    });
  }
  return uploads;
};

const updateTableRow = async ({ rowId, uploads }) => {
  const original = uploads.find(u => u.size === 'big') || uploads[0];
  const thumb = uploads.find(u => u.size === 'thumb');
  const medium = uploads.find(u => u.size === 'small'); // mapped 'small' to medium

  await query(
    `
      UPDATE product_images
      SET 
        url = $1,
        original_path = $2,
        thumb_path = $3,
        medium_path = $4,
        storage_provider = $5
      WHERE id = $6
    `,
    [
      original.url,
      original.path,
      thumb ? thumb.path : null,
      medium ? medium.path : null,
      RAILWAY_PROVIDER,
      rowId
    ]
  );
};

const fetchSupabaseImageRows = async (productId) => {
  const { rows } = await query(
    `
      SELECT id, url
      FROM product_images
      WHERE product_id = $1 AND url LIKE '%supabase.co%'
      ORDER BY position ASC NULLS LAST, sort_order ASC NULLS LAST
    `,
    [productId]
  );
  return rows;
};

const processProduct = async (productId) => {
  const downloadDir = await fs.mkdtemp(path.join(os.tmpdir(), 'supabase-images-'));
  console.log('Temporary download folder:', downloadDir);
  try {
    const rows = await fetchSupabaseImageRows(productId);
    if (!rows.length) {
      console.log('No Supabase images found for', productId);
      return;
    }

    await ensureTable();

    for (const row of rows) {
      const imageUrl = normalizeUrl(row.url);
      if (!imageUrl) continue;

      console.log('Downloading', imageUrl);
      let downloadName = `${row.id}.jpg`;
      try {
        downloadName = path.basename(new URL(imageUrl).pathname) || downloadName;
      } catch {
        // keep fallback name
      }

      try {
        const buffer = await downloadImage(imageUrl, downloadDir, downloadName);

        const bundleId = randomUUID();
        const uploads = await uploadVariants({
          baseBuffer: buffer,
          productId,
          bundleId,
          fileName: downloadName,
        });

        await updateTableRow({
          rowId: row.id,
          uploads,
        });

        console.log(`Updated row ${row.id} for product ${productId}`);
      } catch (err) {
        console.error(`Failed to migrate image ${row.id}`, err);
      }
    }
  } finally {
    await fs.rm(downloadDir, { recursive: true, force: true });
    console.log('Cleaned temporary folder');
  }
};

const main = async () => {
  const args = parseArgs();
  if (args.all) {
    const { rows } = await query(
      `
        SELECT DISTINCT product_id
        FROM product_images
        WHERE url LIKE '%supabase.co%'
      `
    );
    for (const row of rows) {
      console.log('Migrating product', row.product_id);
      try {
        await processProduct(row.product_id);
      } catch (err) {
        console.error(`Failed migrating product ${row.product_id}:`, err);
      }
    }
    return;
  }

  const productId = args.product || args.p;
  if (!productId) {
    console.error('Usage: --product <productId> | --all');
    process.exit(1);
  }
  await processProduct(productId);
};

main().catch((err) => {
  console.error('Migration failed', err);
  process.exit(1);
});

