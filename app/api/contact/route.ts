import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;
const resendFrom = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
const ADMIN_CONTACT_EMAIL = 'bob.bojkov@gmail.com';
const resendClient = resendApiKey ? new Resend(resendApiKey) : null;

export async function POST(req: NextRequest) {
    try {
        if (!resendClient) {
            throw new Error('Resend is not configured');
        }

        const { name, email, phone, message } = await req.json();

        if (!name || !email || !message) {
            return NextResponse.json(
                { ok: false, error: 'Name, email, and message are required' },
                { status: 400 }
            );
        }

        // Send to Admin
        const { error: adminError } = await resendClient.emails.send({
            from: resendFrom,
            to: [ADMIN_CONTACT_EMAIL],
            subject: `New Contact Form Message from ${name}`,
            text: `Name: ${name}\nEmail: ${email}\nPhone: ${phone || 'N/A'}\n\nMessage:\n${message}`,
            html: `
                <h2>New Contact Form Message</h2>
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Phone:</strong> ${phone || 'N/A'}</p>
                <p><strong>Message:</strong></p>
                <p>${message.replace(/\n/g, '<br/>')}</p>
            `,
        });

        if (adminError) throw new Error(adminError.message);

        // Send confirmation to User
        await resendClient.emails.send({
            from: resendFrom,
            to: [email],
            subject: `We received your message, ${name}`,
            text: `Hi ${name},\n\nThank you for reaching out to Slingshot Bulgaria. We have received your message and will get back to you soon.\n\nYour message:\n${message}`,
            html: `
                <h2>Message Received</h2>
                <p>Hi ${name},</p>
                <p>Thank you for reaching out to Slingshot Bulgaria. We have received your message and will get back to you soon.</p>
                <p><strong>Your message:</strong></p>
                <p style="color: #666; font-style: italic;">${message.replace(/\n/g, '<br/>')}</p>
                <p>Best regards,<br/>Slingshot Bulgaria Team</p>
            `,
        });

        return NextResponse.json({ ok: true });
    } catch (error: any) {
        console.error('Contact form API error:', error);
        return NextResponse.json(
            { ok: false, error: error.message || 'Failed to send message' },
            { status: 500 }
        );
    }
}
