import { NextResponse } from 'next/server';
import { getFullNavigation } from '@/lib/railway/navigation-server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const requestedLang = (searchParams.get('lang') || 'en').toLowerCase();
    const lang = requestedLang === 'bg' ? 'bg' : 'en';

    const data = await getFullNavigation(lang);
    return NextResponse.json({ ok: true, data });
  } catch (error: any) {
    console.error('Failed to load full navigation:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Failed to load navigation' },
      { status: 500 }
    );
  }
}