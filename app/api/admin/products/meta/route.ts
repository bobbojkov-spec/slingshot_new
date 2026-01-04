import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const { rows: categories = [] } = await query('SELECT id, name FROM categories ORDER BY name');
    const { rows: typesRows = [] } = await query(
      "SELECT DISTINCT product_type FROM products WHERE product_type IS NOT NULL ORDER BY product_type"
    );

    const productTypes = Array.from(
      new Set(typesRows.map((row: any) => (row.product_type || '').toString().trim()).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b));

    return NextResponse.json({ categories, productTypes });
  } catch (error: any) {
    console.error('Unable to fetch admin product meta', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to load metadata' },
      { status: 500 }
    );
  }
}


