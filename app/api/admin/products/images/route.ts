import { NextRequest, NextResponse } from 'next/server';
import { uploadPublicImage } from '@/lib/railway/storage';
import { query } from '@/lib/db';
import sharp from 'sharp';
import { randomUUID } from 'crypto';
import { getImageVariantUrl } from '@/lib/utils/imagePaths';

const PRODUCT_IMAGES_PATH = 'product-images';

async function uploadToStorage(path: string, buffer: Buffer, contentType = 'image/jpeg') {
  const result = await uploadPublicImage(path, buffer, {
    contentType,
    upsert: true,
  });
  return result.publicUrl;
}

async function handleJson(req: NextRequest) {
  const { productId, images, deleteIds } = await req.json();
  if (!productId) {
    return NextResponse.json({ error: 'productId is required' }, { status: 400 });
  }

  if (deleteIds?.length) {
    await query('DELETE FROM product_images WHERE id = ANY($1)', [deleteIds]);
  }

  if (images?.length) {
    const { rows: existing = [] } = await query(
      `
        SELECT id, position, sort_order, url
        FROM product_images
        WHERE product_id = $1
        ORDER BY COALESCE(position, sort_order, 9999)
      `,
      [productId]
    );

    const providedIds = images.filter((img: any) => img?.id).map((img: any) => img.id);
    const providedOrder = images.filter((img: any) => img?.id);
    const remaining = existing.filter((row: any) => !providedIds.includes(row.id));
    const finalOrder = [...providedOrder, ...remaining];

    for (let idx = 0; idx < finalOrder.length; idx++) {
      const img = finalOrder[idx];
      if (!img?.id) continue;
      await query('UPDATE product_images SET position = $1 WHERE id = $2', [100000 + idx + 1, img.id]);
    }
    for (let idx = 0; idx < finalOrder.length; idx++) {
      const img = finalOrder[idx];
      if (!img?.id) continue;
      await query('UPDATE product_images SET position = $1 WHERE id = $2', [idx + 1, img.id]);
    }
    
    // Update og_image_url to the first image's URL (convert /original/ to /medium/)
    if (finalOrder.length > 0 && finalOrder[0]?.url) {
      const firstImageUrl = finalOrder[0].url.replace('/original/', '/medium/');
      await query(
        'UPDATE products SET og_image_url = $1, updated_at = NOW() WHERE id = $2',
        [firstImageUrl, productId]
      );
    }
  }

  return NextResponse.json({ message: 'Images updated' });
}

async function handleUpload(req: NextRequest) {
  const form = await req.formData();
  const file = form.get('file') as File | null;
  const productId = form.get('productId') as string | null;
  const desiredPosition = form.get('position') ? Number(form.get('position')) : undefined;
  const cropX = form.get('cropX') ? Number(form.get('cropX')) : undefined;
  const cropY = form.get('cropY') ? Number(form.get('cropY')) : undefined;
  const cropW = form.get('cropW') ? Number(form.get('cropW')) : undefined;
  const cropH = form.get('cropH') ? Number(form.get('cropH')) : undefined;

  if (!file || !productId) {
    return NextResponse.json({ error: 'file and productId are required' }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { rows: productRows } = await query('SELECT shopify_product_id FROM products WHERE id = $1 LIMIT 1', [productId]);
  const shopifyId = productRows[0]?.shopify_product_id || 'unknown';

  const baseName = `${randomUUID()}.jpg`;
  const originalPath = `${PRODUCT_IMAGES_PATH}/${shopifyId}/original/${baseName}`;
  const thumbPath = `${PRODUCT_IMAGES_PATH}/${shopifyId}/thumb/${baseName}`;
  const mediumPath = `${PRODUCT_IMAGES_PATH}/${shopifyId}/medium/${baseName}`;

  const originalJpeg = await sharp(buffer).jpeg({ quality: 90 }).toBuffer();

  let baseForDerivatives = originalJpeg;
  if (
    typeof cropX === 'number' &&
    typeof cropY === 'number' &&
    typeof cropW === 'number' &&
    typeof cropH === 'number' &&
    !Number.isNaN(cropX) &&
    !Number.isNaN(cropY) &&
    !Number.isNaN(cropW) &&
    !Number.isNaN(cropH)
  ) {
    try {
      baseForDerivatives = await sharp(buffer)
        .extract({
          left: Math.max(0, Math.floor(cropX)),
          top: Math.max(0, Math.floor(cropY)),
          width: Math.floor(cropW),
          height: Math.floor(cropH),
        })
        .jpeg({ quality: 90 })
        .toBuffer();
    } catch (e) {
      console.error('crop failed, using original', e);
      baseForDerivatives = originalJpeg;
    }
  }

  const thumb = await sharp(baseForDerivatives)
    .resize({ height: 300 })
    .jpeg({ quality: 80 })
    .toBuffer();
  const medium = await sharp(baseForDerivatives)
    .resize({ width: 900, height: 900, fit: 'inside' })
    .jpeg({ quality: 85 })
    .toBuffer();

  const urlOriginal = await uploadToStorage(originalPath, originalJpeg);
  const urlThumb = await uploadToStorage(thumbPath, thumb);
  const urlMedium = await uploadToStorage(mediumPath, medium);

  let position = desiredPosition;
  if (!position || Number.isNaN(position)) {
    const { rows: existing = [] } = await query(
      'SELECT position, sort_order FROM product_images WHERE product_id = $1',
      [productId]
    );
    const maxPos =
      existing.reduce((max: number, row: any) => {
        const candidate = row.position ?? row.sort_order ?? 0;
        return Math.max(max, candidate);
      }, 0) ?? 0;
    position = maxPos + 1;
  }

  const { rows: insertedRows } = await query(
    `
      INSERT INTO product_images (product_id, shopify_product_id, url, position)
      VALUES ($1, $2, $3, $4)
      RETURNING id, product_id, url, position, shopify_product_id
    `,
    [productId, shopifyId, urlOriginal, position]
  );

  const inserted = insertedRows[0];

  const thumbUrlValue = urlThumb || getImageVariantUrl(inserted.url, 'thumb') || null;
  const mediumUrlValue = urlMedium || getImageVariantUrl(inserted.url, 'medium') || null;
  
  // If this is the first image (position 1), update product's og_image_url
  if (position === 1) {
    await query(
      'UPDATE products SET og_image_url = $1, updated_at = NOW() WHERE id = $2',
      [urlMedium, productId]
    );
  }
  
  return NextResponse.json({
    image: {
      ...inserted,
      thumb_url: thumbUrlValue,
      medium_url: mediumUrlValue,
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('multipart/form-data')) {
      return await handleUpload(req);
    }
    return await handleJson(req);
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err?.message || 'Internal error' }, { status: 500 });
  }
}

