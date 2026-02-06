import { Resend } from 'resend';
import dotenv from 'dotenv';
import type { InquiryItemInput } from '@/lib/inquiries';

dotenv.config();

const ADMIN_INQUIRY_EMAIL = 'bob.bojkov@gmail.com';

const resendApiKey = process.env.RESEND_API_KEY;
const resendFrom = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
const resendClient = resendApiKey ? new Resend(resendApiKey) : null;

export type InquiryEmailPayload = {
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

async function sendWithResend(to: string[], subject: string, payload: InquiryEmailPayload) {
  if (!resendClient) return false;
  const { text, html } = buildInquiryEmail(payload);
  const { error } = await resendClient.emails.send({
    from: resendFrom,
    to,
    subject,
    text,
    html,
  });
  if (error) throw new Error(error.message || 'Resend send failed');
  return true;
}

export async function sendInquiryEmail(payload: InquiryEmailPayload) {
  if (!resendClient) {
    console.warn('Resend is not configured for inquiry email.');
    return;
  }

  try {
    await sendWithResend(
      [ADMIN_INQUIRY_EMAIL],
      `New inquiry from ${payload.name}`,
      payload
    );
    await sendWithResend(
      [payload.email],
      `We received your inquiry (${payload.inquiryId})`,
      payload
    );
  } catch (err) {
    console.warn('Resend inquiry email failed:', (err as any)?.message || err);
  }
}