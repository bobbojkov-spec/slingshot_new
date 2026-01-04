#!/usr/bin/env node
/**
 * Ingest product images from local disk, create derivatives, upload to Supabase, and insert DB rows.
 * Rules:
 * - Source: /Users/borislavbojkov/desktop/images/{shopify_product_id}/01.jpg, 02.jpg...
 * - Do not rename or reorder files. Position is filename order.
 * - bucket: product-images
 * - Paths:
 *    product-images/{shopify_product_id}/original/01.jpg
 *    product-images/{shopify_product_id}/thumb/01.jpg
 *    product-images/{shopify_product_id}/medium/01.jpg
 * - Derivatives:
 *    thumb: 300px wide, auto height, jpeg q80
 *    medium: 900px wide, auto height, jpeg q85
 * - DB: product_images rows with shopify_product_id (bigint), url_original, url_thumb, url_medium, position, is_main
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { ensureEnv } = require('../lib/env');

ensureEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const LOCAL_ROOT = '/Users/borislavbojkov/desktop/images';
const BUCKET = 'slingshot-images-dev';

async function ensurePublicUrl(storagePath) {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
  return data?.publicUrl;
}

async function uploadBuffer(storagePath, buffer, contentType = 'image/jpeg') {
  const { error } = await supabase.storage.from(BUCKET).upload(storagePath, buffer, {
    contentType,
    upsert: true,
  });
  if (error) throw error;
  return ensurePublicUrl(storagePath);
}

async function processImage(shopifyId, filename, position) {
  // lookup product_id by shopify_product_id
  const { data: prod, error: prodErr } = await supabase
    .from('products')
    .select('id')
    .eq('shopify_product_id', Number(shopifyId))
    .maybeSingle();
  if (prodErr) throw prodErr;
  if (!prod) {
    console.warn(`No product found for shopify_product_id=${shopifyId}, skipping image ${filename}`);
    return null;
  }
  const productIdStr = String(shopifyId);
  const filePath = path.join(LOCAL_ROOT, productIdStr, filename);
  const baseName = path.basename(filename);

  const originalBuffer = fs.readFileSync(filePath);

  // Upload
  const baseFolder = `product-images/${productIdStr}`;
  const originalKey = `${baseFolder}/original/${baseName}`;

  const url = await uploadBuffer(originalKey, originalBuffer, 'image/jpeg');

  return {
    product_id: prod.id,
    shopify_product_id: Number(shopifyId),
    url,
    position,
  };
}

async function insertRows(rows) {
  const filtered = rows.filter(Boolean);
  if (!filtered.length) return;
  const { error } = await supabase.from('product_images').upsert(filtered, { onConflict: 'product_id,position' });
  if (error) throw error;
}

async function main() {
  if (!fs.existsSync(LOCAL_ROOT)) {
    console.error(`Local image root not found: ${LOCAL_ROOT}`);
    process.exit(1);
  }

  const dirs = fs
    .readdirSync(LOCAL_ROOT, { withFileTypes: true })
    .filter((d) => d.isDirectory() && /^\d+$/.test(d.name))
    .map((d) => d.name);

  console.log(`Found ${dirs.length} product folders`);

  for (const dir of dirs) {
    const shopifyId = dir;
    const files = fs
      .readdirSync(path.join(LOCAL_ROOT, dir))
      .filter((f) => /^\d+\.(jpe?g|png)$/i.test(f))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

    if (!files.length) {
      console.warn(`No images for product ${shopifyId}`);
      continue;
    }

    console.log(`Processing ${shopifyId} with ${files.length} images`);
    const rows = [];
    for (let i = 0; i < files.length; i++) {
      const position = i + 1;
      const row = await processImage(shopifyId, files[i], position);
      rows.push(row);
    }

    await insertRows(rows);
  }

  console.log('Done.');
}

main().catch((err) => {
  console.error('Failed:', err);
  process.exit(1);
});

