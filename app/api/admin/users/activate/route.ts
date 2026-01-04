import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

function requireAdmin(req: Request) {
  const role = req.headers.get('x-admin-role');
  if (!role || (role !== 'admin' && role !== 'super_admin')) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

export async function POST(req: Request) {
  try {
    const guard = requireAdmin(req);
    if (guard) return guard;

    const { id } = await req.json();
    if (!id) return NextResponse.json({ success: false, error: 'user_id is required' }, { status: 400 });

    const { error } = await supabaseAdmin.from('admin_users').update({ is_active: true }).eq('id', id);
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ success: false, error: err?.message || 'Internal error' }, { status: 500 });
  }
}

