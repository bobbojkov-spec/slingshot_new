import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { OAuth2Client } from 'google-auth-library';
import {
    buildSessionData,
    ensureAdminTables,
    getAdminUserByEmail,
    SESSION_COOKIE_NAME,
    SESSION_MAX_AGE_SECONDS,
} from '@/lib/auth/admin-login';
import { isEmailAllowlisted } from '@/lib/auth/admin-allowlist';

export const runtime = 'nodejs';

const INVALID_RESP = { status: 401 };

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const credential = body?.credential?.toString();
        const deviceId = body?.deviceId;

        if (!credential || !deviceId) {
            return NextResponse.json(
                { error: 'credential and deviceId are required' },
                { status: 400 }
            );
        }

        const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_GOOGLE_CLIENT_ID;
        if (!clientId) {
            return NextResponse.json(
                { error: 'Google client ID is not configured' },
                { status: 500 }
            );
        }

        const client = new OAuth2Client(clientId);
        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: clientId,
        });

        const payload = ticket.getPayload();
        const email = payload?.email?.toLowerCase();
        const name = payload?.name || payload?.given_name || null;

        if (!email) {
            return NextResponse.json({ error: 'Email is missing' }, INVALID_RESP);
        }

        if (!isEmailAllowlisted(email)) {
            return NextResponse.json(
                { error: 'Email is not allowlisted' },
                INVALID_RESP
            );
        }

        await ensureAdminTables();
        const admin = await getAdminUserByEmail(email);
        if (!admin || !admin.is_active) {
            return NextResponse.json(
                { error: 'Admin not found or inactive' },
                INVALID_RESP
            );
        }

        const cookieStore = await cookies();
        const sessionData = buildSessionData(
            {
                ...admin,
                name: admin.name ?? name,
                role: admin.role ?? 'admin',
            },
            deviceId
        );

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
            user: {
                id: admin.id,
                email: admin.email,
                name: admin.name ?? name,
                role: admin.role,
            },
        });
    } catch (error: any) {
        console.error('google login error:', error);
        return NextResponse.json(
            { error: 'Failed to log in', details: error?.message || 'Unknown error' },
            { status: 500 }
        );
    }
}