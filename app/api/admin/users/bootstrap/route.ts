import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export const runtime = 'nodejs';

/**
 * Minimal bootstrap endpoint to create the first admin user (local use only).
 * Assumes the table admin_profiles exists with columns:
 *   user_id (uuid PK), email, role, is_active, created_at, activated_at, created_by, last_login_at, deactivated_at
 *
 * POST body: { email: string, password: string, role?: 'admin' | 'super_admin' }
 * Notes:
 * - Fails if there is already an active super_admin.
 * - Uses Supabase Auth admin API (password is hashed by Supabase).
 */
export async function POST(req: Request) {
  try {
    const { email, password, role }: { email?: string; password?: string; role?: string } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'email and password are required' }, { status: 400 });
    }
    const roleValue = role === 'admin' ? 'admin' : 'super_admin';

    // Block if an active super_admin already exists
    const { data: existingSupers, error: countErr } = await supabaseAdmin
      .from('admin_profiles')
      .select('user_id', { count: 'exact', head: true })
      .eq('role', 'super_admin')
      .eq('is_active', true);
    if (countErr) {
      return NextResponse.json({ error: countErr.message }, { status: 500 });
    }
    if ((existingSupers?.length ?? 0) > 0) {
      return NextResponse.json({ error: 'Active super_admin already exists' }, { status: 400 });
    }

    // Create Supabase Auth user (Supabase handles password hashing)
    const { data: createdUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (createErr || !createdUser?.user) {
      return NextResponse.json({ error: createErr?.message || 'Failed to create auth user' }, { status: 500 });
    }

    const userId = createdUser.user.id;

    // Insert admin profile
    const { error: profErr, data: profile } = await supabaseAdmin
      .from('admin_profiles')
      .insert({
        user_id: userId,
        email,
        role: roleValue,
        is_active: true,
        activated_at: new Date().toISOString(),
        created_by: null,
      })
      .select()
      .single();

    if (profErr) {
      return NextResponse.json({ error: profErr.message }, { status: 500 });
    }

    return NextResponse.json({
      user: {
        id: userId,
        email: createdUser.user.email,
        role: profile.role,
        is_active: profile.is_active,
      },
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err?.message || 'Internal error' }, { status: 500 });
  }
}

