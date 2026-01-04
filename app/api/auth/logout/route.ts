import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME } from '@/lib/auth/admin-login';

export const runtime = 'nodejs';

export async function POST() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);

    return NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error: any) {
    console.error('logout error:', error);
    return NextResponse.json(
      { error: 'Failed to log out', details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}

