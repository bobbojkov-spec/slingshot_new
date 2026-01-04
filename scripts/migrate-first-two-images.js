#!/usr/bin/env node
/**
 * Take first two existing product_images rows with urls, download originals,
 * generate thumb/medium, upload to slingshot-images-dev under
 * product-images/{shopify_product_id}/original|thumb|medium/{basename},
 * and update product_images.url to the new original URL.
 *
 * Assumes columns: id, product_id, shopify_product_id, url, position.
 */
const path = require('path');
const sharp = require('sharp');
const { createClient } = require('@supabase/supabase-js');
const { ensureEnv } = require('../lib/env');

ensureEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase env vars');
  process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseServiceKey);
const BUCKET = 'slingshot-images-dev';
const LIMIT = 2;

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

async function downloadBuffer(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed download ${url}: ${res.status}`);
  const arr = await res.arrayBuffer();
  return Buffer.from(arr);
}

async function processRow(row) {
  // Lookup shopify_product_id if missing
  let shopifyId = row.shopify_product_id;
  if (!shopifyId) {
    const { data: prod, error: prodErr } = await supabase
      .from('products')
      .select('shopify_product_id')
      .eq('id', row.product_id)
      .maybeSingle();
    if (prodErr) throw prodErr;
    if (!prod || !prod.shopify_product_id) {
      console.warn(`Row ${row.id} has no shopify_product_id and product lookup failed, skipping`);
      return null;
    }
    shopifyId = prod.shopify_product_id;
  }
  const buffer = await downloadBuffer(row.url);
  const baseName = path.basename(new URL(row.url).pathname);
  const baseFolder = `product-images/${shopifyId}`;
  const originalKey = `${baseFolder}/original/${baseName}`;
  const thumbKey = `${baseFolder}/thumb/${baseName}`;
  const mediumKey = `${baseFolder}/medium/${baseName}`;

  const thumbBuffer = await sharp(buffer).resize({ width: 300 }).jpeg({ quality: 80 }).toBuffer();
  const mediumBuffer = await sharp(buffer).resize({ width: 900 }).jpeg({ quality: 85 }).toBuffer();

  const [urlOriginal] = await Promise.all([
    uploadBuffer(originalKey, buffer),
    uploadBuffer(thumbKey, thumbBuffer),
    uploadBuffer(mediumKey, mediumBuffer),
  ]);

  const { error: updErr } = await supabase
    .from('product_images')
    .update({ url: urlOriginal })
    .eq('id', row.id);
  if (updErr) throw updErr;

  return { id: row.id, product_id: row.product_id, shopify_product_id: shopifyId, url: urlOriginal, position: row.position };
}

async function main() {
  const { data, error } = await supabase
    .from('product_images')
    .select('id,product_id,shopify_product_id,url,position')
    .not('url', 'is', null)
    .order('id', { ascending: true })
    .limit(LIMIT);
  if (error) throw error;
  if (!data || !data.length) {
    console.warn('No product_images rows found');
    return;
  }

  const results = [];
  for (const row of data) {
    try {
      const res = await processRow(row);
      if (res) results.push(res);
    } catch (e) {
      console.error(`Row ${row.id} failed:`, e.message);
    }
  }

  console.log('Updated rows:', JSON.stringify(results, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

