import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from '@/lib/auth/admin-login';
import { isEmailAllowlisted } from '@/lib/auth/admin-allowlist';

export const runtime = 'nodejs';

const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_SIMPLE_PASSWORD || 'superadmin';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const password = (body?.password || '').toString();

        if (!password) {
            return NextResponse.json({ error: 'Password is required' }, { status: 400 });
        }

        if (password !== DEFAULT_ADMIN_PASSWORD) {
            return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
        }

        if (!isEmailAllowlisted('admin@local')) {
            return NextResponse.json({ error: 'Email is not allowlisted' }, { status: 401 });
        }

        const cookieStore = await cookies();
        cookieStore.set(
            SESSION_COOKIE_NAME,
            JSON.stringify({
                userId: 'local-admin',
                email: 'admin@local',
                name: 'Local Admin',
                role: 'admin',
                deviceId: 'local',
            }),
            {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: SESSION_MAX_AGE_SECONDS,
                path: '/',
            }
        );

        return NextResponse.json({ success: true, message: 'Logged in successfully' });
    } catch (error: any) {
        console.error('simple-login error:', error);
        return NextResponse.json(
            { error: 'Failed to log in', details: error?.message || 'Unknown error' },
            { status: 500 }
        );
    }
}