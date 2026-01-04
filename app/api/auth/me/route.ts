import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SESSION_COOKIE_NAME } from '@/lib/auth/admin-login';

export const runtime = 'nodejs';

export async function GET(_request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

    if (!sessionCookie) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    try {
      const sessionData = JSON.parse(sessionCookie.value);
      return NextResponse.json({
        authenticated: true,
        user: {
          id: sessionData.userId,
          email: sessionData.email,
          name: sessionData.name,
          role: sessionData.role,
        },
      });
    } catch (parseError) {
      cookieStore.delete(SESSION_COOKIE_NAME);
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }
  } catch (error: any) {
    console.error('me route error:', error);
    return NextResponse.json(
      { authenticated: false, error: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}

