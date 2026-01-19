import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ success: false, error: 'user_id is required' }, { status: 400 });

    // Fetch target user to know role
    const { rows } = await query('SELECT id, role FROM admin_users WHERE id = $1', [id]);
    const targetUser = rows[0];

    if (!targetUser) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Prevent deactivating last active super_admin
    if (targetUser.role === 'super_admin') {
      const countRes = await query(
        'SELECT COUNT(*) FROM admin_users WHERE role = $1 AND is_active = true',
        ['super_admin']
      );
      const count = parseInt(countRes.rows[0].count);

      if (count <= 1) {
        return NextResponse.json(
          { success: false, error: 'Cannot deactivate the last active super_admin' },
          { status: 400 }
        );
      }
    }

    await query('UPDATE admin_users SET is_active = false, updated_at = now() WHERE id = $1', [id]);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ success: false, error: err?.message || 'Internal error' }, { status: 500 });
  }
}

