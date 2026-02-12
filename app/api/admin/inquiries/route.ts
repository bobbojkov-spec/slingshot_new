import { NextRequest, NextResponse } from 'next/server';
import { listInquiriesWithItems } from '@/lib/inquiries';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = Number(searchParams.get('limit') || '200');
  const includeArchived = searchParams.get('includeArchived') === 'true';
  const data = await listInquiriesWithItems(limit, includeArchived);
  return NextResponse.json({ success: true, data });
}