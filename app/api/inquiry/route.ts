import { NextResponse } from 'next/server';
import { createInquiry } from '@/lib/inquiries';
import { sendInquiryEmail } from '@/lib/inquiries-email';

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const inquiry = await createInquiry(payload);

    await sendInquiryEmail({
      inquiryId: inquiry.id,
      name: inquiry.customer_name,
      email: inquiry.customer_email,
      phone: inquiry.customer_phone,
      message: inquiry.customer_message,
      items: payload.items || []
    });

    return NextResponse.json({ success: true, inquiryId: inquiry.id });
  } catch (error: any) {
    console.error('Failed to create inquiry', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to create inquiry' },
      { status: 500 }
    );
  }
}