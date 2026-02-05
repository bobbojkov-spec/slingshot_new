const ALLOWLIST_SPLIT_REGEX = /[\s,]+/;

export function getAdminAllowlist(): string[] {
    const raw = process.env.ADMIN_EMAIL_ALLOWLIST || '';
    return raw
        .split(ALLOWLIST_SPLIT_REGEX)
        .map((entry) => entry.trim().toLowerCase())
        .filter(Boolean);
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