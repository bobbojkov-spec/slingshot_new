#!/usr/bin/env node
/**
 * Upload selected product images to Supabase storage and link them in product_images.
 * Requires env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *
 * Adjust `imageMappings` to point to correct filenames and titles.
 */
const fs = require('fs');
const path = require('path');
const { ensureEnv } = require('../lib/env');

ensureEnv();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceKey) {
  console.error('Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

const localDir = '/Users/borislavbojkov/Downloads/slingshot-website-images';
const bucket = 'slingshot-images-dev';

// Map shopify_product_id to local filenames (first is main)
const imageMappings = [
  {
    shopifyProductId: 'ghost-v3',
    titleLike: 'Ghost V3',
    files: ['1240114_GHOSTV3_BLUE_24X_MAIN.jpg'],
  },
  {
    shopifyProductId: 'ufo-v3',
    titleLike: 'UFO V3',
    files: ['1240112_UFOV3_24X_MAIN.jpg'],
  },
  {
    shopifyProductId: 'code-v2',
    titleLike: 'Code V2',
    files: ['1250112_CODEV2_BLUE_25X_MAIN.jpg'],
  },
  {
    shopifyProductId: 'code-nxt',
    titleLike: 'Code NXT',
    files: ['1250110_CODENXT_25X_MAIN.jpg'],
  },
  {
    shopifyProductId: 'fuse',
    titleLike: 'Fuse',
    files: ['1260111_FUSE_26X_MAIN.jpg'],
  },
  {
    shopifyProductId: 'ghost-v4',
    titleLike: 'Ghost V4',
    files: ['1260110_GHOSTV4_26X_MAIN.jpg'],
  },
  {
    shopifyProductId: 'machine-v3',
    titleLike: 'Machine V3',
    files: ['1260112_MACHINEV3_26X_MAIN.jpg'],
  },
];

function slugify(val) {
  return (val || '')
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function ensureProduct(titleLike) {
  const { data, error } = await supabase
    .from('products')
    .select('id, title, handle')
    .ilike('title', `%${titleLike}%`)
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error(`No product found for title like "${titleLike}"`);
  return data;
}

async function uploadAndLinkVariant({ titleLike, shopifyProductId, files }) {
  const product = await ensureProduct(titleLike);
  const baseKey = slugify(shopifyProductId || product.handle || product.title || titleLike);

  for (let i = 0; i < files.length; i += 1) {
    const filename = files[i];
    const filePath = path.join(localDir, filename);
    if (!fs.existsSync(filePath)) {
      console.warn(`File missing: ${filePath}`);
      continue;
    }

    const normalizedFile = slugify(path.parse(filename).name) + path.parse(filename).ext.toLowerCase();
    const storagePath = `${baseKey}/${String(i + 1).padStart(2, '0')}-${normalizedFile}`;
    const fileBuffer = fs.readFileSync(filePath);

    console.log(`Uploading ${filename} -> ${storagePath} for product ${product.title} (${product.id})`);

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(storagePath, fileBuffer, { contentType: 'image/jpeg', upsert: true });
    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(storagePath);
    const publicUrl = urlData?.publicUrl;

    if (publicUrl) {
      const payload = {
        product_id: product.id,
        shopify_product_id: baseKey,
        url: publicUrl,
        position: i + 1,
      };
      const { error: insertError } = await supabase.from('product_images').insert(payload);
      if (insertError) throw insertError;
    } else {
      console.warn(`No public URL returned for ${storagePath}`);
    }
  }
}

async function main() {
  for (const item of imageMappings) {
    try {
      await uploadAndLinkVariant(item);
    } catch (err) {
      console.error(`Failed for ${item.titleLike}:`, err.message);
    }
  }
}

main().then(() => {
  console.log('Done.');
  process.exit(0);
});

