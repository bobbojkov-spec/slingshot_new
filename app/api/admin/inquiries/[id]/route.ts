import { NextRequest, NextResponse } from 'next/server';
import { deleteInquiry, getInquiry, getInquiryItems, setInquiryArchived, updateInquiryStatus } from '@/lib/inquiries';

type RouteContext = {
  params: { id: string };
};

export async function GET(_request: NextRequest, context: RouteContext) {
  const inquiry = await getInquiry(context.params.id);
  if (!inquiry) {
    return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
  }
  const items = await getInquiryItems(context.params.id);
  return NextResponse.json({ success: true, inquiry, items });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const payload = await request.json();
  if (payload.status) {
    await updateInquiryStatus(context.params.id, payload.status);
  }
  if (payload.isArchived !== undefined) {
    await setInquiryArchived(context.params.id, Boolean(payload.isArchived));
  }
  return NextResponse.json({ success: true });
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  await deleteInquiry(context.params.id);
  return NextResponse.json({ success: true });
}