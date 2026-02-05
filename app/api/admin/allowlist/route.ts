import { NextResponse } from 'next/server';
import { getAdminAllowlist, shouldRequireAllowlist } from '@/lib/auth/admin-allowlist';
import { query } from '@/lib/db';

export async function GET() {
    return NextResponse.json({
        allowlist: getAdminAllowlist(),
        requireAllowlist: shouldRequireAllowlist(),
    });
}

export async function POST(request: Request) {
    try {
        const { emails } = await request.json();

        if (!Array.isArray(emails)) {
            return NextResponse.json({ error: 'Emails must be an array' }, { status: 400 });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const validEmails = emails
            .map((e: string) => e.trim().toLowerCase())
            .filter((e: string) => e && emailRegex.test(e));

        // Store in database (create a settings table entry or use existing)
        // For now, we'll store in a simple key-value table
        await query(
            `INSERT INTO app_settings (key, value)
             VALUES ('admin_email_allowlist', $1)
             ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = NOW()`,
            [validEmails.join(',')]
        );

        return NextResponse.json({
            success: true,
            allowlist: validEmails,
            message: 'Allowlist updated successfully'
        });
    } catch (error: any) {
        console.error('Failed to update allowlist:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to update allowlist' },
            { status: 500 }
        );
    }
}