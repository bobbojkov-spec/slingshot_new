import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import type { InquiryItemInput } from '@/lib/inquiries';

dotenv.config();

const ADMIN_INQUIRY_EMAIL = 'bob.bojkov@gmail.com';

const resendApiKey = process.env.RESEND_API_KEY;
const resendFrom = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
const resendClient = resendApiKey ? new Resend(resendApiKey) : null;

const smtpHost = process.env.SMTP_HOST;
const smtpPort = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const smtpSecure = (process.env.SMTP_SECURE || 'false').toLowerCase() === 'true';
const smtpFrom = process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@example.com';

type InquiryEmailPayload = {
  inquiryId: string;
  name: string;
  email: string;
  phone: string;
  message?: string | null;
  items: InquiryItemInput[];
};

function buildInquiryEmail(payload: InquiryEmailPayload) {
  const items = payload.items
    .map((item) => {
      const details = [item.product_name, item.size, item.color]
        .filter(Boolean)
        .join(' / ');
      return `• ${details} (qty: ${item.quantity})`;
    })
    .join('\n');

  const text = `New inquiry received (ID: ${payload.inquiryId})\n\n` +
    `Name: ${payload.name}\n` +
    `Email: ${payload.email}\n` +
    `Phone: ${payload.phone}\n` +
    `Message: ${payload.message || '-'}\n\n` +
    `Items:\n${items || 'No items.'}`;

  const htmlItems = payload.items
    .map((item) => {
      const details = [item.product_name, item.size, item.color]
        .filter(Boolean)
        .join(' / ');
      return `<li>${details} (qty: ${item.quantity})</li>`;
    })
    .join('');

  const html = `
    <h2>New inquiry received</h2>
    <p><strong>ID:</strong> ${payload.inquiryId}</p>
    <p><strong>Name:</strong> ${payload.name}</p>
    <p><strong>Email:</strong> ${payload.email}</p>
    <p><strong>Phone:</strong> ${payload.phone}</p>
    <p><strong>Message:</strong> ${payload.message || '-'}</p>
    <h3>Items</h3>
    <ul>${htmlItems || '<li>No items.</li>'}</ul>
  `;

  return { text, html };
}

async function sendWithResend(payload: InquiryEmailPayload) {
  if (!resendClient) return false;
  const { text, html } = buildInquiryEmail(payload);
  const { error } = await resendClient.emails.send({
    from: resendFrom,
    to: [ADMIN_INQUIRY_EMAIL],
    subject: `New inquiry from ${payload.name}`,
    text,
    html,
  });
  if (error) throw new Error(error.message || 'Resend send failed');
  return true;
}

async function sendWithSmtp(payload: InquiryEmailPayload) {
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
  const { text, html } = buildInquiryEmail(payload);
  await transporter.sendMail({
    from: smtpFrom,
    to: ADMIN_INQUIRY_EMAIL,
    subject: `New inquiry from ${payload.name}`,
    text,
    html,
  });
  return true;
}

export async function sendInquiryEmail(payload: InquiryEmailPayload) {
  try {
    const viaResend = await sendWithResend(payload);
    if (viaResend) return;
  } catch (err) {
    console.warn('Resend inquiry email failed, trying SMTP:', (err as any)?.message || err);
  }

  const viaSmtp = await sendWithSmtp(payload);
  if (viaSmtp) return;

  console.warn('No email transport configured for inquiry email.');
}