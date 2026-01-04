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

    // Fetch target user to know role
    const { data: targetUser, error: targetErr } = await supabaseAdmin
      .from('admin_users')
      .select('id, role')
      .eq('id', id)
      .single();
    if (targetErr) {
      return NextResponse.json({ success: false, error: targetErr.message }, { status: 500 });
    }

    // Prevent deactivating last active super_admin
    if (targetUser?.role === 'super_admin') {
      const { count, error: countErr } = await supabaseAdmin
        .from('admin_users')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'super_admin')
        .eq('is_active', true);
      if (countErr) return NextResponse.json({ success: false, error: countErr.message }, { status: 500 });
      if ((count ?? 0) <= 1) {
        return NextResponse.json(
          { success: false, error: 'Cannot deactivate the last active super_admin' },
          { status: 400 }
        );
      }
    }

    const { error } = await supabaseAdmin.from('admin_users').update({ is_active: false }).eq('id', id);
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ success: false, error: err?.message || 'Internal error' }, { status: 500 });
  }
}

