import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { id, new_password } = await req.json();
    if (!id || !new_password) {
      return NextResponse.json({ success: false, error: 'user_id and new_password are required' }, { status: 400 });
    }
    if (typeof new_password !== 'string' || new_password.length < 8) {
      return NextResponse.json({ success: false, error: 'new_password must be at least 8 characters' }, { status: 400 });
    }

    const password_hash = await bcrypt.hash(new_password, 12);

    const result = await query(
      `UPDATE admin_users 
       SET password_hash = $1, updated_at = now() 
       WHERE id = $2`,
      [password_hash, id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ success: false, error: err?.message || 'Internal error' }, { status: 500 });
  }
}

