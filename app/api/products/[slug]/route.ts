import { NextResponse } from 'next/server';
import { getProductBySlug } from '@/services/products';

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;

    const result = await getProductBySlug(slug);

    if (!result) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Failed to fetch product:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch product' },
      { status: 500 }
    );
  }
}
