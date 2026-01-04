#!/usr/bin/env node
/**
 * Migrate two hat products: download existing product_images URLs (Shopify CDN),
 * generate thumb/medium, upload to slingshot-images-dev under
 * product-images/{shopify_product_id}/original|thumb|medium/{basename},
 * and update product_images.url to the new original URL.
 */

const fs = require('fs');
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
const TARGET_IDS = [6154797908168, 7188610646216]; // Shopify product IDs

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
  if (!res.ok) throw new Error(`Failed to download ${url}: ${res.status}`);
  const arr = await res.arrayBuffer();
  return Buffer.from(arr);
}

async function processProduct(shopifyId) {
  const { data: product, error: prodErr } = await supabase
    .from('products')
    .select('id')
    .eq('shopify_product_id', shopifyId)
    .maybeSingle();
  if (prodErr) throw prodErr;
  if (!product) {
    console.warn(`No product found for ${shopifyId}`);
    return;
  }

  const { data: images, error: imgErr } = await supabase
    .from('product_images')
    .select('id,url,position')
    .eq('shopify_product_id', shopifyId)
    .order('position');
  if (imgErr) throw imgErr;
  if (!images || !images.length) {
    console.warn(`No product_images for ${shopifyId}`);
    return;
  }

  for (const img of images) {
    try {
      const buffer = await downloadBuffer(img.url);
      const baseName = path.basename(new URL(img.url).pathname);
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
        .eq('id', img.id);
      if (updErr) throw updErr;
      console.log(`Updated ${shopifyId} img ${img.id} -> ${urlOriginal}`);
    } catch (e) {
      console.error(`Failed for ${shopifyId} img ${img.id}:`, e.message);
    }
  }
}

async function main() {
  for (const id of TARGET_IDS) {
    console.log(`Processing product ${id}`);
    await processProduct(id);
  }
  console.log('Done.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

