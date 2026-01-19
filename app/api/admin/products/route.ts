import { NextResponse } from 'next/server';
import { getAdminProductsList } from '@/lib/products-admin';

export async function GET() {
  try {
    const assembled = await getAdminProductsList();
    return NextResponse.json({ products: assembled });
  } catch (error: any) {
    console.error('Failed to load admin products', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to load products' },
      { status: 500 }
    );
  }
}


