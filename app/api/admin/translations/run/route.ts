import { NextResponse } from 'next/server';
import { runAllTranslations } from '@/lib/translation-manager';

export async function POST() {
  try {
    await runAllTranslations();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Batch translation failed:', error);
    return NextResponse.json(
      { error: error?.message || 'Unable to run translations' },
      { status: 500 }
    );
  }
}

