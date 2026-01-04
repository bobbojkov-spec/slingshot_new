// CommonJS (so it runs without `"type": "module"` in package.json)
const { createClient } = require('@supabase/supabase-js');
const sharp = require('sharp');
const { ensureEnv } = require('../lib/env');

ensureEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

const STORAGE_BUCKET = 'slingshot-images-dev';
const PRODUCT_IMAGES_STORAGE_PATH = 'product-images';

async function downloadImage(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.statusText}`);
  }
  const buffer = await response.arrayBuffer();
  return Buffer.from(buffer);
}

async function uploadToSupabase(path, buffer, contentType = 'image/jpeg') {
  const { data, error } = await supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .upload(path, buffer, {
      contentType,
      upsert: true,
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  return data;
}

function getPublicUrl(path) {
  const { data } = supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(path);
  return data.publicUrl;
}

async function processProductImages(product, images) {
  console.log(`\n[${product.title}] Processing ${images.length} images...`);

  const shopifyProductId = product.shopify_product_id;
  if (!shopifyProductId) {
    console.warn(`  ⚠️  No shopify_product_id, skipping`);
    return;
  }

  // Sort images by position
  const sortedImages = images.sort((a, b) => {
    const posA = a.position ?? 999;
    const posB = b.position ?? 999;
    return posA - posB;
  });

  // First pass: Bump all positions to avoid conflicts
  for (let i = 0; i < sortedImages.length; i++) {
    const img = sortedImages[i];
    await supabaseAdmin
      .from('product_images')
      .update({ position: 1000 + i })
      .eq('id', img.id);
  }

  for (let i = 0; i < sortedImages.length; i++) {
    const img = sortedImages[i];
    const position = i + 1;
    
    // Skip if already a Supabase URL
    if (img.url.includes('supabase.co')) {
      console.log(`  ✓ Image ${position} already on Supabase, skipping`);
      continue;
    }

    try {
      console.log(`  → Downloading image ${position} from ${img.url.substring(0, 60)}...`);
      const originalBuffer = await downloadImage(img.url);

      // Generate filename
      const filename = `${String(position).padStart(2, '0')}.jpg`;

      // Generate thumbnail (300px)
      console.log(`  → Generating thumbnail...`);
      const thumbBuffer = await sharp(originalBuffer)
        .resize(300, 300, { fit: 'cover' })
        .jpeg({ quality: 80 })
        .toBuffer();

      // Generate medium (900px)
      console.log(`  → Generating medium size...`);
      const mediumBuffer = await sharp(originalBuffer)
        .resize(900, 900, { fit: 'inside' })
        .jpeg({ quality: 85 })
        .toBuffer();

      // Convert original to JPEG if needed
      const originalJpeg = await sharp(originalBuffer)
        .jpeg({ quality: 90 })
        .toBuffer();

      // Upload to Supabase Storage
      const pathOriginal = `${PRODUCT_IMAGES_STORAGE_PATH}/${shopifyProductId}/original/${filename}`;
      const pathThumb = `${PRODUCT_IMAGES_STORAGE_PATH}/${shopifyProductId}/thumb/${filename}`;
      const pathMedium = `${PRODUCT_IMAGES_STORAGE_PATH}/${shopifyProductId}/medium/${filename}`;

      console.log(`  → Uploading to Supabase Storage...`);
      await uploadToSupabase(pathOriginal, originalJpeg, 'image/jpeg');
      await uploadToSupabase(pathThumb, thumbBuffer, 'image/jpeg');
      await uploadToSupabase(pathMedium, mediumBuffer, 'image/jpeg');

      const urlOriginal = getPublicUrl(pathOriginal);
      const urlThumb = getPublicUrl(pathThumb);
      const urlMedium = getPublicUrl(pathMedium);

      // Update database record with new Supabase URLs
      console.log(`  → Updating database...`);
      const { error: updateError } = await supabaseAdmin
        .from('product_images')
        .update({
          url: urlOriginal,
          position: position,
        })
        .eq('id', img.id);

      if (updateError) {
        console.error(`  ✗ Database update failed:`, updateError.message);
      } else {
        console.log(`  ✓ Image ${position} migrated successfully`);
      }

    } catch (err) {
      console.error(`  ✗ Failed to process image ${position}:`, err.message);
    }
  }
}

async function main() {
  console.log('🚀 Starting image migration for all products...\n');

  // Fetch all products
  const { data: products, error: productsError } = await supabaseAdmin
    .from('products')
    .select('id, title, shopify_product_id')
    .order('title');

  if (productsError) {
    console.error('Failed to fetch products:', productsError);
    process.exit(1);
  }

  console.log(`Found ${products.length} products\n`);

  // Fetch all product images
  const productIds = products.map(p => p.id);
  const { data: allImages, error: imagesError } = await supabaseAdmin
    .from('product_images')
    .select('id, product_id, url, position')
    .in('product_id', productIds);

  if (imagesError) {
    console.error('Failed to fetch images:', imagesError);
    process.exit(1);
  }

  console.log(`Found ${allImages.length} total images\n`);
  console.log('=' .repeat(60));

  // Group images by product
  const imagesByProduct = new Map();
  allImages.forEach(img => {
    if (!imagesByProduct.has(img.product_id)) {
      imagesByProduct.set(img.product_id, []);
    }
    imagesByProduct.get(img.product_id).push(img);
  });

  let processed = 0;
  let skipped = 0;

  // Process each product
  for (const product of products) {
    const images = imagesByProduct.get(product.id) || [];
    
    if (images.length === 0) {
      console.log(`\n[${product.title}] No images, skipping`);
      skipped++;
      continue;
    }

    await processProductImages(product, images);
    processed++;

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('\n' + '='.repeat(60));
  console.log(`\n✅ Migration complete!`);
  console.log(`   Products processed: ${processed}`);
  console.log(`   Products skipped: ${skipped}`);
  console.log(`   Total images: ${allImages.length}\n`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

