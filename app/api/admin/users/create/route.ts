import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export const runtime = 'nodejs';

type Payload = {
  email?: string;
  role?: string;
  password?: string;
  name?: string;
};

function isValidEmail(email: string) {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
}

export async function POST(req: Request) {
  try {
    const { email, role, password, name }: Payload = await req.json();

    if (!email || !password || !role) {
      return NextResponse.json({ error: 'Email, role, and password are required' }, { status: 400 });
    }
    const emailNorm = email.toLowerCase().trim();
    if (!isValidEmail(emailNorm)) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    // Validate role
    if (!['admin', 'super_admin', 'editor'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Check if user exists
    const existing = await query('SELECT 1 FROM admin_users WHERE lower(email) = $1', [emailNorm]);
    if (existing.rowCount && existing.rowCount > 0) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const userId = crypto.randomUUID();

    const result = await query(
      `INSERT INTO admin_users (id, email, password_hash, role, name, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, true, now(), now())
       RETURNING id, email, role, is_active`,
      [userId, emailNorm, hashedPassword, role, name || null]
    );

    return NextResponse.json({
      user: result.rows[0]
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err?.message || 'Internal error' }, { status: 500 });
  }
}

