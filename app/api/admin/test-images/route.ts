import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { deletePublicImage, getPresignedUrl } from '@/lib/railway/storage';

export async function GET() {
  try {
    const { rows } = await query(`
      SELECT * FROM test_images
      ORDER BY created_at DESC
    `);
    const parsePath = (value: string | null | undefined): string | null => {
      if (!value) return null;
      try {
        const parsed = JSON.parse(value);
        return parsed?.path ?? null;
      } catch {
        return null;
      }
    };

    const signedRows = await Promise.all(
      rows.map(async (row: any) => {
        const originalPath = parsePath(row.original_url);
        const smallPath = parsePath(row.small_url);
        const largePath = parsePath(row.large_url);
        const signed = await Promise.all([
          originalPath ? getPresignedUrl(originalPath) : null,
          smallPath ? getPresignedUrl(smallPath) : null,
          largePath ? getPresignedUrl(largePath) : null,
        ]);

        return {
          ...row,
          signed_urls: {
            original: signed[0],
            small: signed[1],
            large: signed[2],
          },
        };
      })
    );

    return NextResponse.json({ images: signedRows });
  } catch (error: any) {
    console.error('Failed to load test images', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to load images' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { imageId } = await req.json();
    if (!imageId) {
      return NextResponse.json({ error: 'imageId is required' }, { status: 400 });
    }
    const { rows } = await query('SELECT original_url, small_url, large_url FROM test_images WHERE id = $1', [imageId]);
    await query('DELETE FROM test_images WHERE id = $1', [imageId]);
    const parsePath = (value: string | null | undefined): string | null => {
      if (!value) return null;
      try {
        const parsed = JSON.parse(value);
        return parsed?.path ?? null;
      } catch {
        return null;
      }
    };
    const record = rows?.[0];
    if (record) {
      const paths = [
        parsePath(record.original_url),
        parsePath(record.small_url),
        parsePath(record.large_url),
      ].filter((p): p is string => Boolean(p));
      await Promise.all(
        paths.map((path) => deletePublicImage(path).catch((err) => console.warn('Failed to delete bucket file', err)))
      );
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete test image', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to delete image' },
      { status: 500 }
    );
  }
}

