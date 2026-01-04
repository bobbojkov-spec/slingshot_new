import { NextRequest, NextResponse } from 'next/server';
import {
  cleanupExpiredLoginCodes,
  getAdminUserByEmail,
  getValidLoginCode,
  hashCode,
  markLoginCodeUsed,
  shouldUseDeviceVerification,
} from '@/lib/auth/admin-login';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = (body?.email || '').toString().trim().toLowerCase();
    const deviceId = body?.deviceId;
    const code = body?.code;

    if (!email || !deviceId || !code) {
      return NextResponse.json(
        { error: 'Email, deviceId, and code are required' },
        { status: 400 }
      );
    }

    if (!shouldUseDeviceVerification()) {
      return NextResponse.json({
        success: true,
        message: 'Device verification is disabled',
        disabled: true,
      });
    }

    const user = await getAdminUserByEmail(email);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const hashedCode = hashCode(code);

    const target = await getValidLoginCode(email, deviceId, hashedCode);
    if (!target) {
      return NextResponse.json({ error: 'Invalid or expired code' }, { status: 400 });
    }

    await markLoginCodeUsed(target.id);
    await cleanupExpiredLoginCodes();

    return NextResponse.json({
      success: true,
      message: 'Device verified successfully',
    });
  } catch (error: any) {
    console.error('verify-code error:', error);
    return NextResponse.json(
      { error: 'Failed to verify code', details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}

