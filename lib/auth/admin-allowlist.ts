import { query } from '@/lib/db';

const ALLOWLIST_SPLIT_REGEX = /[\s,]+/;

export function parseAllowlist(raw: string): string[] {
    return raw
        .split(ALLOWLIST_SPLIT_REGEX)
        .map((entry) => entry.trim().toLowerCase())
        .filter(Boolean);
}

export function getAdminAllowlist(): string[] {
    const raw = process.env.ADMIN_EMAIL_ALLOWLIST || '';
    return parseAllowlist(raw);
}

export async function getAdminAllowlistFromDB(): Promise<string[]> {
    try {
        const { rows } = await query(
            `SELECT value FROM app_settings WHERE key = 'admin_email_allowlist' LIMIT 1`
        );
        if (rows.length > 0 && rows[0].value) {
            return parseAllowlist(rows[0].value);
        }
        // Fallback to env variable
        return getAdminAllowlist();
    } catch {
        return getAdminAllowlist();
    }
}

export function shouldRequireAllowlist(): boolean {
    return process.env.ADMIN_REQUIRE_ALLOWLIST === 'true';
}

export function isEmailAllowlisted(email?: string | null): boolean {
    const normalized = (email || '').trim().toLowerCase();
    if (!normalized) return false;
    const allowlist = getAdminAllowlist();
    if (!shouldRequireAllowlist()) {
        return allowlist.length === 0 || allowlist.includes(normalized);
    }
    return allowlist.includes(normalized);
}