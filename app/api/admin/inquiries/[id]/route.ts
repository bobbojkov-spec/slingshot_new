import { NextRequest, NextResponse } from 'next/server';
import { deleteInquiry, getInquiry, getInquiryItems, setInquiryArchived, updateInquiryStatus } from '@/lib/inquiries';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const inquiry = await getInquiry(id);
  if (!inquiry) {
    return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
  }
  const items = await getInquiryItems(id);
  return NextResponse.json({ success: true, inquiry, items });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const payload = await request.json();
  if (payload.status) {
    await updateInquiryStatus(id, payload.status);
  }
  if (payload.isArchived !== undefined) {
    await setInquiryArchived(id, Boolean(payload.isArchived));
  }
  return NextResponse.json({ success: true });
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  await deleteInquiry(id);
  return NextResponse.json({ success: true });
}
