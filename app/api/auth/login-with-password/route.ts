import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  buildSessionData,
  createLoginCode,
  cleanupExpiredLoginCodes,
  generateCode,
  getAdminUserByEmail,
  getCodeExpiry,
  hashCode,
  isDeviceVerified,
  shouldUseDeviceVerification,
  SESSION_MAX_AGE_SECONDS,
  SESSION_COOKIE_NAME,
} from '@/lib/auth/admin-login';
import { sendLoginCodeEmail } from '@/lib/email/send';
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

    await ensureFirstAdmin(email, password);
    const admin = await getAdminUserByEmail(email);
    if (!admin || !admin.is_active) {
      return NextResponse.json(
        { error: 'Admin not found or inactive' },
        INVALID_ADMIN_RESP
      );
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

    if (!shouldUseDeviceVerification()) {
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
    }

    const alreadyVerified = await isDeviceVerified(admin.email, deviceId);

    if (alreadyVerified) {
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
    }

    const code = generateCode();
    const codeHash = hashCode(code);
    const expiresAt = getCodeExpiry();

    await createLoginCode(admin.email, deviceId, codeHash, expiresAt);
    await cleanupExpiredLoginCodes();

    let emailSent = false;
    try {
      await sendLoginCodeEmail(admin.email, code, expiresAt.toISOString());
      emailSent = true;
    } catch (emailError: any) {
      console.warn('Failed to send login code email:', emailError?.message || emailError);
    }

    return NextResponse.json({
      success: true,
      message: emailSent ? 'Verification code sent to your inbox' : 'Verification code generated',
      verified: false,
      requiresVerification: true,
      code: process.env.EXPOSE_LOGIN_CODE === 'true' ? code : undefined,
    });
  } catch (error: any) {
    console.error('login-with-password error:', error);
    return NextResponse.json(
      { error: 'Failed to process login', details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}

