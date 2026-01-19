import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ success: false, error: 'user_id is required' }, { status: 400 });

    const result = await query('UPDATE admin_users SET is_active = true, updated_at = now() WHERE id = $1', [id]);

    if (result.rowCount === 0) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ success: false, error: err?.message || 'Internal error' }, { status: 500 });
  }
}

