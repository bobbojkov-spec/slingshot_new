import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const { rows } = await query(`
      SELECT * FROM test_images
      ORDER BY created_at DESC
    `);
    return NextResponse.json({ images: rows });
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
    await query('DELETE FROM test_images WHERE id = $1', [imageId]);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete test image', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to delete image' },
      { status: 500 }
    );
  }
}

