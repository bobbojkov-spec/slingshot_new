import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';

export const SESSION_COOKIE_NAME = 'admin_session';
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

export interface AdminUserRecord {
    id: string;
    email: string;
    name?: string | null;
    role?: string | null;
    is_active: boolean;
  }

export interface AdminSessionData {
  userId: string;
  email: string;
  name: string | null;
  role: string;
  deviceId: string;
}

const CODE_TTL_MINUTES = 10;
const VERIFY_ENV_FLAG = process.env.ADMIN_DEVICE_VERIFICATION_ENABLED === 'true';

export function shouldUseDeviceVerification(): boolean {
  return VERIFY_ENV_FLAG;
}

export function hashCode(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex');
}

export function buildSessionData(user: AdminUserRecord, deviceId: string): AdminSessionData {
  return {
    userId: user.id,
    email: user.email,
    name: user.name ?? null,
    role: user.role ?? 'admin',
    deviceId,
  };
}

export const DEV_BOOTSTRAP_ENABLED = process.env.DEV_ADMIN_BOOTSTRAP === 'true';

export async function getAdminUserByEmail(email: string): Promise<AdminUserRecord | null> {
    const lowerEmail = email.toLowerCase().trim();
    const result = await query(
      `SELECT id, email, is_active
       FROM admin_users
       WHERE lower(email) = $1
       LIMIT 1`,
      [lowerEmail]
    );
    return result.rows[0] ?? null;
  }

export async function isDeviceVerified(email: string, deviceId: string): Promise<boolean> {
  try {
    const result = await query(
      `SELECT 1
       FROM admin_login_codes
       WHERE lower(email) = $1
         AND device_fingerprint = $2
         AND used_at IS NOT NULL
       LIMIT 1`,
      [email.toLowerCase().trim(), deviceId]
    );
    return (result?.rowCount ?? 0) > 0;
  } catch (error) {
    // When the table is missing, treat as not verified to keep login working.
    console.warn('isDeviceVerified: unable to query admin_login_codes', (error as Error).message);
    return false;
  }
}

export async function createLoginCode(
  email: string,
  deviceId: string,
  codeHash: string,
  expiresAt: Date
): Promise<void> {
  await query(
    `INSERT INTO admin_login_codes (email, code_hash, device_fingerprint, expires_at)
     VALUES ($1, $2, $3, $4)`,
    [email.toLowerCase().trim(), codeHash, deviceId, expiresAt.toISOString()]
  );
}

export async function getValidLoginCode(
  email: string,
  deviceId: string,
  codeHash: string
): Promise<{ id: string } | null> {
  const result = await query(
    `SELECT id
     FROM admin_login_codes
     WHERE lower(email) = $1
       AND device_fingerprint = $2
       AND code_hash = $3
       AND expires_at > now()
       AND used_at IS NULL
     ORDER BY created_at DESC
     LIMIT 1`,
    [email.toLowerCase().trim(), deviceId, codeHash]
  );
  return result.rows[0] ?? null;
}

export async function ensureFirstAdmin(email: string, password?: string): Promise<void> {
  if (process.env.NODE_ENV === 'production') return;
  if (!DEV_BOOTSTRAP_ENABLED) return;

  const { rows } = await query('SELECT COUNT(*) AS cnt FROM admin_users');
  const count = Number(rows[0]?.cnt ?? 0);
  if (count > 0) return;

  const usedPassword = password || process.env.DEV_ADMIN_PASSWORD;
  if (!usedPassword) {
    throw new Error('DEV_ADMIN_BOOTSTRAP requires DEV_ADMIN_PASSWORD or password in request');
  }

  const hashed = await bcrypt.hash(usedPassword, 12);
  await query(
    `INSERT INTO admin_users (id, email, password_hash, is_active, created_at, updated_at)
     VALUES ($1, $2, $3, true, now(), now())`,
    [crypto.randomUUID(), email, hashed]
  );
}

export async function markLoginCodeUsed(id: string): Promise<void> {
  await query(
    `UPDATE admin_login_codes
     SET used_at = now()
     WHERE id = $1`,
    [id]
  );
}

export async function cleanupExpiredLoginCodes(): Promise<void> {
  await query(
    `DELETE FROM admin_login_codes
     WHERE expires_at < now()
       AND used_at IS NULL`
  );
}

export function generateCode(): string {
  return crypto.randomInt(100000, 1_000_000).toString();
}

export function getCodeExpiry(): Date {
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + CODE_TTL_MINUTES);
  return expiresAt;
}

