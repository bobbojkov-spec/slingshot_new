import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export const runtime = 'nodejs';

type Payload = {
  email?: string;
  role?: string;
  password?: string;
};

const SITE_URL = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

function isValidEmail(email: string) {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
}

async function isBootstrapMode() {
  const { data, error } = await supabaseAdmin
    .from('admin_profiles')
    .select('user_id', { count: 'exact', head: true })
    .eq('role', 'super_admin')
    .eq('is_active', true);
  if (error) throw error;
  return (data?.length ?? 0) === 0;
}

function requireAdmin(req: Request) {
  const role = req.headers.get('x-admin-role');
  if (!role || (role !== 'admin' && role !== 'super_admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

export async function POST(req: Request) {
  try {
    const { email, role, password }: Payload = await req.json();

    if (!email || !password || !role) {
      return NextResponse.json({ error: 'Email, role, and password are required' }, { status: 400 });
    }
    const emailNorm = email.toLowerCase().trim();
    if (!isValidEmail(emailNorm)) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }
    if (role !== 'admin' && role !== 'super_admin') {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Allow first-time bootstrap without header, otherwise require admin/super_admin header
    const bootstrap = await isBootstrapMode();
    if (!bootstrap) {
      const guard = requireAdmin(req);
      if (guard) return guard;
    }

    // Create Supabase Auth user (Supabase handles hashing)
    const { data: created, error: authErr } = await supabaseAdmin.auth.admin.createUser({
      email: emailNorm,
      password,
      email_confirm: true,
    });
    if (authErr || !created?.user) {
      return NextResponse.json({ error: authErr?.message || 'Failed to create auth user' }, { status: 500 });
    }

    const userId = created.user.id;

    // Insert admin profile
    const { data: profile, error: profErr } = await supabaseAdmin
      .from('admin_profiles')
      .insert({
        user_id: userId,
        email: emailNorm,
        role,
        is_active: true,
        activated_at: new Date().toISOString(),
        created_by: null,
      })
      .select('user_id, email, role, is_active, created_at')
      .single();

    if (profErr) {
      return NextResponse.json({ error: profErr.message }, { status: 500 });
    }

    // Optionally send invite email so the user gets a link (even though we set email_confirm=true)
    await supabaseAdmin.auth.admin.inviteUserByEmail(emailNorm, {
      redirectTo: `${SITE_URL}/admin/activate`,
    }).catch(() => {});

    return NextResponse.json({
      user: {
        id: userId,
        email: profile.email,
        role: profile.role,
        is_active: profile.is_active,
      },
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err?.message || 'Internal error' }, { status: 500 });
  }
}

