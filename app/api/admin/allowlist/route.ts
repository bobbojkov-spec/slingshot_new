import { NextResponse } from 'next/server';
import { getAdminAllowlist, shouldRequireAllowlist } from '@/lib/auth/admin-allowlist';

export async function GET() {
    return NextResponse.json({
        allowlist: getAdminAllowlist(),
        requireAllowlist: shouldRequireAllowlist(),
    });
}