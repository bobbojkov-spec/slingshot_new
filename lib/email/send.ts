import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import { ensureEnv } from '@/lib/env';

ensureEnv();

// Resend sandbox defaults — no custom domain/DNS required.
const resendApiKey = process.env.RESEND_API_KEY;
const resendFrom = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
const resendClient = resendApiKey ? new Resend(resendApiKey) : null;

// Optional SMTP fallback (only used if Resend is not configured/available).
const smtpHost = process.env.SMTP_HOST;
const smtpPort = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const smtpSecure = (process.env.SMTP_SECURE || 'false').toLowerCase() === 'true';
const smtpFrom = process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@example.com';

function buildEmailPayload(code: string, expiresAt: string) {
  const text = `Your admin login code is: ${code}\nIt expires at: ${expiresAt}\n\nIf you did not request this, you can ignore this email.`;
  const html = `<p>Your admin login code is: <strong>${code}</strong></p><p>It expires at: ${expiresAt}</p><p>If you did not request this, you can ignore this email.</p>`;
  return { text, html };
}

async function sendWithResend(to: string, code: string, expiresAt: string) {
  if (!resendClient) return false;

  const { text, html } = buildEmailPayload(code, expiresAt);
  const { error } = await resendClient.emails.send({
    from: resendFrom,
    to: [to],
    subject: 'Your admin login code',
    text,
    html,
  });

  if (error) {
    throw new Error(error.message || 'Resend send failed');
  }
  return true;
}

async function sendWithSmtp(to: string, code: string, expiresAt: string) {
  if (!smtpHost || !smtpUser || !smtpPass) return false;

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  const { text, html } = buildEmailPayload(code, expiresAt);

  await transporter.sendMail({
    from: smtpFrom,
    to,
    subject: 'Your admin login code',
    text,
    html,
  });
  return true;
}

export async function sendLoginCodeEmail(to: string, code: string, expiresAt: string) {
  const hasResend = !!resendClient;
  const hasSmtp = !!(smtpHost && smtpUser && smtpPass);

  if (!hasResend) {
    console.warn('sendLoginCodeEmail: Resend not configured (check RESEND_API_KEY / RESEND_FROM_EMAIL)');
  }
  if (!hasSmtp) {
    console.warn('sendLoginCodeEmail: SMTP not configured (missing SMTP_HOST/SMTP_USER/SMTP_PASS)');
  }
  console.log('sendLoginCodeEmail env snapshot', {
    resendKey: resendApiKey ? `set:${resendApiKey.slice(0, 6)}***` : 'missing',
    resendFrom,
    smtpHost: smtpHost ? 'set' : 'missing',
  });

  // Prefer Resend when configured (great for dev); fall back to SMTP if available.
  try {
    const viaResend = await sendWithResend(to, code, expiresAt);
    if (viaResend) return;
  } catch (err) {
    console.warn('Resend email failed, will try SMTP next:', (err as any)?.message || err);
  }

  const viaSmtp = await sendWithSmtp(to, code, expiresAt);
  if (viaSmtp) return;

  throw new Error('No email transport configured (set RESEND_* or SMTP_* env vars).');
}

