import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  buildSessionData,
  getAdminUserByEmail,
  SESSION_MAX_AGE_SECONDS,
  SESSION_COOKIE_NAME,
  ensureAdminTables,
} from '@/lib/auth/admin-login';
import { ensureFirstAdmin } from '@/lib/auth/admin-login';

export const runtime = 'nodejs';

const MISSING_PAYLOAD_RESP = { status: 400 };
const INVALID_ADMIN_RESP = { status: 401 };

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = (body?.email || '').toString().trim().toLowerCase();
    const deviceId = body?.deviceId;
    const password = body?.password?.toString();

    if (!email || !deviceId) {
      return NextResponse.json(
        { error: 'Email and deviceId are required' },
        MISSING_PAYLOAD_RESP
      );
    }

    console.log('[login] Starting login for:', email);

    try {
      await ensureAdminTables();
      console.log('[login] Tables ensured');
    } catch (tableErr: any) {
      console.error('[login] ensureAdminTables failed:', tableErr.message);
      throw tableErr;
    }

    try {
      await ensureFirstAdmin(email, password);
      console.log('[login] First admin check done');
    } catch (adminErr: any) {
      console.error('[login] ensureFirstAdmin failed:', adminErr.message);
      throw adminErr;
    }

    const admin = await getAdminUserByEmail(email);
    console.log('[login] Admin found:', !!admin);

    if (!admin || !admin.is_active) {
      return NextResponse.json(
        { error: 'Admin not found or inactive' },
        INVALID_ADMIN_RESP
      );
    }

    if (admin.password_hash) {
      const { verifyPassword } = await import('@/lib/auth/admin-login');
      const isValid = await verifyPassword(password || '', admin.password_hash);
      if (!isValid) {
        return NextResponse.json(
          { error: 'Invalid password' },
          INVALID_ADMIN_RESP
        );
      }
    }

    const cookieStore = await cookies();
    const sessionData = buildSessionData(admin, deviceId);

    const storeSession = () => {
      cookieStore.set(SESSION_COOKIE_NAME, JSON.stringify(sessionData), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: SESSION_MAX_AGE_SECONDS,
        path: '/',
      });
    };

    storeSession();
    return NextResponse.json({
      success: true,
      message: 'Logged in successfully',
      verified: true,
      user: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
    });
  } catch (error: any) {
    console.error('login-with-password error:', error);
    return NextResponse.json(
      { error: 'Failed to process login', details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}

