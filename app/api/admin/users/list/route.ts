import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const result = await query(
      `SELECT id as user_id, email, name, role, is_active, created_at, last_login_at
       FROM admin_users
       ORDER BY created_at DESC`
    );
    return NextResponse.json({ users: result.rows });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err?.message || 'Internal error' }, { status: 500 });
  }
}

