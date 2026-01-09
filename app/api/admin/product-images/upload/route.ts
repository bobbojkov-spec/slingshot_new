import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import sharp, { type ResizeOptions } from 'sharp';
import { query } from '@/lib/db';
import { uploadPublicImage } from '@/lib/railway/storage';
import {
  ensureProductImagesRailwayTable,
  ImageSize,
  PRODUCT_IMAGES_RAILWAY_TABLE,
  ProductImageBundle,
  RAILWAY_PROVIDER,
} from '@/lib/productImagesRailway';

type UploadVariant = {
  size: ImageSize;
  quality: number;
  resize: ResizeOptions;
};

const VARIANTS: UploadVariant[] = [
  { size: 'thumb', quality: 80, resize: { height: 200 } },
  { size: 'small', quality: 80, resize: { height: 300 } },
  { size: 'big', quality: 85, resize: { width: 900, height: 900, fit: 'inside' } },
];

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9_.-]/g, '');
}

async function calculateNextOrder(productId: string) {
  const { rows } = await query(
    `
      SELECT MAX(display_order) AS max_order
      FROM ${PRODUCT_IMAGES_RAILWAY_TABLE}
      WHERE product_id = $1 AND storage_provider = $2
    `,
    [productId, RAILWAY_PROVIDER]
  );
  const typed = rows as { max_order: number | null }[];
  const maxOrder = typed?.[0]?.max_order ?? 0;
  return maxOrder + 1;
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get('file') as File | null;
    const productId = form.get('productId') as string | null;

    if (!file || !productId) {
      return NextResponse.json(
        { error: 'file and productId are required' },
        { status: 400 }
      );
    }

    await ensureProductImagesRailwayTable();

    const buffer = Buffer.from(await file.arrayBuffer());
    const baseBuffer = await sharp(buffer).jpeg({ quality: 90 }).toBuffer();
    const bundleId = randomUUID();
    const timestamp = Date.now();
    const name = sanitizeFileName(file.name || `${bundleId}.jpg`);
    const baseFolder = `product-images/${productId}/${bundleId}`;

    const uploadPromises = VARIANTS.map(async (variant) => {
      const transformed = await sharp(baseBuffer)
        .resize(variant.resize)
        .jpeg({ quality: variant.quality })
        .toBuffer();
      const path = `${baseFolder}/${variant.size}/${timestamp}-${name}`;
      const uploaded = await uploadPublicImage(path, transformed, {
        contentType: 'image/jpeg',
        upsert: true,
      });
      return {
        size: variant.size,
        url: uploaded.publicUrl,
        path: uploaded.path,
      };
    });

    const uploadedVariants = await Promise.all(uploadPromises);
    const displayOrder = await calculateNextOrder(productId);

    const rowsToInsert = uploadedVariants.map((variant) => ({
      id: randomUUID(),
      bundleId,
      productId,
      imageUrl: variant.url,
      storagePath: variant.path,
      size: variant.size,
    }));

    const placeholders = rowsToInsert
      .map((_, idx) => {
        const base = idx * 8;
        return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}, $${base + 8})`;
      })
      .join(', ');
    const values = rowsToInsert.flatMap((row) => [
      row.id,
      row.bundleId,
      row.productId,
      row.imageUrl,
      row.storagePath,
      row.size,
      displayOrder,
      RAILWAY_PROVIDER,
    ]);

    await query(
      `
        INSERT INTO ${PRODUCT_IMAGES_RAILWAY_TABLE} (
          id,
          bundle_id,
          product_id,
          image_url,
          storage_path,
          size,
          display_order,
          storage_provider
        ) VALUES ${placeholders}
      `,
      values
    );

    const bundle = uploadedVariants.reduce<ProductImageBundle>(
      (acc, variant) => {
        acc.urls[variant.size] = { url: variant.url, path: variant.path };
        return acc;
      },
      {
        bundleId,
        productId,
        order: displayOrder,
        createdAt: new Date().toISOString(),
        urls: { thumb: null, small: null, big: null },
      }
    );

    return NextResponse.json({ bundle });
  } catch (error: any) {
    console.error('Product image upload failed', error);
    return NextResponse.json(
      { error: error?.message || 'Upload failed' },
      { status: 500 }
    );
  }
}

