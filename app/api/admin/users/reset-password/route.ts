import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import bcrypt from 'bcryptjs';

export const runtime = 'nodejs';

function requireSuperAdmin(req: Request) {
  const role = req.headers.get('x-admin-role');
  if (!role || role !== 'super_admin') {
    return NextResponse.json({ success: false, error: 'Unauthorized: Super admin access required' }, { status: 401 });
  }
  return null;
}

export async function POST(req: Request) {
  try {
    const guard = requireSuperAdmin(req);
    if (guard) return guard;

    const { id, new_password } = await req.json();
    if (!id || !new_password) {
      return NextResponse.json({ success: false, error: 'user_id and new_password are required' }, { status: 400 });
    }
    if (typeof new_password !== 'string' || new_password.length < 8) {
      return NextResponse.json({ success: false, error: 'new_password must be at least 8 characters' }, { status: 400 });
    }

    const password_hash = await bcrypt.hash(new_password, 12);

    const { error } = await supabaseAdmin
      .from('admin_users')
      .update({ password_hash, password_updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ success: false, error: err?.message || 'Internal error' }, { status: 500 });
  }
}

