import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const runtime = 'nodejs';

// GET - Fetch keywords for homepage display
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lang = searchParams.get('lang') || 'en';

    const result = await query(`
      SELECT
        hfk.tag_name_en as name_en,
        hfk.sort_order,
        t.name_bg,
        t.slug
      FROM homepage_featured_keywords hfk
      LEFT JOIN tags t ON lower(t.name_en) = lower(hfk.tag_name_en)
      ORDER BY hfk.sort_order ASC
      LIMIT 20
    `);

    const keywords = result.rows.map(row => ({
      name_en: row.name_en,
      name_bg: row.name_bg || row.name_en,
      slug: row.slug || row.name_en.toLowerCase().replace(/\s+/g, '-'),
    }));

    return NextResponse.json({ keywords });
  } catch (error: any) {
    console.error('Error fetching homepage keywords:', error);
    return NextResponse.json(
      { error: 'Failed to fetch homepage keywords', details: error?.message },
      { status: 500 }
    );
  }
}
