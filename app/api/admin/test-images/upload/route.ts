import { NextRequest, NextResponse } from 'next/server';
import { uploadPublicImage } from '@/lib/railway/storage';
import { query } from '@/lib/db';
import sharp from 'sharp';
import { randomUUID } from 'crypto';

const TABLE_SQL = `
CREATE TABLE IF NOT EXISTS test_images (
  id UUID PRIMARY KEY,
  name TEXT,
  original_url TEXT NOT NULL,
  small_url TEXT,
  large_url TEXT,
  original_public_url TEXT,
  small_public_url TEXT,
  large_public_url TEXT,
  crop_ratio TEXT,
  mode TEXT,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
)
`;

async function ensureTable() {
  await query(TABLE_SQL);
  await query(`
    ALTER TABLE test_images
    ADD COLUMN IF NOT EXISTS original_public_url TEXT,
    ADD COLUMN IF NOT EXISTS small_public_url TEXT,
    ADD COLUMN IF NOT EXISTS large_public_url TEXT
  `);
}

function parseRatio(value: string | null) {
  if (!value) return null;
  const parts = value.split(':').map((part) => Number(part));
  if (parts.length !== 2 || parts.some((n) => Number.isNaN(n) || n <= 0)) {
    return null;
  }
  return parts[0] / parts[1];
}

async function resizeBuffers(buffer: Buffer, ratioValue: number | null) {
  const croppedBuffer = await (async () => {
    if (!ratioValue) return buffer;
    const metadata = await sharp(buffer).metadata();
    if (!metadata.width || !metadata.height) return buffer;
    const width = metadata.width;
    const height = metadata.height;
    let cropWidth = width;
    let cropHeight = height;
    if (width / height > ratioValue) {
      cropWidth = Math.round(ratioValue * height);
    } else {
      cropHeight = Math.round(width / ratioValue);
    }
    const left = Math.max(0, Math.round((width - cropWidth) / 2));
    const top = Math.max(0, Math.round((height - cropHeight) / 2));
    return sharp(buffer)
      .extract({ left, top, width: cropWidth, height: cropHeight })
      .toBuffer();
  })();

  const smallBuffer = await sharp(croppedBuffer)
    .resize(300, 300, { fit: 'cover' })
    .jpeg({ quality: 80 })
    .toBuffer();

  const largeResizeArgs: sharp.ResizeOptions = ratioValue
    ? {
        width: 900,
        height: Math.max(1, Math.round(900 / ratioValue)),
        fit: 'fill',
      }
    : { width: 900, fit: 'inside' };

  const largeBuffer = await sharp(croppedBuffer)
    .resize(largeResizeArgs)
    .jpeg({ quality: 85 })
    .toBuffer();

  return { smallBuffer, largeBuffer, croppedBuffer };
}

export async function POST(req: NextRequest) {
  try {
    await ensureTable();

    const form = await req.formData();
    const file = form.get('file') as File | null;
    const mode = (form.get('mode') as string) || 'single';
    const cropRatio = (form.get('cropRatio') as string) || null;
    const name = (form.get('name') as string) || file?.name || 'image';
    const imageId = (form.get('imageId') as string) || null;

    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ratioValue = parseRatio(cropRatio);

    const basePath = `test-images/${randomUUID()}`;
    const timestamp = Date.now();
    const fileName = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9_.-]/g, '')}`;
    const originalPath = `${basePath}/original/${fileName}`;
    const smallPath = `${basePath}/small/${fileName}`;
    const largePath = `${basePath}/large/${fileName}`;

    const originalUrl = await uploadPublicImage(originalPath, buffer, {
      contentType: file.type || 'image/jpeg',
      upsert: true,
    });

    const { smallBuffer, largeBuffer } = await resizeBuffers(buffer, ratioValue);
    const smallUrl = await uploadPublicImage(smallPath, smallBuffer, {
      contentType: 'image/jpeg',
      upsert: true,
    });
    const largeUrl = await uploadPublicImage(largePath, largeBuffer, {
      contentType: 'image/jpeg',
      upsert: true,
    });

    const id = imageId || randomUUID();

    await query(
      `
        INSERT INTO test_images (
          id,
          name,
          original_url,
          small_url,
          large_url,
          original_public_url,
          small_public_url,
          large_public_url,
          crop_ratio,
          mode,
          created_at,
          updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          original_url = EXCLUDED.original_url,
          small_url = EXCLUDED.small_url,
          large_url = EXCLUDED.large_url,
          original_public_url = EXCLUDED.original_public_url,
          small_public_url = EXCLUDED.small_public_url,
          large_public_url = EXCLUDED.large_public_url,
          crop_ratio = EXCLUDED.crop_ratio,
          mode = EXCLUDED.mode,
          updated_at = NOW()
      `,
      [
        id,
        name,
        originalUrl,
        smallUrl,
        largeUrl,
        originalUrl.publicUrl,
        smallUrl.publicUrl,
        largeUrl.publicUrl,
        cropRatio,
        mode,
      ]
    );

    const { rows } = await query('SELECT * FROM test_images WHERE id = $1', [id]);
    return NextResponse.json({ image: rows[0] });
  } catch (error: any) {
    console.error('Test image upload failed', error);
    return NextResponse.json(
      { error: error?.message || 'Upload failed' },
      { status: 500 }
    );
  }
}

