import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { id, slug } = await req.json();

    if (!id || !slug) {
      return NextResponse.json({ error: 'id and slug are required' }, { status: 400 });
    }

    await query('UPDATE products SET slug = $1 WHERE id = $2', [slug, id]);

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    // Handle missing env vars or other initialization errors
    return NextResponse.json(
      { error: err?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

