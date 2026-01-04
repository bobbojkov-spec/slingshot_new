import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  buildSessionData,
  getAdminUserByEmail,
  isDeviceVerified,
  shouldUseDeviceVerification,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
} from '@/lib/auth/admin-login';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = (body?.email || '').toString().trim().toLowerCase();
    const deviceId = body?.deviceId;

    if (!email || !deviceId) {
      return NextResponse.json(
        { error: 'Email and deviceId are required' },
        { status: 400 }
      );
    }

    const user = await getAdminUserByEmail(email);
    if (!user || !user.is_active) {
      return NextResponse.json({ error: 'Admin user not found' }, { status: 404 });
    }

    if (shouldUseDeviceVerification()) {
      const verified = await isDeviceVerified(user.email, deviceId);
      if (!verified) {
        return NextResponse.json(
          { error: 'Device not verified. Please complete verification first.' },
          { status: 403 }
        );
      }
    }

    const cookieStore = await cookies();
    const sessionData = buildSessionData(user, deviceId);
    cookieStore.set(SESSION_COOKIE_NAME, JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_MAX_AGE_SECONDS,
      path: '/',
    });

    return NextResponse.json({
      success: true,
      message: 'Logged in successfully',
      verified: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error('login error:', error);
    return NextResponse.json(
      { error: 'Failed to log in', details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}

